USE hospital_db;


-- can acess the doctor schedule using virtual table just SELECT * FROM doctor_schedule
CREATE VIEW doctor_schedule AS
SELECT
    d.doctor_id,
    d.name          AS doctor_name,
    d.specialization,
    a.appt_id,
    a.appt_date,
    a.appt_time,
    a.status,
    p.name          AS patient_name
FROM doctors d
JOIN appointments a ON a.doctor_id  = d.doctor_id
JOIN patients p     ON p.patient_id = a.patient_id;



CREATE VIEW patient_summary AS
SELECT
    p.patient_id,
    p.name          AS patient_name,
    p.blood_group,
    COUNT(DISTINCT a.appt_id)    AS total_appointments,
    COUNT(DISTINCT mr.record_id) AS total_records,
    COALESCE(SUM(b.amount), 0)   AS total_billed
FROM patients p
LEFT JOIN appointments    a  ON a.patient_id  = p.patient_id
LEFT JOIN medical_records mr ON mr.patient_id = p.patient_id
LEFT JOIN billing         b  ON b.patient_id  = p.patient_id
GROUP BY p.patient_id, p.name, p.blood_group;

CREATE VIEW unpaid_bills AS
SELECT
    b.bill_id,
    p.name      AS patient_name,
    b.amount,
    b.bill_type,
    b.bill_date
FROM billing b
JOIN patients p ON p.patient_id = b.patient_id
WHERE b.paid = FALSE;