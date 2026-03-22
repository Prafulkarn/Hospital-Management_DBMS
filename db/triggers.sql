USE hospital_db;
DELIMITER $$

CREATE TRIGGER after_patient_insert
AFTER INSERT ON patients
FOR EACH ROW
BEGIN
    INSERT INTO audit_log(action, table_name, record_id)
    VALUES ('INSERT', 'patients', NEW.patient_id);
END$$

CREATE TRIGGER after_appt_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        INSERT INTO audit_log(action, table_name, record_id)
        VALUES ('CANCELLED', 'appointments', NEW.appt_id);
    END IF;
END$$

CREATE TRIGGER before_appt_insert
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    DECLARE conflict INT;
    SELECT COUNT(*) INTO conflict
    FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND appt_date = NEW.appt_date
      AND appt_time = NEW.appt_time
      AND status    = 'Scheduled';

    IF conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trigger: Doctor slot already booked.';
    END IF;
END$$

DELIMITER ;