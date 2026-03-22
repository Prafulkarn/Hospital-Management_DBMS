const router = require('express').Router();
const db     = require('../db');

router.get('/unpaid', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM unpaid_bills');
  res.json(rows);
});

router.get('/', async (req, res) => {
  const [rows] = await db.query(`
    SELECT b.*, p.name AS patient_name
    FROM billing b
    JOIN patients p ON p.patient_id = b.patient_id
    ORDER BY b.bill_date DESC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, appt_id, amount } = req.body;
  await db.query('CALL GenerateBill(?, ?, ?)', [patient_id, appt_id, amount]);
  res.status(201).json({ message: 'Bill generated' });
});

router.put('/:id/pay', async (req, res) => {
  await db.query('UPDATE billing SET paid=TRUE WHERE bill_id=?', [req.params.id]);
  res.json({ message: 'Bill marked as paid' });
});

module.exports = router;