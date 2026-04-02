const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();
const { runMigrations } = require('./migrations');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/patients',     require('./routes/patients'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/departments',  require('./routes/departments'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/beds',         require('./routes/beds'));
app.use('/api/billing',      require('./routes/billing'));
app.use('/api/records',      require('./routes/records'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();