const router = require('express').Router();
const db     = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM patients ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
  res.json(rows[0]);
});

router.get('/:id/history', async (req, res) => {
  const [rows] = await db.query('CALL GetPatientHistory(?)', [req.params.id]);
  res.json(rows[0]);
});

router.get('/:id/summary', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM patient_summary WHERE patient_id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, dob, gender, phone, email, address, blood_group } = req.body;
  const [result] = await db.query(
    'INSERT INTO patients(name, dob, gender, phone, email, address, blood_group) VALUES (?,?,?,?,?,?,?)',
    [name, dob, gender, phone, email, address, blood_group]
  );
  res.status(201).json({ patient_id: result.insertId, message: 'Patient registered' });
});

router.put('/:id', async (req, res) => {
  const { name, phone, email, address } = req.body;
  await db.query(
    'UPDATE patients SET name=?, phone=?, email=?, address=? WHERE patient_id=?',
    [name, phone, email, address, req.params.id]
  );
  res.json({ message: 'Patient updated' });
});

module.exports = router;