-- ============================================================
--  HOSPITAL MANAGEMENT SYSTEM - SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

CREATE TABLE departments (
    dept_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(100)
);

CREATE TABLE doctors (
    doctor_id       INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) UNIQUE,
    email           VARCHAR(100) UNIQUE,
    dept_id         INT,
    available       BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE TABLE patients (
    patient_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    dob         DATE,
    gender      ENUM('Male','Female','Other'),
    phone       VARCHAR(15) UNIQUE,
    email       VARCHAR(100),
    address     TEXT,
    blood_group VARCHAR(5),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE beds (
    bed_id      INT AUTO_INCREMENT PRIMARY KEY,
    ward        VARCHAR(50) NOT NULL,
    bed_number  VARCHAR(10) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE appointments (
    appt_id     INT AUTO_INCREMENT PRIMARY KEY,
    patient_id  INT NOT NULL,
    doctor_id   INT NOT NULL,
    appt_date   DATE NOT NULL,
    appt_time   TIME NOT NULL,
    status      ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)
);

CREATE TABLE medical_records (
    record_id       INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    doctor_id       INT NOT NULL,
    appt_id         INT,
    diagnosis       TEXT,
    prescription    TEXT,
    record_date     DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id),
    FOREIGN KEY (appt_id)    REFERENCES appointments(appt_id)
);

CREATE TABLE billing (
    bill_id     INT AUTO_INCREMENT PRIMARY KEY,
    patient_id  INT NOT NULL,
    appt_id     INT,
    amount      DECIMAL(10,2) NOT NULL,
    paid        BOOLEAN DEFAULT FALSE,
    bill_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (appt_id)    REFERENCES appointments(appt_id)
);

CREATE TABLE audit_log (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    action      VARCHAR(100),
    table_name  VARCHAR(50),
    record_id   INT,
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_name ON patients(name);
CREATE INDEX idx_appt_date    ON appointments(appt_date);
CREATE INDEX idx_doctor_dept  ON doctors(dept_id);