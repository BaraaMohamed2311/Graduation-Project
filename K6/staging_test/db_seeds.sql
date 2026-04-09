-- ==============================================================================
--              DYNAMIC ID SEEDING FOR TESTING PURPOSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS seed_locks (
    lock_name VARCHAR(100) PRIMARY KEY,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP PROCEDURE IF EXISTS run_seeds;

DELIMITER $$

CREATE PROCEDURE run_seeds()
BEGIN
    IF EXISTS (SELECT 1 FROM seed_locks WHERE lock_name = 'initial_seed') THEN
        SELECT 'Seeds already applied, skipping.' AS message;
    ELSE
        INSERT INTO seed_locks (lock_name) VALUES ('initial_seed');

        -- ==========================================
        -- SUPER ADMIN 1 (10 USERS)
        -- ==========================================
        SET @i = 1;
        WHILE @i <= 10 DO

            INSERT INTO users (user_email, user_name, user_password, user_type)
            VALUES (CONCAT('super1_', @i, '@test.com'), 'Super Admin 1',
            '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

            SET @u = LAST_INSERT_ID();

            INSERT INTO employees (emp_id, emp_salary, emp_title)
            VALUES (@u, 10000, 'Doctor')
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO roles (emp_id, role_name)
            VALUES (@u, 'SuperAdmin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO employee_perms (perm_id, emp_id)
            SELECT perm_id, @u FROM perms
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title)
            VALUES (@u, @u, 'Doctor')
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO hospital_roles (hosp_emp_id, role_name)
            VALUES (@u, 'SuperAdmin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
            SELECT perm_id, @u FROM hospital_perms
            ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;

            SET @i = @i + 1;
        END WHILE;


        -- ==========================================
        -- SUPER ADMIN 2 (10 USERS)
        -- ==========================================
        SET @i = 1;
        WHILE @i <= 10 DO

            INSERT INTO users (user_email, user_name, user_password, user_type)
            VALUES (CONCAT('super2_', @i, '@test.com'), 'Super Admin 2',
            '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

            SET @u = LAST_INSERT_ID();

            INSERT INTO employees VALUES (@u, 10000, 0,0,0, 'Surgeon', NULL)
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO roles VALUES (@u, 'SuperAdmin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO employee_perms (perm_id, emp_id)
            SELECT perm_id, @u FROM perms
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO employees_hospital VALUES (@u, @u, 'Surgeon')
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO hospital_roles VALUES (@u, 'SuperAdmin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
            SELECT perm_id, @u FROM hospital_perms
            ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;

            SET @i = @i + 1;
        END WHILE;


        -- ==========================================
        -- ADMIN (10 USERS)
        -- ==========================================
        SET @i = 1;
        WHILE @i <= 10 DO

            INSERT INTO users (user_email, user_name, user_password, user_type)
            VALUES (CONCAT('admin_', @i, '@test.com'), 'Admin User',
            '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'employee');

            SET @u = LAST_INSERT_ID();

            INSERT INTO employees VALUES (@u, 5000, 0,0,0, 'Nurse', NULL)
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO roles VALUES (@u, 'Admin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO employee_perms (perm_id, emp_id) VALUES
            (1,@u),(3,@u),(4,@u)
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO employees_hospital VALUES (@u, @u, 'Admin')
            ON DUPLICATE KEY UPDATE emp_id=emp_id;

            INSERT INTO hospital_roles VALUES (@u, 'Admin')
            ON DUPLICATE KEY UPDATE role_name=role_name;

            INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id) VALUES
            (1,@u),(3,@u),(7,@u)
            ON DUPLICATE KEY UPDATE hosp_emp_id=hosp_emp_id;

            SET @i = @i + 1;
        END WHILE;


        -- ==========================================
        -- PATIENT (10 USERS)
        -- ==========================================
        SET @i = 1;
        WHILE @i <= 10 DO

            INSERT INTO users (user_email, user_name, user_password, user_type)
            VALUES (CONCAT('patient_', @i, '@test.com'), 'Normal Patient',
            '$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae', 'patient');

            SET @u = LAST_INSERT_ID();

            INSERT INTO patients (user_id, patient_phone, patient_address, patient_gender)
            VALUES (@u, '01000000000', 'Test Address', 'Male')
            ON DUPLICATE KEY UPDATE user_id=user_id;

            SET @i = @i + 1;
        END WHILE;

    END IF;
END$$

DELIMITER ;

CALL run_seeds();
DROP PROCEDURE IF EXISTS run_seeds;