const db = require('./db');

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0].count>0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureBedSchema() {
  await addColumnIfMissing('beds', 'daily_rate', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
  await addColumnIfMissing('beds', 'patient_id', 'INT UNIQUE NULL');
  await addColumnIfMissing('beds', 'allocated_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing('beds', 'released_at', 'TIMESTAMP NULL DEFAULT NULL');

  const hasPatientFk = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'beds'
       AND COLUMN_NAME = 'patient_id'
       AND REFERENCED_TABLE_NAME = 'patients'`
  );

  if (hasPatientFk[0][0].count === 0) {
    try {
      await db.query('ALTER TABLE beds ADD CONSTRAINT fk_beds_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL');
    } catch (err) {
      if (!/Duplicate|already exists/i.test(err.message)) {
        throw err;
      }
    }
  }
}

async function ensureBillingSchema() {
  await addColumnIfMissing('billing', 'bill_type', "VARCHAR(20) NOT NULL DEFAULT 'Manual'");
  await addColumnIfMissing('billing', 'is_insured', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfMissing('billing', 'insurance_percentage', 'DECIMAL(5,2) DEFAULT 0.00');
  await addColumnIfMissing('billing', 'final_amount', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
}

async function runMigrations() {
  await ensureBedSchema();
  await ensureBillingSchema();
}

module.exports = { runMigrations };