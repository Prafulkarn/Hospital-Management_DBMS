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
  
  // Ensure final_amount is calculated for existing records
  for (let bill of rows) {
    if (!bill.final_amount) {
      bill.final_amount = bill.amount;
    }
  }
  
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, appt_id, amount, is_insured, insurance_percentage } = req.body;
  
  let finalAmount = parseFloat(amount);
  if (is_insured && insurance_percentage > 0) {
    const deduction = (finalAmount * insurance_percentage) / 100;
    finalAmount = finalAmount - deduction;
  }
  
  await db.query(
    'INSERT INTO billing (patient_id, appt_id, amount, is_insured, insurance_percentage, final_amount, bill_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [patient_id, appt_id, amount, is_insured ? 1 : 0, insurance_percentage || 0, finalAmount, 'Manual']
  );
  res.status(201).json({ message: 'Bill generated', finalAmount });
});

router.put('/:id/pay', async (req, res) => {
  await db.query('UPDATE billing SET paid=TRUE WHERE bill_id=?', [req.params.id]);
  res.json({ message: 'Bill marked as paid' });
});

module.exports = router;