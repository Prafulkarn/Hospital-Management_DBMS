const router = require('express').Router();
const db = require('../db');

const defaultWardRates = {
  General: 1000,
  Isolated: 1800,
  ICU: 3500,
};

function calculateStayDays(start, end) {
  if (!start || !end) return 0;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

async function getBedById(bedId) {
  const [rows] = await db.query(
    `SELECT b.*, p.name AS patient_name
     FROM beds b
     LEFT JOIN patients p ON p.patient_id = b.patient_id
     WHERE b.bed_id = ?`,
    [bedId]
  );
  return rows[0] || null;
}

router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ward,
        COUNT(*) AS total_beds,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) AS available_beds,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied_beds,
        ROUND(AVG(daily_rate), 2) AS avg_daily_rate
      FROM beds
      GROUP BY ward
      ORDER BY ward
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/available/count', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied
      FROM beds
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patient/:patientId/current', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         b.*,
         p.name AS patient_name,
         GREATEST(1, TIMESTAMPDIFF(DAY, b.allocated_at, NOW()) + 1) AS stay_days,
         ROUND(GREATEST(1, TIMESTAMPDIFF(DAY, b.allocated_at, NOW()) + 1) * b.daily_rate, 2) AS estimated_charge
       FROM beds b
       JOIN patients p ON p.patient_id = b.patient_id
       WHERE b.patient_id = ? AND b.is_occupied = TRUE
       LIMIT 1`,
      [req.params.patientId]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filters = [];
    const params = [];

    if (req.query.ward) {
      filters.push('b.ward = ?');
      params.push(req.query.ward);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await db.query(
      `SELECT
         b.*,
         p.name AS patient_name,
         p.patient_id AS allocated_patient_id,
         CASE
           WHEN b.is_occupied = TRUE AND b.allocated_at IS NOT NULL
           THEN GREATEST(1, TIMESTAMPDIFF(DAY, b.allocated_at, NOW()) + 1)
           ELSE 0
         END AS stay_days,
         CASE
           WHEN b.is_occupied = TRUE AND b.allocated_at IS NOT NULL
           THEN ROUND(GREATEST(1, TIMESTAMPDIFF(DAY, b.allocated_at, NOW()) + 1) * b.daily_rate, 2)
           ELSE 0
         END AS current_charge
       FROM beds b
       LEFT JOIN patients p ON p.patient_id = b.patient_id
       ${whereClause}
       ORDER BY b.ward, b.bed_number`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bed = await getBedById(req.params.id);
    if (!bed) return res.status(404).json({ error: 'Bed not found' });
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ward, bed_number, daily_rate } = req.body;
    const rate = daily_rate !== undefined && daily_rate !== ''
      ? daily_rate
      : (defaultWardRates[ward] || 0);

    await db.query(
      'INSERT INTO beds (ward, bed_number, daily_rate) VALUES (?, ?, ?)',
      [ward, bed_number, rate]
    );
    res.status(201).json({ message: 'Bed added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { ward, bed_number, daily_rate } = req.body;
    await db.query(
      'UPDATE beds SET ward = ?, bed_number = ?, daily_rate = ? WHERE bed_id = ?',
      [ward, bed_number, daily_rate, req.params.id]
    );
    res.json({ message: 'Bed updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/allocate', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'Patient is required.' });

    await connection.beginTransaction();

    const [patientRows] = await connection.query('SELECT patient_id FROM patients WHERE patient_id = ?', [patient_id]);
    if (!patientRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const [activeRows] = await connection.query(
      'SELECT bed_id FROM beds WHERE patient_id = ? AND is_occupied = TRUE LIMIT 1 FOR UPDATE',
      [patient_id]
    );
    if (activeRows.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'Patient already has an allocated bed.' });
    }

    const [bedRows] = await connection.query(
      'SELECT bed_id, is_occupied FROM beds WHERE bed_id = ? FOR UPDATE',
      [req.params.id]
    );
    const bed = bedRows[0];
    if (!bed) {
      await connection.rollback();
      return res.status(404).json({ error: 'Bed not found.' });
    }
    if (bed.is_occupied) {
      await connection.rollback();
      return res.status(409).json({ error: 'Bed is already occupied.' });
    }

    await connection.query(
      `UPDATE beds
       SET patient_id = ?, is_occupied = TRUE, allocated_at = NOW(), released_at = NULL
       WHERE bed_id = ?`,
      [patient_id, req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Bed allocated successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.post('/:id/release', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [bedRows] = await connection.query(
      `SELECT b.bed_id, b.patient_id, b.ward, b.bed_number, b.daily_rate, b.allocated_at, p.name AS patient_name
       FROM beds b
       LEFT JOIN patients p ON p.patient_id = b.patient_id
       WHERE b.bed_id = ? AND b.is_occupied = TRUE
       FOR UPDATE`,
      [req.params.id]
    );

    const bed = bedRows[0];
    if (!bed) {
      await connection.rollback();
      return res.status(404).json({ error: 'Occupied bed not found.' });
    }

    const releasedAt = new Date();
    const stayDays = calculateStayDays(bed.allocated_at, releasedAt);
    const charge = Number((stayDays * Number(bed.daily_rate || 0)).toFixed(2));

    await connection.query(
      `UPDATE beds
       SET patient_id = NULL, is_occupied = FALSE, released_at = NOW(), allocated_at = NULL
       WHERE bed_id = ?`,
      [req.params.id]
    );

    if (charge > 0) {
      await connection.query(
        'INSERT INTO billing (patient_id, appt_id, amount, bill_type) VALUES (?, NULL, ?, ?)',
        [bed.patient_id, charge, 'Bed']
      );
    }

    await connection.commit();
    res.json({
      message: 'Bed released successfully',
      patient_name: bed.patient_name,
      stay_days: stayDays,
      charge,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM beds WHERE bed_id = ?', [req.params.id]);
    res.json({ message: 'Bed deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
