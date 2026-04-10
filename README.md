# 🏥 MediCore — Hospital Management System

A full-stack Hospital Management System built with **Node.js + Express + MySQL + Vanilla JS**.
Manage patients, doctors, appointments, billing and medical records through a clean web interface.

---

## 📸 Features

- 🏠 Dashboard with live stats
- 🧑 Patient registration and history
- 👨‍⚕️ Doctor directory and schedules
- 📅 Appointment booking ,bed allocation with conflict detection
- 💳 Billing and payment tracking also insurance facility 
- 🔒 Audit logging via database triggers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL |
| Backend | Node.js + Express |
| Frontend | HTML, CSS, Vanilla JS |

---

## ✅ Prerequisites

Make sure these are installed on your machine before starting:

| Tool | Download Link |
|---|---|
| Node.js (v18+) | https://nodejs.org |
| MySQL (v8+) | https://dev.mysql.com/downloads/ |
| Git | https://git-scm.com |

---

## 🚀 How to Run Locally

### Step 1 — Clone the Repository

```bash
git clone https://github.com/github-1703/your-repo-name.git
cd your-repo-name
```

---

### Step 2 — Set Up the Database

Open your Terminal and run these commands one by one.
Enter your MySQL password each time when prompted.

```bash
mysql -u root -p -e "CREATE DATABASE hospital_db;"
mysql -u root -p hospital_db < db/schema.sql
mysql -u root -p hospital_db < db/procedures.sql
mysql -u root -p hospital_db < db/triggers.sql
mysql -u root -p hospital_db < db/views.sql
mysql -u root -p hospital_db < db/seed.sql
```

> ⚠️ Make sure you run these from inside the project folder.

---

### Step 3 — Create the Environment File

Go inside the `backend/` folder and create a file named `.env`:

```bash
cd backend
touch .env
```

Open `.env` and add the following — replace the password with your own MySQL password:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_db
PORT=3000
```

> ⚠️ If you have no MySQL password, leave `DB_PASSWORD=` blank.

---

### Step 4 — Install Dependencies

```bash
npm install
```

---

### Step 5 — Start the Server

```bash
npm run dev
```

You should see:
```
✅ Server running at http://localhost:3000
```

---

### Step 6 — Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## 📁 Project Structure

```
hospital-mgmt/
├── db/
│   ├── schema.sql         ← All tables + indexes
│   ├── procedures.sql     ← Stored procedures
│   ├── triggers.sql       ← Triggers
│   ├── views.sql          ← Views
│   └── seed.sql           ← Sample data
│
├── backend/
│   ├── server.js          ← Express entry point
│   ├── db.js              ← MySQL connection
│   ├── .env               ← Your credentials (create this)
│   ├── package.json
│   └── routes/
│       ├── patients.js
│       ├── doctors.js
│       ├── appointments.js
│       ├── billing.js
│       └── records.js
│
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js
        ├── app.js
        ├── dashboard.js
        ├── patients.js
        ├── doctors.js
        ├── appointments.js
        └── billing.js
```

---

## 🗄️ SQL Concepts Used

| Concept | Where Used |
|---|---|
| **Joins** | Appointments, Doctors, Patient history |
| **Stored Procedures** | BookAppointment, GenerateBill, GetPatientHistory |
| **Triggers** | Auto logging on insert and cancel |
| **Views** | doctor_schedule, patient_summary, unpaid_bills |
| **Indexes** | patient name, appointment date, doctor dept |

---

## 🐛 Troubleshooting

**Cannot connect to MySQL**
→ Make sure MySQL is running and your `.env` password is correct.

**Port 3000 already in use**
→ Change `PORT=3001` in your `.env` file.

**mysql command not found (Mac)**
→ Run this in Terminal first:
```bash
export PATH=$PATH:/usr/local/mysql/bin
```

**npm: command not found**
→ Node.js is not installed. Download from https://nodejs.org

**SQL error on import**
→ Make sure you run the SQL files in this exact order:
`schema → procedures → triggers → views → seed`

---
