-- ==============================================================================
--              DYNAMIC ID SEEDING FOR TESTING PURPOSES
-- ==============================================================================
-- The lock table acts as a one-time flag — the procedure inserts into seed_locks on first run, 
-- and every subsequent run hits the IF EXISTS check and exits immediately. Since lock_name is a PRIMARY KEY, 
-- even if two processes race to run the seed simultaneously, 
-- only one will succeed on the INSERT INTO seed_locks and the other will get a duplicate key error.

-- Create a lock table to prevent re-seeding
CREATE TABLE IF NOT EXISTS seed_locks (
    lock_name VARCHAR(100) PRIMARY KEY,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abort the entire script if seed already ran
-- (MySQL doesn't support IF at top level, so we use a procedure)
DROP PROCEDURE IF EXISTS run_seeds;

DELIMITER $$

CREATE PROCEDURE run_seeds()
BEGIN
    -- If already seeded, do nothing
    IF EXISTS (SELECT 1 FROM seed_locks WHERE lock_name = 'initial_seed') THEN
        SELECT 'Seeds already applied, skipping.' AS message;
    ELSE
        -- Claim the lock first
        INSERT INTO seed_locks (lock_name) VALUES ('initial_seed');

        -- ==========================================
        -- SUPER ADMIN 1
        -- ==========================================
        INSERT INTO users (user_email, user_name, user_password, user_type)
        VALUES ('super1@test.com', 'Super Admin 1', '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

        SET @u1 = LAST_INSERT_ID();

        INSERT INTO employees (emp_id, emp_salary, emp_title)
        VALUES (@u1, 10000, 'Doctor')
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO roles (emp_id, role_name)
        VALUES (@u1, 'SuperAdmin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO employee_perms (perm_id, emp_id)
        SELECT perm_id, @u1 FROM perms
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title)
        VALUES (@u1, @u1, 'Doctor')
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO hospital_roles (hosp_emp_id, role_name)
        VALUES (@u1, 'SuperAdmin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
        SELECT perm_id, @u1 FROM hospital_perms
        ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;


        -- ==========================================
        -- SUPER ADMIN 2
        -- ==========================================
        INSERT INTO users (user_email, user_name, user_password, user_type)
        VALUES ('super2@test.com', 'Super Admin 2', '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

        SET @u2 = LAST_INSERT_ID();

        INSERT INTO employees VALUES (@u2, 10000, 0,0,0, 'Surgeon', NULL)
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO roles VALUES (@u2, 'SuperAdmin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO employee_perms (perm_id, emp_id)
        SELECT perm_id, @u2 FROM perms
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO employees_hospital VALUES (@u2, @u2, 'Surgeon')
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO hospital_roles VALUES (@u2, 'SuperAdmin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
        SELECT perm_id, @u2 FROM hospital_perms
        ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;


        -- ==========================================
        -- ADMIN
        -- ==========================================
        INSERT INTO users (user_email, user_name, user_password, user_type)
        VALUES ('admin@test.com', 'Admin User', '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

        SET @u3 = LAST_INSERT_ID();

        INSERT INTO employees VALUES (@u3, 5000, 0,0,0, 'Nurse', NULL)
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO roles VALUES (@u3, 'Admin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO employee_perms (perm_id, emp_id) VALUES
        (1,@u3),(3,@u3),(4,@u3)
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO employees_hospital VALUES (@u3, @u3, 'Admin')
        ON DUPLICATE KEY UPDATE emp_id=emp_id;

        INSERT INTO hospital_roles VALUES (@u3, 'Admin')
        ON DUPLICATE KEY UPDATE role_name=role_name;

        INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id) VALUES
        (1,@u3),(3,@u3),(7,@u3)
        ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;


        -- ==========================================
        -- PATIENT
        -- ==========================================
        INSERT INTO users (user_email, user_name, user_password, user_type)
        VALUES ('patient@test.com', 'Normal Patient', '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'patient');

        SET @u4 = LAST_INSERT_ID();

        INSERT INTO patients (user_id, patient_phone, patient_address, patient_gender)
        VALUES (@u4, '01000000000', 'Test Address', 'Male')
        ON DUPLICATE KEY UPDATE user_id=user_id;

    END IF;
END$$

DELIMITER ;

CALL run_seeds();
DROP PROCEDURE IF EXISTS run_seeds;