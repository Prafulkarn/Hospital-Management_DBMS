const router = require('express').Router();
const db     = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`
    SELECT d.*, dept.name AS department_name
    FROM doctors d
    LEFT JOIN departments dept ON dept.dept_id = d.dept_id
  `);
  res.json(rows);
});

router.get('/:id/schedule', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM doctor_schedule WHERE doctor_id = ? ORDER BY appt_date, appt_time',
    [req.params.id]
  );
  res.json(rows);
});

router.get('/departments/all', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM departments');
  res.json(rows);
});

module.exports = router;