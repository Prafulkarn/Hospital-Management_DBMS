USE hospital_db;

INSERT INTO departments(name, location) VALUES
('Cardiology',  'Block A'),
('Neurology',   'Block B'),
('Orthopedics', 'Block C'),
('General',     'Block D');

INSERT INTO doctors(name, specialization, phone, email, dept_id) VALUES
('Dr. Arjun Sharma',   'Cardiologist',     '9800000001', 'arjun@hospital.com',  1),
('Dr. Priya Thapa',    'Neurologist',      '9800000002', 'priya@hospital.com',  2),
('Dr. Ramesh KC',      'Orthopedic',       '9800000003', 'ramesh@hospital.com', 3),
('Dr. Sita Rai',       'General Physician','9800000004', 'sita@hospital.com',   4);

INSERT INTO beds(ward, bed_number, daily_rate) VALUES
('General','G-01', 1000.00),
('General','G-02', 1000.00),
('Isolated','ISO-01', 1800.00),
('ICU','I-01', 3500.00),
('ICU','I-02', 3500.00);

INSERT INTO patients(name, dob, gender, phone, email, blood_group) VALUES
('Ram Bahadur', '1990-05-10', 'Male',   '9811111111', 'ram@mail.com',  'O+'),
('Sita Devi',   '1985-08-22', 'Female', '9811111112', 'sita@mail.com', 'A+'),
('Hari Prasadd', '2000-01-15', 'Male',   '9811111113', 'hari@mail.com', 'B+');


INSERT INTO appointments(patient_id, doctor_id, appt_date, appt_time, status) VALUES
(1, 1, CURDATE(), '10:00:00', 'Scheduled'),
(2, 2, CURDATE(), '11:00:00', 'Scheduled'),
(3, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'Scheduled');