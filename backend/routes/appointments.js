const router = require('express').Router();
const db     = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`
    SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization
    FROM appointments a
    JOIN patients p ON p.patient_id = a.patient_id
    JOIN doctors  d ON d.doctor_id  = a.doctor_id
    ORDER BY a.appt_date DESC, a.appt_time DESC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, doctor_id, appt_date, appt_time, notes } = req.body;
  try {
    await db.query('CALL BookAppointment(?, ?, ?, ?, ?)', [
      patient_id, doctor_id, appt_date, appt_time, notes || null
    ]);
    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  await db.query("UPDATE appointments SET status='Cancelled' WHERE appt_id=?", [req.params.id]);
  res.json({ message: 'Appointment cancelled' });
});

router.put('/:id/complete', async (req, res) => {
  await db.query("UPDATE appointments SET status='Completed' WHERE appt_id=?", [req.params.id]);
  res.json({ message: 'Appointment marked as completed' });
});

module.exports = router;