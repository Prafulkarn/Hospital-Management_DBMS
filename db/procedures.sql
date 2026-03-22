USE hospital_db;
DELIMITER $$

CREATE PROCEDURE BookAppointment(
    IN p_patient_id INT,
    IN p_doctor_id  INT,
    IN p_date       DATE,
    IN p_time       TIME,
    IN p_notes      TEXT
)
BEGIN
    DECLARE conflict INT;
    SELECT COUNT(*) INTO conflict
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appt_date = p_date
      AND appt_time = p_time
      AND status = 'Scheduled';

    IF conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor already has an appointment at this time.';
    ELSE
        INSERT INTO appointments(patient_id, doctor_id, appt_date, appt_time, notes)
        VALUES (p_patient_id, p_doctor_id, p_date, p_time, p_notes);
    END IF;
END$$

CREATE PROCEDURE GenerateBill(
    IN p_patient_id INT,
    IN p_appt_id    INT,
    IN p_amount     DECIMAL(10,2)
)
BEGIN
    INSERT INTO billing(patient_id, appt_id, amount)
    VALUES (p_patient_id, p_appt_id, p_amount);
END$$

CREATE PROCEDURE GetPatientHistory(IN p_patient_id INT)
BEGIN
    SELECT
        a.appt_id,
        a.appt_date,
        a.appt_time,
        a.status,
        d.name        AS doctor_name,
        d.specialization,
        mr.diagnosis,
        mr.prescription,
        b.amount,
        b.paid
    FROM appointments a
    JOIN doctors d             ON a.doctor_id  = d.doctor_id
    LEFT JOIN medical_records mr ON mr.appt_id = a.appt_id
    LEFT JOIN billing b          ON b.appt_id  = a.appt_id
    WHERE a.patient_id = p_patient_id
    ORDER BY a.appt_date DESC;
END$$

DELIMITER ;