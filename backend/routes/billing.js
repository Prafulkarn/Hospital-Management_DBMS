const router = require('express').Router();
const db     = require('../db');

function computeFinalAmount(amount, isInsured, insurancePercentage) {
  const baseAmount = Number.parseFloat(amount);
  const pct = Number.parseFloat(insurancePercentage) || 0;

  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new Error('Amount must be a valid non-negative number');
  }

  if (isInsured && (pct < 0 || pct > 100)) {
    throw new Error('Insurance percentage must be between 0 and 100');
  }

  const deduction = isInsured && pct > 0 ? (baseAmount * pct) / 100 : 0;
  return Number((baseAmount - deduction).toFixed(2));
}

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

  const normalizedPatientId = Number.parseInt(patient_id, 10);
  const normalizedApptId = appt_id === null || appt_id === '' ? null : Number.parseInt(appt_id, 10);
  const insured = Boolean(is_insured);

  if (!Number.isInteger(normalizedPatientId) || normalizedPatientId <= 0) {
    return res.status(400).json({ error: 'Valid patient_id is required' });
  }

  if (normalizedApptId !== null && (!Number.isInteger(normalizedApptId) || normalizedApptId <= 0)) {
    return res.status(400).json({ error: 'appt_id must be a valid number when provided' });
  }

  let finalAmount;
  try {
    finalAmount = computeFinalAmount(amount, insured, insurance_percentage);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  await db.query(
    'INSERT INTO billing (patient_id, appt_id, amount, is_insured, insurance_percentage, final_amount, bill_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [normalizedPatientId, normalizedApptId, Number.parseFloat(amount), insured ? 1 : 0, Number.parseFloat(insurance_percentage) || 0, finalAmount, 'Manual']
  );
  res.status(201).json({ message: 'Bill generated', finalAmount });
});

router.put('/:id/pay', async (req, res) => {
  await db.query('UPDATE billing SET paid=TRUE WHERE bill_id=?', [req.params.id]);
  res.json({ message: 'Bill marked as paid' });
});

module.exports = router;