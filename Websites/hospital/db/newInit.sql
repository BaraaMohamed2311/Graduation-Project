-- ==========================================
-- Unified users Table (Must be created)

-- DROP TABLE IF EXISTS users;
-- CREATE TABLE users (
    -- user_id INT AUTO_INCREMENT PRIMARY KEY,
    -- user_email varchar(255) NOT NULL,
    -- user_name varchar(255) NOT NULL,
	-- user_password varchar(255) NOT NULL,
    -- user_type ENUM('patient', 'employee') NOT NULL,
    -- created_at TIMESTAMP DEFAULT NOW(),
    -- latest_update TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
    
-- );


-- ==========================================
-- Employees_Hospital (Bridge Table to store all employees_hospital ids in one place)

DROP TABLE IF EXISTS employees_hospital;
CREATE TABLE employees_hospital (
    hosp_emp_id INT NOT NULL PRIMARY KEY , 
    emp_id INT NOT NULL UNIQUE,
    emp_title ENUM('Doctor', 'Surgeon', 'Nurse','Employee') NOT NULL, -- Employee refers to non-hospital staff
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
	UNIQUE (hosp_emp_id, emp_title), -- that's why combination has to be unique
    FOREIGN KEY (hosp_emp_id) REFERENCES users(user_id) ON DELETE CASCADE
);



-- ==========================================
-- Doctors

DROP TABLE IF EXISTS doctors;
CREATE TABLE doctors (
    doctor_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Surgeons

DROP TABLE IF EXISTS surgeons;
CREATE TABLE surgeons (
    surgeon_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    surgery_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (surgeon_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Nurses

DROP TABLE IF EXISTS nurses;
CREATE TABLE nurses (
    nurse_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,  
    floor_number INT NOT NULL DEFAULT -1,
    FOREIGN KEY (nurse_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ==========================================
-- patients

DROP TABLE IF EXISTS patients;
CREATE TABLE patients (
    patient_id INT PRIMARY KEY,     -- unique patient ID
    patient_phone VARCHAR(20) ,
    patient_address VARCHAR(255),
    isAssignedToRoom BOOLEAN DEFAULT FALSE,  
    room_number INT NOT NULL DEFAULT -1,
    floor_number INT NOT NULL DEFAULT -1,
    date_of_birth DATE,
    next_check_date DATE,
    patient_gender ENUM('Male', 'Female', 'Other'),
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE
);





-- ==========================================
-- doctor_patient (Map  doctors to patients)

DROP TABLE IF EXISTS staff_patient;
CREATE TABLE staff_patient (
    staff_id INT NOT NULL,     
    patient_id INT NOT NULL,
    relation_type ENUM('Doctor', 'Surgeon', 'Nurse', 'Employee') NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (staff_id, patient_id, relation_type),

    FOREIGN KEY (staff_id) REFERENCES employees_hospital(emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



-- ====================================================================================
--          Time/Schedule Related Tables
-- ====================================================================================


-- ==========================================
-- availability


DROP TABLE IF EXISTS availability;
CREATE TABLE availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,   -- unique slot id
    hosp_emp_id INT NOT NULL,                           -- FK to doctors
    day_of_week TINYINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,                         -- when shift starts
    end_time TIME NOT NULL,                           -- when shift ends
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_availability
        FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE


);

-- ==========================================
-- consultations

DROP TABLE IF EXISTS consultations;
CREATE TABLE consultations (
    consultation_id INT AUTO_INCREMENT PRIMARY KEY,
    hosp_emp_id INT NOT NULL,                       -- unified reference for doctor/surgeon
    patient_id INT NULL,                            -- patient assigned (if any)
    availability_id INT NOT NULL,                   -- link to shift slot
    consultation_date DATETIME NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    consultation_status ENUM('Available','Scheduled','Completed','Cancelled') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consultation_type ENUM('initial_consultation_price', 'followup_consultation_price') NOT NULL,
    FOREIGN KEY (hosp_emp_id)
        REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (patient_id)
        REFERENCES users(user_id) -- Refrences users not patients as we want any logged in user to be able to book a consultion
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (availability_id)
        REFERENCES availability(availability_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- prevent double-booking same hospital employee at same time
    UNIQUE (hosp_emp_id, consultation_date, start_time)
);


-- ====================================================================================
--          Managing Related Tables
-- ====================================================================================

-- ==========================================
-- Hospital Roles

DROP TABLE IF EXISTS hospital_roles;
CREATE TABLE hospital_roles (
  hosp_emp_id INT NOT NULL,
  role_name ENUM('NormalUser','Admin','SuperAdmin') NOT NULL,
  PRIMARY KEY (hosp_emp_id, role_name),
  FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ==========================================
-- Hospital Permissions

DROP TABLE IF EXISTS hospital_perms;
CREATE TABLE hospital_perms (
  perm_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  perm_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- ==========================================
-- Hospital Employee → Permissions (bridge)

DROP TABLE IF EXISTS hospital_emp_perms;
CREATE TABLE hospital_emp_perms (
  perm_id INT NOT NULL,
  hosp_emp_id INT NOT NULL,
  UNIQUE KEY (perm_id, hosp_emp_id),
  FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
  FOREIGN KEY (perm_id) REFERENCES hospital_perms(perm_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);





-- ====================================================================================
--          Rooms Related Tables
-- ====================================================================================

-- ==========================================
-- Hospital Floors

DROP TABLE IF EXISTS floors;
CREATE TABLE floors (
    floor_id INT AUTO_INCREMENT PRIMARY KEY,
    floor_number INT NOT NULL UNIQUE
);



-- ==========================================
-- Hospital Rooms 


DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number INT NOT NULL,
    floor_id INT NOT NULL,
    patient_id INT DEFAULT NULL,
    isOccupied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE (room_number, floor_id) -- prevent duplicate room numbers on the same floor
);





---====================================================================================
---             Insertions
---====================================================================================





-- ==========================================
-- Insert Hospital Rooms and Floors
-- ==========================================


-- Insert 3 rooms per floor (floor_id corresponds to the inserted floors above)
-- Floors assumed to exist: floor_id 1..5 and all are empty
INSERT INTO floors (floor_number)
VALUES (1), (2), (3), (4), (5);

INSERT INTO rooms (room_number, floor_id, patient_id, isOccupied) VALUES
(1, 1, NULL, FALSE),
(2, 1, NULL, FALSE),
(3, 1, NULL, FALSE),

(1, 2, NULL, FALSE),
(2, 2, NULL, FALSE),
(3, 2, NULL, FALSE),

(1, 3, NULL, FALSE),
(2, 3, NULL, FALSE),
(3, 3, NULL, FALSE),

(1, 4, NULL, FALSE),
(2, 4, NULL, FALSE),
(3, 4, NULL, FALSE),

(1, 5, NULL, FALSE),
(2, 5, NULL, FALSE),
(3, 5, NULL, FALSE);


-- ==============================================
--              Users
-- ==============================================
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (1,'ali.hamed2464@gmail.com','Ali Hamed','$2b$12$XUxExC4fNH59oWlS69ddEOTXSiNhx5DuU7HFYnVhCoOxiY15j0YK2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (2,'amr.halim2136@gmail.com','Amr Halim','$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (3,'amr.halim2594@gmail.com','Amr Halim','$2b$12$6sw9sbojnAHOJ0qsCHaIT.a3.QQIXHs1Y.gp6I2N3fcSArv89jW1K','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (4,'amr.halim3433@gmail.com','Amr Halim','$2b$12$5MNPadUmiBjcqlA5TNnqyu93w7aTlkT5Vt3E5oLX/cLEnwqcJpDIu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (5,'amr.halim4050@gmail.com','Amr Halim','$2b$12$oltJ2.AP2T6Fju05FinT6ePpJAqUC0CxhppX1dNnPUbCAfN0IhUDa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (6,'amr.halim4326@gmail.com','Amr Halim','$2b$12$sCW22Lhl5Pn3zyT4ddQaye6cEGrYggkyLvUXG40FMaCl5j2Qdq62.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (7,'amr.halim4982@gmail.com','Amr Halim','$2b$12$3kUdLlBZUZj6kAKNwk2ekejwfuyloYxH8rbfl5cpg0m0J5Gwy26wO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (8,'amr.halim5624@gmail.com','Amr Halim','$2b$12$NdjN146Nr.1twRD3pt.0gOSl4x4FpDPkxk/w/7gxqAGJlasNI3OTm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (9,'amr.halim6679@gmail.com','Amr Halim','$2b$12$cPASPgSsoruM9NRdpo7PbO1G4/B5qGpYF6GQbfbkgqzl6QGloBaiq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (10,'amr.halim7464@gmail.com','Amr Halim','$2b$12$RTtj1nNd4dNMtxBEqIH2KeIuMiwGRqOcULtop.nB8OLHu5VpjDxHq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (11,'amr.halim7717@gmail.com','Amr Halim','$2b$12$M7yJA4hMtUyL77UQDuwyDOsjzuMgZDut2rmFZCeKBeLIVIkAECHOC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (12,'amr.halim8092@gmail.com','Amr Halim','$2b$12$vy8YDjvI2RNFmYaDM9l6NOzDaZMDM2Jmn82bNzhskmp9wXirZvTjW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (13,'amr.halim9063@gmail.com','Amr Halim','$2b$12$X39J8HyZASAFhTsV8L7OEuRx9XXlukP.9PQQj1I7hUI3FqZtIVgXa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (14,'baraamohamed2311@gmail.com','Baraa Mohamed','$2b$12$ss6NAuns1Z.v6P9M/06/8eOSHUtrtb6hWJ50Y4t8AWvArT9FiSg3K','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (15,'david.wilson3424@gmail.com','David Wilson','$2b$12$MjIRlFJDHrcuLhd80AMPM.guwH1usdRUbn9bHuSKVY/pr0AIHDN8y','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (16,'david.wilson367@gmail.com','David Wilson','$2b$12$iQUhwi4mYaKUdMbFDP7iouJs7GiNeDhKLAbgtpBvbhlzDjkHX/WvW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (17,'david.wilson9623@gmail.com','David Wilson','$2b$12$LpmDTJkzafAibKtF5lxpUeWNyCT3.laemtftcQ4YU7jNDWhRK5ffi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (18,'fatma.hassan1546@gmail.com','Fatma Hassan','$2b$12$Z2OxHIv2NHEG6IgCThJcN./NiVVGwk9GA81ZKuZTcWeXt1SeY2sGK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (19,'fatma.hassan4093@gmail.com','Fatma Hassan','$2b$12$49Vq3.fJkwM4hcZASIpKfuh8EjPvi4Tj6py..SJHkIHvaumDNINSy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (20,'fatma.hassan4757@gmail.com','Fatma Hassan','$2b$12$9O70GslR.03SfppbwaN4GuH5bcszkT0luFqoEb4y0aRshKlukbAx2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (21,'fatma.hassan5457@gmail.com','Fatma Hassan','$2b$12$JLwNTQP5vsEYIq7yVQ9naeM94plMHFKZSDJO2Yt4DoYax0eatyEze','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (22,'hana.saad1553@gmail.com','Hana Saad','$2b$12$XDpweUlacSMd4fSpO5im4eqT4YT.JWBwqHUb7bweOvUvmH0eAoMSm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (23,'hana.saad1827@gmail.com','Hana Saad','$2b$12$/KoNyITSWMh5A2/fKSmLGOu18orcx0d3kp4XV5sf81mw8s7biTKLG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (24,'hana.saad4019@gmail.com','Hana Saad','$2b$12$GM/1kXaZi/KKH3NfoVoc7.MkreceEy4HTPDmzthM3G.p9eg5WYLjy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (25,'hana.saad443@gmail.com','Hana Saad','$2b$12$eF/86X6e2cLEOnzHFqLmG.ptEhnBr0Oct2.JXmsK0WLKDY585dmaS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (26,'hana.saad4442@gmail.com','Hana Saad','$2b$12$3WYLeSP6Smyb/.o38gVdJuDCrEIzQndBd7fk7RNMrIa0omqTN8qyu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (27,'hana.saad4853@gmail.com','Hana Saad','$2b$12$IrfF822qtzyRm8i81700NuOk6ccKjrKzDZuwx8Bd38AoRNCT3Vtba','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (28,'hana.saad624@gmail.com','Hana Saad','$2b$12$8jDucPnrMTe0w6qW7nVtZuU./sG.thTwGVyRch76OYIXN./tO4WGO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (29,'hana.saad7756@gmail.com','Hana Saad','$2b$12$/Ihwi6j6xGf3JvWMyPssYe6Ea80LwJpev4l3eIWE875gpl3Z3w5WK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (30,'hana.saad8023@gmail.com','Hana Saad','$2b$12$KVGG8Kbvxry2z5VM6dflpOSkmasr6aUhxmJG2KBq.XctybOXsAztu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (31,'hana.saad8781@gmail.com','Hana Saad','$2b$12$.xHtWuWugD95ro6B1Vnm1Ojj2JqOlzD1hG/AVjdN1XdbVaECZCAna','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (32,'hany.aziz2049@gmail.com','Hany Aziz','$2b$12$IMg0Ks4rIGP5.XvJs.aW9uQBU2Bua8KvgeaPKcTGWUKo91pBHn5U.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (33,'hany.aziz2173@gmail.com','Hany Aziz','$2b$12$lVQA/N3Iqt9pAec/r.0T/.yqZ7v3ymAV7tubxHhFx6DFwUbr3BQYC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (34,'hany.aziz2837@gmail.com','Hany Aziz','$2b$12$u93p2GWSvdfMl5.kJUI/tuR2QhisrABqiIsuau5rQ6InHxjdAiXNK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (35,'hany.aziz3663@gmail.com','Hany Aziz','$2b$12$T2FsGYD1CLfUTTIN72mpQuNHMcf/amy09dnA76YdIzmEjgtBwhqNq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (36,'hany.aziz3767@gmail.com','Hany Aziz','$2b$12$lSUJLH8gcfwHBKnXNExDi.4rTlOsU9KrLyvDpDIktsSxyetCDzEHy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (37,'hany.aziz392@gmail.com','Hany Aziz','$2b$12$718dwu37rGY1uCooun9AjuTtkebn6caVH0KKogJCSncQGtXmLsmaq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (38,'hany.aziz5541@gmail.com','Hany Aziz','$2b$12$cvRGVeLfJFMU1VHTs7d5k..jBpNUnFHST4LGfMA1uFquUVpiR3gcy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (39,'hany.aziz6618@gmail.com','Hany Aziz','$2b$12$6vZDvLD8jYuuFZm5qdprpOGvPHNaNltRWYtvtTGOyeAmpYKg3Q9k.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (40,'hany.aziz7377@gmail.com','Hany Aziz','$2b$12$1Fb7zRWCNQS8TXlIe/izy.CN0.ZEtsEMRM6oWYs1sFbgugZ0IR58e','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (41,'hany.aziz7480@gmail.com','Hany Aziz','$2b$12$aTPCca0VzllUIkKuKfZidOnylRPmPWO3/z55dRXRp2gpmIHubeZr.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (42,'hany.aziz8689@gmail.com','Hany Aziz','$2b$12$i2xuae3N8WVMthd3A721hu4P2ju.m0cH7PfGU3lmErUmrZCeYYt2S','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (43,'hany.aziz9376@gmail.com','Hany Aziz','$2b$12$YHCw8HKFypCo2R0DphrlaeWYCQ7Mxo7oy0JiTNxP0hP/L6fp3h/N6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (44,'hany.aziz984@gmail.com','Hany Aziz','$2b$12$wcI7XAWofBqT2l7Pa5cc5.qOr3dhNzj//q6C7UGgffJs99WafwKp6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (45,'jane.doe391@gmail.com','Jane Doe','$2b$12$xnjidpijhABr1mlSFA52l.FSG/Bo7YmjBHqVgZAFhf6yDT7c/o0UG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (46,'jane.doe5697@gmail.com','Jane Doe','$2b$12$3DQCCuiv5SaLVsXUJE9OKuTA2h4IBw1NDQi1PJNT9f6VWZRwgvsWy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (47,'jane.doe5797@gmail.com','Jane Doe','$2b$12$br8vTNsOGtVk2Mnd2kf2w.yEbJjDG9H6aDroMCXtoQoA.m5gR.LWq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (48,'jane.doe6331@gmail.com','Jane Doe','$2b$12$bfyheO2oYzvi/qK5t2ozZOAOm2.HBHHP77iEg6tZ2arLfHEVbm24a','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (49,'jane.doe7144@gmail.com','Jane Doe','$2b$12$wN59AHMduoEMMGkAJveJ0eoxK0Vmdo.96Y05Q/4wJeY/CkEIC4Ue6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (50,'jane.doe9444@gmail.com','Jane Doe','$2b$12$FaCjVjn7VHO5cXDb6senfeJZLLmQLR9EqnnB.ThHaYsfV29A3CHOm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (51,'jane.doe9683@gmail.com','Jane Doe','$2b$12$KQrgYXTUDGqL7o32JNTHWOkxg0kJ9RgYFman8fj.ztr3upvLBSg7y','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (52,'jessica.white1266@gmail.com','Jessica White','$2b$12$3/zi9CZkxuQU5.KvBlAQ8eUq3we4O7fOOag0rxC.N0IrKKkQODgny','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (53,'jessica.white2275@gmail.com','Jessica White','$2b$12$rG3X.HUxRtUlhy53QHaKn.YVRWIkNq6PXH6saujfgWOw8R9a6vq/S','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (54,'jessica.white312@gmail.com','Jessica White','$2b$12$4rZHUb4rcLZ4.dgsX7WZruN4i/J0oVwamg7VG45zcnlOvn9vpGXdK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (55,'jessica.white4861@gmail.com','Jessica White','$2b$12$Dmi36lqEgj9uygoiqmanP.X0e5y6Z8xwmBcZiPErj.jPPFPx3kZU2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (56,'jessica.white5130@gmail.com','Jessica White','$2b$12$7ps05h9X1ql67qu012K2/O7b8lymZwvso2gCvyeKqZINCnqXI6F/O','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (57,'jessica.white5485@gmail.com','Jessica White','$2b$12$.6GdqVB3dPYAmKiWN/F1oOC7.gcyLmbGmoxFMsLxjqNUBkKcXBWCe','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (58,'jessica.white5866@gmail.com','Jessica White','$2b$12$XZ7YChmJITtcCLnjBQB3HeWiXsBYc5HBugBIeSnS3UGg4dUELLFCS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (59,'jessica.white6458@gmail.com','Jessica White','$2b$12$5HdoX7myZXKap8pnPiJa0ed.blPQMy2UHglodWN/KIYhMspaMwhuS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (60,'jessica.white7283@gmail.com','Jessica White','$2b$12$SnMuWhmG5DImVaal8aSCduiMzflTIWfRIvC22cYUcQ24PdLKOXnUO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (61,'jessica.white9023@gmail.com','Jessica White','$2b$12$zmMdpSH.OJ4QJTUX4zai4uUpYlmzpVcJBAB1dZMGoDzS9LdQN7Dky','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (62,'jessica.white9845@gmail.com','Jessica White','$2b$12$JDPcK6PCRvPP8ibexVsmUu0fPfqSZBg5VhNC5XOmFm3E6hC5nXR7K','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (63,'jessica.white9993@gmail.com','Jessica White','$2b$12$EX4lHwwCfZdJmb2wr9zD6eIRONrEKiQDvcc7BTW1kp.AiiqWEOCA2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (64,'john.smith1539@gmail.com','John Smith','$2b$12$Z61Qdm8yr0ZFFn2HF5CFPOUYhJl/roGptLMJ3axDGGqIxe63FQnd.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (65,'john.smith2176@gmail.com','John Smith','$2b$12$RZzPK.nmle.1Zay3YEKj4e90KbFr5QWTiMDXyxXjkAzAs8ZwA.kFG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (66,'john.smith2873@gmail.com','John Smith','$2b$12$pQ1q/OHwrChdf/YLq7wx6.UF07povU2AJVzKYESQMo5tvJ.strRR2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (67,'john.smith387@gmail.com','John Smith','$2b$12$xsT11zjNpZ0hbDluAlrESOCgJiPyEITj1X.dDYr28724JrY7nZOsG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (68,'john.smith4018@gmail.com','John Smith','$2b$12$4BN6mrmYkxEd8BzzmCyD5e600LtnciKzi/uqaeUnx6A54xsaxGZz6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (69,'john.smith4040@gmail.com','John Smith','$2b$12$YuzAfhpLJgBlhjddfWfOs.idM/aZJyHCa5kp2VBVoVoOH/sikiJyK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (70,'john.smith4905@gmail.com','John Smith','$2b$12$yDWxkElbAlk77fx/bRhGJ.ynM2Zni.pZiGIJuZTZio4GZs1LEiRM2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (71,'john.smith5331@gmail.com','John Smith','$2b$12$57PHkAtAeVy9gmkxQBfghOxBUPokSgSIdDnqHjgnmINJdkAnHaERm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (72,'john.smith6411@gmail.com','John Smith','$2b$12$pwyoSvEcvgpB50f5irOO9uEJugoQdrpjlF46IZboibzg9DTlxzYPW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (73,'john.smith6991@gmail.com','John Smith','$2b$12$M82ReIZMJRdXlTmTeHK8uecvbtJDhTYS.pmE9cuZhJWbEu3GJd1uy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (74,'john.smith7304@gmail.com','John Smith','$2b$12$IzGNvdrJGIhuvXsmGr2peewDdQ7U1XYX2e5oZaQ6z3L00ARwmjP7S','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (75,'john.smith8487@gmail.com','John Smith','$2b$12$pnV89PRTJDELFO0f21X3VeCsbGdrf0FuBHwZzmaFhYNuQC2nhAtd2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (76,'khaled.naguib2458@gmail.com','Khaled Naguib','$2b$12$2PhjN10hoZ4f9Y/7UaM7YuoJSlw.shMosbxTwqIwC5BMTUzqlMAFS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (77,'khaled.naguib5975@gmail.com','Khaled Naguib','$2b$12$qxRgk8Mnyi82IooYHY.Q2OnGRNs6yrldkbmHyYQKwAIGABqtkH01u','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (78,'khaled.naguib767@gmail.com','Khaled Naguib','$2b$12$4xpembFmmkQIaf4Iw/KvyObRxtKUW5HwBQQ6W/jK9iGaJpsuAM4Mi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (79,'khaled.naguib7782@gmail.com','Khaled Naguib','$2b$12$/MtO8.2ZtMJepwnfaWEbLOPbRwtPgDFrfOffrsBbhIYV3YaePsbdS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (80,'khaled.naguib8049@gmail.com','Khaled Naguib','$2b$12$bFyur8w9XnINkzB/HXyc.O1Fqz3.si5m9yTjnFRQK32leiw7ww70G','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (81,'khaled.naguib8739@gmail.com','Khaled Naguib','$2b$12$c9.oyDD1a8rFp9i0Rnc.gOXnAUdGtk2b.LXCKDLsTmE2nsem5pmru','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (82,'khaled.naguib954@gmail.com','Khaled Naguib','$2b$12$VE3oob2R6cCzjrkENpIn.OJ3xn6Pms0r5QWFr.Y1FwG/4P/MDHkOC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (83,'khaled.naguib9831@gmail.com','Khaled Naguib','$2b$12$klaJYeMSXXYrT3rtdMEhau6nUjQqq6Fbqikie1i.gK.dtC5HZ4ZU2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (84,'lara.khalil2025@gmail.com','Lara Khalil','$2b$12$0/eXoodaKERReiyrt2KybukU5OwA0Qo8cbdXh/qsTVBLa5oq3lDmO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (85,'lara.khalil2453@gmail.com','Lara Khalil','$2b$12$pBzA2RswtPfo6ORVVecV.u5uajZSAHsOlOt8/nC/r8XlF0KC9oVjW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (86,'lara.khalil3213@gmail.com','Lara Khalil','$2b$12$/8dm.n3t8sPgxk9BeA347.pBrKHEW7jGbZ1gYN9FVhLH/zYDPk5hK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (87,'lara.khalil3423@gmail.com','Lara Khalil','$2b$12$YlhilZzDx6NIQhX2yFbH.eud1C5.gQ/ux0O8SkM3Lg5va1iQqqHr2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (88,'lara.khalil3754@gmail.com','Lara Khalil','$2b$12$bO0pBk8YN3hKpxv/xUTo1OfFQUeYcwLY8JnyBqdwGawRLMpdeUunC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (89,'lara.khalil4673@gmail.com','Lara Khalil','$2b$12$tVjxWyaDsR559id39OC/8ObfL1p0x07eBsHTimEXqLuW3l41Htewe','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (90,'lara.khalil5993@gmail.com','Lara Khalil','$2b$12$rpZxhrB8EOuFdVVd/X9noO9NTEdWunSuwGLz2h7nZWGa6Ckp/5cOa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (91,'lara.khalil6513@gmail.com','Lara Khalil','$2b$12$1AoxAZjTKhfgmdxq3Q7SS.TFWSzmXmCZSzl/DfJ4RdaTgB9HVLDqu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (92,'lara.khalil7603@gmail.com','Lara Khalil','$2b$12$BXNolbEllYG5rfvqOWE92uzNq0LTmotl51eerLzi0Npc/XYcZfb6y','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (93,'lara.khalil7794@gmail.com','Lara Khalil','$2b$12$xc10pQeFYekahc3zbjqx/uKlBDFthm8q1EZmIlkruyxxQz.5Ect8W','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (94,'lara.khalil8735@gmail.com','Lara Khalil','$2b$12$cQwxaoDy2j5Cj26t20jnNe08As4VvksX0MGOAA//SRq7DaO5YpTKC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (95,'lara.khalil9475@gmail.com','Lara Khalil','$2b$12$BwoHcvxxQy/aUFvEL37q9.jPIvVloVU93DpZHRmU4vcSpmFug/jjG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (96,'laura.santiago1253@gmail.com','Laura Santiago','$2b$12$zVM7NpviMdvJaYgdQjJlIuSdJ3dfgkpdCKPwYLhW7tzgvPh4RKI3m','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (97,'laura.santiago1957@gmail.com','Laura Santiago','$2b$12$hRR7wMMDSvkpZhPfmAWGzupReW6f/VDblcO14vOYo5gYQw.EtbnVS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (98,'laura.santiago2755@gmail.com','Laura Santiago','$2b$12$WORyISanGuo46Msph9HvMexqbQzDBB9hvOAQ0o11Azkxb4PD8Yl1a','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (99,'laura.santiago5203@gmail.com','Laura Santiago','$2b$12$QlqfQXZmXrePOq69lqKWwOkwC5.JF/oUu4SkAJLWRP9blGLtGdGt2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (100,'laura.santiago6989@gmail.com','Laura Santiago','$2b$12$a/.JMIUPPRBBQtEfiQYXTu/FCCOmaJDGpYzytTH/eNj.2L8rMOE3u','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (101,'laura.santiago7910@gmail.com','Laura Santiago','$2b$12$76bCdFQss111pZJBVpeqiefSbowCTePSMlWu7nFYaeciv23bz9TnO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (102,'mai.kamal1299@gmail.com','Mai Kamal','$2b$12$JX4xdDEjwrtiRnhbsB.q9.x/DiQ49Es8VikPJgLZZwgveY3oQo3Wu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (103,'mai.kamal1374@gmail.com','Mai Kamal','$2b$12$4NAG9v51IGduRvktndLrce9KdXTG9UeqMDJb4OV9nogP1PKUeifxi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (104,'mai.kamal3070@gmail.com','Mai Kamal','$2b$12$2ke4E2T3YLRpGjDRSg6wXupZKYqdrYKW3bbnPxEu.PasAujXgYDhW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (105,'mai.kamal6303@gmail.com','Mai Kamal','$2b$12$kueVx0HzwtAE7Vkksp9ExOJjt4vvmu2Dvpke6kB70GpmWOwIBHA72','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (106,'mai.kamal8550@gmail.com','Mai Kamal','$2b$12$3OuYL84.JrOViM6iwYB7UOsJCpEt6TkGzeYKwnLEHFYskG9OdUoDm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (107,'mariam.kamal1557@gmail.com','Mariam Kamal','$2b$12$YDFXe/6Icxm7EFBLt8d4Qe7C68Rlr.0NBOzVH741ptUt1p89tfMxC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (108,'mariam.kamal2592@gmail.com','Mariam Kamal','$2b$12$/48GzSAAtXa81atfyKg2xefqiJWHxB7JJeDeI6xnBNmeD3vCNgSIC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (109,'mariam.kamal3182@gmail.com','Mariam Kamal','$2b$12$EsZkvOQ2U1fi4SfgaXu.T.5KErRITq.pJQDcPQq0Pmumy56LM.8ya','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (110,'mariam.kamal5384@gmail.com','Mariam Kamal','$2b$12$cNkLKOxp75QJHY9.fYgaTu6bvK/N04qJn2pEbJbEVhTKf9lMgu16m','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (111,'mariam.kamal6318@gmail.com','Mariam Kamal','$2b$12$63JNXPaUgIcTH9bUtvK3tOkqSu82AgUcGw2MFYB76ggBF5EGPdHBq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (112,'mariam.kamal6682@gmail.com','Mariam Kamal','$2b$12$7iYbtJGIoDNBt5Ao50V2NObyMWLmC73Nep8iQKmCD6LXPUcjxKqNi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (113,'mariam.kamal7231@gmail.com','Mariam Kamal','$2b$12$sgcWrSbScriM58ACVkAHDeoc5O0QaoAZZ0HFF2eiYsfVyz9bee83q','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (114,'mariam.kamal7423@gmail.com','Mariam Kamal','$2b$12$NsGoPy9A8qmFMirCI9qINOQwPy9eEMR/Cg4nMv5UOIEwp7VqRCBo6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (115,'mariam.kamal8159@gmail.com','Mariam Kamal','$2b$12$RUqjEc8NAAjZv8b7YmpKR.20vgQTavMfpFb/c6JYwP0qDgAWVA.ki','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (116,'mariam.kamal8670@gmail.com','Mariam Kamal','$2b$12$7E3ngFlCisV5/8HeS8It7.c6l59Eiq4Td24mzIixAMIvKBGqc6iia','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (117,'mero.man@gmail.com','Mero Man','$2b$12$UFQo4EI43QscDcnFG5gsxe1f82lyN0bPyQoI1TKWcO64PSwSsh8zu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (118,'mero2.man@gmail.com','Mero2 Man','$2b$12$HVW.yWzhzxXh9f2TNnJ4JutnHV4wV8qPBRncXrw3Jun9Ubqo4FQWO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (119,'mero3.man@gmail.com','Mero3 Man','$2b$12$in5zWrq33u4RTEX/x.sSzu7DSVxKkzOCtM2/KVoDVDm.lC9ig3MMS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (120,'michael.brown1156@gmail.com','Michael Brown','$2b$12$nrz.5i.UHRKTAplw6Narb.ZKdEFXMLvbg/PiZC/WeyE4mvz/57JSy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (121,'michael.brown149@gmail.com','Michael Brown','$2b$12$huzJgkhHQXz8jyK57ERrFeOq1CE4ChWIG4DQW96.rZp3uCGV6Fx1K','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (122,'michael.brown1934@gmail.com','Michael Brown','$2b$12$F1o6IVo2YIUVMH6BjJzRUOQDsaXqGncmBPQF.E7enFC0xkwTRq9XK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (123,'michael.brown2283@gmail.com','Michael Brown','$2b$12$ZxMbece8h7aEJt7x5CK49ewpHf.0ACUdiEV.2.eUOc91JTYXWRR2e','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (124,'michael.brown2398@gmail.com','Michael Brown','$2b$12$eaiwrodX3apIEEHWPMM5XOBOdVtX3PgNvKboX0GFd58KC4MFDvqXm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (125,'michael.brown2901@gmail.com','Michael Brown','$2b$12$s8ZNnAeJwNMfI4uFpuhJ1uH5yOEtiziG.bEM1KxbdIY5/HDuTgWf6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (126,'michael.brown6672@gmail.com','Michael Brown','$2b$12$SsoqB7rCVxMBwVy1eyDisuSqOYr01Ym8xKDtTA394HkxWYe.mPi66','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (127,'michael.brown8052@gmail.com','Michael Brown','$2b$12$1f3IHn7ByTMfXry65hzSje92jJ5TMHcBNJYJcToKuI.3Oln5OhxgW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (128,'michael.brown9544@gmail.com','Michael Brown','$2b$12$wTANCpz2cSUTI/W65vIygehSYI7vNllCXF1VRcud/6v5p7dZTzqPK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (129,'mona.ali430@gmail.com','Mona Ali','$2b$12$aKIEKm4oEmd3jKmr6Af8ueaj1FrgySaZCz2upmpcaJtlwtaeMtVGC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (130,'mona.ali4959@gmail.com','Mona Ali','$2b$12$2C6NzBcOoLK/mgpn9NLucunn4Fo3NPsRKuX4tsLbNl4axcCsoo39O','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (131,'mona.ali5148@gmail.com','Mona Ali','$2b$12$T1ho7q9OLtjAguadPN5/AO1ZS7JYY9Kyb42nN.G.n7r6TIBKFqJN2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (132,'mona.ali7128@gmail.com','Mona Ali','$2b$12$zK15GRklS/ZNyWx.F.Ogqu97wO3tdtpKoEj9/ikLhv/ydlulPIFAS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (133,'mostafa.zaki3353@gmail.com','Mostafa Zaki','$2b$12$pLqeAPIdVH9g/WH2p89LfuOc.vtjSErXiYb8TPQKQ0do5XZQNl6ee','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (134,'nada.fahmy1438@gmail.com','Nada Fahmy','$2b$12$cSI6WlFJr8zhJYi6C7ZZIuMvO3JpiSZnLjfiKrGZETqY1rynUWm.q','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (135,'nada.fahmy2622@gmail.com','Nada Fahmy','$2b$12$u8/0xhsKNprB08VQf80Bf.SY.HnE8.Y0xxEZm9N1Ejmo9opBIYTJK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (136,'nada.fahmy3427@gmail.com','Nada Fahmy','$2b$12$ihfEY5E1/Zz1areJcA2Hme3wctiWZJAvkOWBzp4OV0i8pBy4pQzLu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (137,'nada.fahmy598@gmail.com','Nada Fahmy','$2b$12$TQpdIhxAxfSNK9ajpAkWSethLsxD23tAWkNIOCriAyicJOdHzMpwO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (138,'nada.fahmy6429@gmail.com','Nada Fahmy','$2b$12$WLAacSrF7cpfwLiD1lMjS.i.oRZq4eSCTYTcOOEhre1qtS9ZyMZM.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (139,'nada.fahmy6580@gmail.com','Nada Fahmy','$2b$12$kzCtlaMfkCZOiP8Do.rIduczo1oIZVRcbIALYdijimrQymH6NIFdq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (140,'nada.fahmy7371@gmail.com','Nada Fahmy','$2b$12$.8Xil8bAOi0NbELIbR7UDuIo7ORvBOujr4VDS4xZ5spSyHFvwfKPS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (141,'nada.fahmy8569@gmail.com','Nada Fahmy','$2b$12$qBBBvTGgYR5bYZ8tq/byNeuP0qcAQ2X7hsRR9Gg8eyRXSug19qu3G','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (142,'nada.fahmy8731@gmail.com','Nada Fahmy','$2b$12$.AP92YuoYwcR65Go0anpP.2T48bPVlTAj5h6//MX7mPHudnHXOynm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (143,'nada.fahmy9785@gmail.com','Nada Fahmy','$2b$12$yLKOyAvQLXMc5GFRhVPR/.iOMW46J1WyfyI1dSdUV01RQgNBagw0u','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (144,'omar.abdallah2024@gmail.com','Omar Abdallah','$2b$12$xpV9OHIJKyzCRKKp/snu..1VCPGsZvW7PSj8zgUK1odt931hAEnXa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (145,'omar.abdallah2285@gmail.com','Omar Abdallah','$2b$12$ded494IpSar5S4.FhtMvTu9xCYD.ozBiLK5f6fqBv4X0QRGHgX4Na','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (146,'omar.abdallah430@gmail.com','Omar Abdallah','$2b$12$JXt41.S2d9//D9usIwYJE.DKIzo.IVBkH7Gb7r8jy7XfyBUeLxUMa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (147,'omar.abdallah5254@gmail.com','Omar Abdallah','$2b$12$wJVwf96VSu8OECwlLn2apeekgoBtQB3D8BsQcAmsXCvWC3oGirjIm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (148,'omar.abdallah5453@gmail.com','Omar Abdallah','$2b$12$NGgOH0TiXIX8rFZRP0IukOonf5ST.UrRyRqmQDLqZERuhEZiJWdGG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (149,'omar.abdallah7216@gmail.com','Omar Abdallah','$2b$12$sCVo5RyVrDvd1FZFuTXrc.Mtf7RvN/epiWTmm4TbcCbm786JHoiXK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (150,'ramy.amin1780@gmail.com','Ramy Amin','$2b$12$rheruhHWjH7lSzVE3q3yDeo29hAsdsvGiuYgbVoK8vvMEgElBv2l6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (151,'ramy.amin2061@gmail.com','Ramy Amin','$2b$12$.PgQQkfXHufp.vR.n0S.Het.xhHBgOo7zm6Nvaq/vfTunErQku5y2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (152,'ramy.amin2899@gmail.com','Ramy Amin','$2b$12$2lAhT5pYoo.r5a08gIxHXer0sAtvVcOQEeMuq3B.iAKtp2T1YIXma','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (153,'ramy.amin354@gmail.com','Ramy Amin','$2b$12$I5VCdNUzc8Y545QqXbygJOovDFWyJx0U80toEAmcJNvLkuVryDrqG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (154,'ramy.amin3699@gmail.com','Ramy Amin','$2b$12$4YZ2tFSvatVfKZHMkOqVzOmYUS/O7mHX/bw8ZXaCFhlsmUdhjMJ/i','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (155,'ramy.amin3815@gmail.com','Ramy Amin','$2b$12$o/P71lzcTZlJsSYl1aduzONkApEAWxnNwgCR0AGKywI7H9124inJa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (156,'ramy.amin4786@gmail.com','Ramy Amin','$2b$12$fUhyVKtlByh83XT8jIucRuqhbJRWyfFoi2H/u/OgPPA7kwGQneJjG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (157,'ramy.amin570@gmail.com','Ramy Amin','$2b$12$PM3AibYQp0S11BV9CQSDE.fOEURhaERxJDaW0cVyTlPmfFarxkNee','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (158,'ramy.amin5758@gmail.com','Ramy Amin','$2b$12$WOhKeRgFbsgCB.qCKiFwiuCtdSr4r8WQuGNsla.oDmntchpRM2dpy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (159,'ramy.amin6070@gmail.com','Ramy Amin','$2b$12$MafDu6aVcld7BGPQc9ysy.gPXgUr/SNe94Lxxrrzm6MRIw239GIZ6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (160,'ramy.amin6347@gmail.com','Ramy Amin','$2b$12$axb7NntlNvGMBs/NEgmKHeUOXrIgTNby2ePS2y4149vYYli7fVqZS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (161,'ramy.amin6453@gmail.com','Ramy Amin','$2b$12$PIuo3ou/Jr4BMcSDN6cGtOozZVCUAJXQADD1z7V3dwoOtk0CH0Suq','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (162,'ramy.amin6735@gmail.com','Ramy Amin','$2b$12$YfwA6XqdETKODZzeC7T/FeFyxTc9WTDmmnPfrZXDyoAWLXiglbB2y','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (163,'ramy.amin692@gmail.com','Ramy Amin','$2b$12$pItm2Cv9.MpPAknXGVGnw.VgMAdi4AYcMmqu.yQW0xzpTAe1n8EHW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (164,'ramy.amin7472@gmail.com','Ramy Amin','$2b$12$cRrXY8YdkhSXEwOVp7iOaOjECHdbrShcjnrdltS5SBx/MOGm3.biS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (165,'ramy.amin9290@gmail.com','Ramy Amin','$2b$12$CVS7/CpBpBPC3ZzyCAgiqOm1PBcEcmNT8U538I2MELPxCM.AIKbr6','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (166,'ramy.amin9421@gmail.com','Ramy Amin','$2b$12$yviV8koPHTLAYnJ4RjnKC.V3A.zG/60XfeizIbAdx/mB2i0MMyCnO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (167,'sara.kamel1221@gmail.com','Sara Kamel','$2b$12$DBaC9byL9DakFCDGhDowDewwVu0ROcAkR6RVc/MgCpvwfW9ywsb4.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (168,'sara.kamel2001@gmail.com','Sara Kamel','$2b$12$FOTbrfh8p8QzOo/yCrwXYepgcZC/X7IGkPyd3wYrshvcxDe.fYZwW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (169,'sara.kamel216@gmail.com','Sara Kamel','$2b$12$eWXPhFJJqF3lytM009mpyOdKifjvZintKylNo5aYlc4UEcJ7mTzIW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (170,'sara.kamel3968@gmail.com','Sara Kamel','$2b$12$N8ImRl1/FyIoBF62z08fS.6LO/Yljdld80Xgxat/RSp5swheYi4O.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (171,'sara.kamel5572@gmail.com','Sara Kamel','$2b$12$PERAlvs/zt9H6KUZ97Sla.qZON68TxOC4WhIJ74aQ5ls8V6.GxLRS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (172,'sara.kamel6346@gmail.com','Sara Kamel','$2b$12$0guOK9O9m9./xMDvzcBviOeDHchUTzUYYNP3UmWo1NPsiEVLLu.XC','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (173,'sara.kamel7833@gmail.com','Sara Kamel','$2b$12$XQ.uN2uCitbuEXkyAPJbJ.puHvvfHAupka.wSTexwx/DN5kVGzOqK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (174,'tarek.ismail1671@gmail.com','Tarek Ismail','$2b$12$WT08bsfMdXzwG8LLdn0uN.g7eGigr90LUsJX2fZi4EVMWqN6uf2fu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (175,'tarek.ismail2223@gmail.com','Tarek Ismail','$2b$12$rj.wXle5sxKdnVxiLsNq2eRLp6Gn4MoqU1BBminf6eeXd9EWGXtUm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (176,'tarek.ismail2571@gmail.com','Tarek Ismail','$2b$12$XkJbyGfq8Mcclfr.cpVHYucZqoXAuAjh9pV0AuyQtt/RvucKx5UEa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (177,'tarek.ismail4486@gmail.com','Tarek Ismail','$2b$12$UifOgRO.CxcSJRelOK.mYObM3fOqgm02PO613VSVgn9vZhvK10/LW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (178,'tarek.ismail4959@gmail.com','Tarek Ismail','$2b$12$fcIi17YHQzC9hcx5Cgg4leGOIMZbR1w/hlzMNl0oDU1vl3iJqEfKS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (179,'tarek.ismail5230@gmail.com','Tarek Ismail','$2b$12$PQQhWM5lOx4Gx44iDELLSux/3aDFozf1o5Cki00CyNOSE2Zoz8Bjm','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (180,'tarek.ismail7558@gmail.com','Tarek Ismail','$2b$12$gcxPdbWjBIhsV//ruzMomuSOta50UclEFS8V4Ex9GFUM2VXBc80xa','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (181,'waleed.mostafa1234@gmail.com','Waleed Mostafa','$2b$12$szkpQB9UGZlbI1Ye2OMCSe.7jpwY8TdqIIsroUjGySZMFCxcanfry','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (182,'youssef.gamal1349@gmail.com','Youssef Gamal','$2b$12$ezKB6bwjlHm4N0UE6APvmej2iR1XPRWCYSReljgQFs7BfaHC1NwNS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (183,'youssef.gamal3499@gmail.com','Youssef Gamal','$2b$12$x1TL6zafHHWzNLWzpUcHDOIIz/45PU1.AcN.51zTfqzxQfZ89wWse','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (184,'youssef.gamal5146@gmail.com','Youssef Gamal','$2b$12$w7AJbHl44anDVUpRSxP7f.zTkG8HIzhII7nr2OIAGeH8HUjjMSKSi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (185,'youssef.gamal634@gmail.com','Youssef Gamal','$2b$12$vUhvJxIq8hOjUFyz3ElwAum2kqnyC5Gp9fN0JuwrBIrUVwx7boJPK','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (186,'youssef.gamal6915@gmail.com','Youssef Gamal','$2b$12$DJiVyB3XiV4TjbfWXIFydePSV3P3qw3dC9OsDK4QQC6/Zwqu56K8u','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (187,'youssef.gamal7584@gmail.com','Youssef Gamal','$2b$12$uzVRqESBMD9eYIKhGQKV.OiF1/8ZhS1GdHjNvb8qyx/UUwRja4bZy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (188,'youssef.gamal799@gmail.com','Youssef Gamal','$2b$12$g/y/Jdfbrsj5G16uzMX7r.WV8YRmVZmoSB9TrxztQpbVT1hX38Uru','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (189,'youssef.gamal8306@gmail.com','Youssef Gamal','$2b$12$Po8r2BlloVbA0kqK8LBBcOehkK3apuqekp9x3HJi6hJTGavDASVgi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (190,'youssef.gamal8341@gmail.com','Youssef Gamal','$2b$12$6bIFF.UIfKC/EGxiAvUDCeScggS834WpOZkg6kWafYmtetQAdPHKS','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (191,'youssef.gamal9400@gmail.com','Youssef Gamal','$2b$12$hL0ofx8XONwKsmE.l5EQT.nhSNpjqcSGfm0q2c7esYSWTCxBIRVYG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (192,'youssef.gamal9968@gmail.com','Youssef Gamal','$2b$12$c010QX0W1CNDZeOrExNnhuBZRppc/pym3GzQrMO1I8bbuDR/atKv2','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (193,'youssef.gamal9974@gmail.com','Youssef Gamal','$2b$12$K14wyxd.y5KikAfJR6p/d.BMGyKg1seW3XVdJFwplbeOF2KQ5r1DO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (194,'zein.yasser8384@gmail.com','Zein Yasser','$2b$12$xg6cHBT.woeF6SVUO5n.6Ob6TWwaDR2h80ydMPrWPdrPuzu4j40IW','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (195,'ziad.fouad1451@gmail.com','Ziad Fouad','$2b$12$Js.e6GL8gM8C7Un7PHcuyeliFCqBuWgCOKy79Ck0H6QNggxhp0A.a','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (196,'ziad.fouad2172@gmail.com','Ziad Fouad','$2b$12$rU3yhsL40m.Glv5RsPQKK.gir28srplfGXeG.1.zC4GjC7FpathXG','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (197,'ziad.fouad394@gmail.com','Ziad Fouad','$2b$12$uIguW8UHs2e8jnknDJ6z.uYq.ZxQh.IGa0Kc4vpbvL72X44s35pwO','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (198,'ziad.fouad3974@gmail.com','Ziad Fouad','$2b$12$P40gjJ0ANvKMwe4ZO47.OuMtiuXMoVxsA4DEXNhAZeC9Kpv0KFUuy','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (199,'ziad.fouad6654@gmail.com','Ziad Fouad','$2b$12$1v1hFtDggcnw9irN2FycT.H.iH5tJmOTSjRC220u3q/y7N356FfJu','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (200,'ziad.fouad803@gmail.com','Ziad Fouad','$2b$12$/UmvS90Vgp6sJiMVncgQceqLLC4iddbYDLktFUjMOXkV7epLEFBAi','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (201,'ziad.fouad806@gmail.com','Ziad Fouad','$2b$12$zXvfDXTJMPnbFFg10TltD.QZpDGNyPtAg959Agipl3z7hiCJ6Wnw.','employee','2025-11-25 17:57:46');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (256,'ahmednore.el-sayed9672@gmail.com','Not AhmedNore At All','$2b$12$fdO6tfPx7ScGN08jbdtSIeyAWkC3G9yZWcqbI1kLxkTEOO4wBTF2e','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (257,'mona.hassan507@gmail.com','Mona Hassan','$2b$12$CnHqcKtP3KkVsOZfhQkJ9uTaFC0aFB/4T2pfaPBhdx8jmg6XGqbsi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (258,'mai.kamal1099@gmail.com','Mai Kamal','$2b$12$5bhuAZ5KGpn40ljAeqRgAeTUMJrxV.DqUn9d6bfdWp5Gfv.WJhd/y','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (259,'mona.hassan1343@gmail.com','Mona Hassan','$2b$12$zIXd1Re.Lf2oaUKBKjKYGer2..HC2j9GmcRuMn.iPcJOVfKTMuNm6','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (260,'mahmoud.tarek3417@gmail.com','Mahmoud Tarek','$2b$12$j/.1htJwy81jDnjZTg2t3uHsgi6vNDU2mpSbjbAWxvcVVCx27BOiu','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (261,'youssef.ali4565@gmail.com','Youssef Ali','$2b$12$W.6Nk1RkFRBwOPmLbxdi/.e13rS25K8aPtEWv.8fccvKRD3Ruslgy','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (262,'ramy.amin581@gmail.com','Ramy Amin','$2b$12$PJ4GxC07sDkBEK3gLgWSSehXJiHBHxP9ApOcatZ3pejSRVH4/.6ay','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (263,'salma.ibrahim4419@gmail.com','Salma Ibrahim','$2b$12$JTzZesSgZqaGB95RV2p/ou4E9gDlRbrcx.61DocOWBWs4qiNzr3C2','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (264,'karim.mostafa6766@gmail.com','Karim Mostafa','$2b$12$/HaMkpKyibAnEZoxfG3S9.oLD3vDsp9ncYhoykteY1WYgk5qrRq2i','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (265,'mona.hassan245@gmail.com','Mona Hassan','$2b$12$8gKdsWPlgxpcz5JU8mhMTOeeoED.2bs4QQPX1qM.7q7Nj7cWkddDe','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (266,'karim.mostafa5236@gmail.com','Karim Mostafa','$2b$12$Y4JOmhujQWg1KCFf0JASHOCORW/5eXQKV1nP9bxObO92OejC/Ur2a','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (267,'mariam.kamal8674@gmail.com','Mariam Kamal','$2b$12$B1lB37gya9XjGyNp2hLiPeGI/.hXrHvfK.6ISkrl11mvc9sSqmDE6','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (268,'fatma.hassan7044@gmail.com','Fatma Hassan','$2b$12$DdnE/N6HDclTmG482PliiOE0KSb3jN3x9Cj1ektKehkdKRzZGk4h2','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (269,'ahmed.el-sayed9556@gmail.com','Ahmed El-Sayed','$2b$12$knt1CShmxX/sxLb9tYA4ceDDMdq5EHDNlpJAKjxyuPc9RlSVZX7Um','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (270,'nourhan.adel8149@gmail.com','Not nourhan At All','$2b$12$hHx5Eyu0Fmb4bmOFeGFmHuahFtVXZ2u3W1tpW7GdrQDiGcpxMoZaa','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (271,'karim.mostafa6811@gmail.com','Karim Mostafa','$2b$12$IA6Yi0XElIwH/3qwPXatSutJckkkp8juwHKua56xWubzCV4wIeESS','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (272,'ramy.amin7324@gmail.com','Ramy Amin','$2b$12$ja16KLPzi4aHcOrrR02Iuu06MSdGKndaOuOfhOBfAqGTde8U236C6','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (273,'hana.saad8530@gmail.com','Hana Saad','$2b$12$uN8Ty/B10XZisu76DY1J/u5sdJJFCOAtXxrVGzOUS4xxFzxAeKdPK','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (274,'ziad.fouad1261@gmail.com','Ziad Fouad','$2b$12$lTfTrECvDeV0huOrDq2Yje4AXo1N7OHB0/mOTjVbzWifbmxMM0nGi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (275,'tarek.ismail843@gmail.com','Tarek Ismail','$2b$12$Vck5yh2XMgQGZLiyioExB.Eucs9fqf6ygWDlrSPolmrARNfD3RjCO','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (276,'amr.halim1037@gmail.com','Amr Halim','$2b$12$WwzyLsGzR0y15muirra8q.TXDLbPgBz.LqTde3T6O0XHAMEAjOyXq','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (277,'tarek.ismail3337@gmail.com','Tarek Ismail','$2b$12$3exYEXgNKfS0syucJelQMeqb307/RhTzP2j8WbiFwlq.ImtPIh.Zi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (278,'mahmoud.tarek8739@gmail.com','Mahmoud Tarek','$2b$12$lVd.WltDUNAW4ha53xVWne5T5p8HlqnlNl.8aHy4St92ZNiF646.y','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (279,'layla.mohamed8671@gmail.com','Layla Mohamed','$2b$12$0cVTF8gRb6BuN6TxPNzi..Z5zhZHNPw4/ZIpgHIUYXBoUTdkFIag2','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (280,'fatma.hassan4758@gmail.com','Fatma Hassan','$2b$12$Z8KFprugN5F0BPOzuftKA.rbpd1A6OHgldQggcEq2/fJMwlw1EYXm','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (281,'fatma.hassan9934@gmail.com','Fatma Hassan','$2b$12$mwbx3Z0ynYbMeQyUJKb3qu0VP6Q/9j6tLxnf5Z7PEKwJrl1tWe1/e','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (282,'khaled.naguib3118@gmail.com','Khaled Naguib','$2b$12$fuFYsPFa7Wb/8fsqRwYbz.xSHu1s2GNG2okX0QhrjbyWBHc7Iebs2','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (283,'omar.farouk6660@gmail.com','Omar Farouk','$2b$12$fD3U6oXQD3IDKfJM4ZOngukqZgC0/TR3wn4jIIyQ0JRbrC4GhUXpi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (284,'nourhan.adel3790@gmail.com','Nourhan Adel','$2b$12$em/2PV.FqmwmVMjV7XJAeOPxdRB9L4HqbrD9Xh98wDikCXOz/Zcai','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (285,'heba.said3399@gmail.com','Heba Said','$2b$12$D5lLBe4zyXU/4VYIcC1x.uzMkAwFQXDBU6tSmldEja8.wfBtlAl5m','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (286,'tarek.ismail6620@gmail.com','Tarek Ismail','$2b$12$8j2IKagpgattbm40hn2XzOWeTPhcMdaUNECIeZCtf038VxwHPMSS.','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (287,'mariam.kamal9632@gmail.com','Mariam Kamal','$2b$12$qNTEvOcUyQSxXKPOFOPp7.BkRtBVAAbiLJXEFxs.QPGeb2z7pLKki','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (288,'tarek.ismail898@gmail.com','Tarek Ismail','$2b$12$.p1zZuNze8jy4VXRnkn0UuycJN2JSIC73LmQxJmhevnfmtlmgFpey','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (289,'salma.ibrahim2709@gmail.com','Salma Ibrahim','$2b$12$ncsOELsL6nSQ1CVO49xaru78Gu/U9zDgcgI5dso9yInrCIYkXjfRS','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (290,'heba.said965@gmail.com','Heba Said','$2b$12$XMv7/mNhQvNfjj2RkHqtg.Ef7UieKlj2CikdsUOJIXNHjcfk91MQi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (291,'khaled.naguib8097@gmail.com','Khaled Naguib','$2b$12$SC8AAks7ajfSWAgY9KubFOLTZlT1JB4XYhwjaqu1Qfi5EDD4dA0a6','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (292,'mariam.kamal259@gmail.com','Mariam Kamal','$2b$12$DvjxrxL0yv1oHP901qMV3.0Q/w8GZ6K0dzK6P5ExFX3tecNBIHqBG','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (293,'omar.farouk9410@gmail.com','Omar Farouk','$2b$12$1Sfy7BTqrXcX.DHqRb1q/.WnjuFK5v9mwTAl.UAcb1lkfbWgC.R8K','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (294,'tarek.ismail2553@gmail.com','Tarek Ismail','$2b$12$eEWDWHRNcsQNYQmAARPHg..fLoxno1/EK6ESNfUyYfz3MYICoAc4S','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (295,'fatma.hassan1807@gmail.com','Fatma Hassan','$2b$12$Xib3jKvD9esJYIJxOazU/ejQ6EABz2Mtrr1HmH6aD7MP0z1Fkx6T2','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (296,'heba.said9684@gmail.com','Heba Said','$2b$12$rIUNL00Bv4pFiembEozlVODi41oDVxzEN5Fo/52nvu1mTZbFmMJQa','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (297,'karim.mostafa6502@gmail.com','Karim Mostafa','$2b$12$KnHI.MFxKySOwO0A5g.1s.9tmir2t33581yr190i4pu53TDs/nDXy','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (298,'mahmoud.tarek2397@gmail.com','Mahmoud Tarek','$2b$12$mKMkBfZoN9rl45P1j1J3suPTHDDMNuOQBvgQZNQZ7nzWtcosQEhZi','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (299,'ramy.amin6094@gmail.com','Ramy Amin','$2b$12$.wPD/da67L7Q/rbsi4IuyeBi82FlPyU8T1oTUm3MMAfNOj.x5SonC','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (300,'nourhan.adel6361@gmail.com','Nourhan Adel','$2b$12$2gkkYAdW5iIpZ5vZpHL26upbV7Xk0ZU7zdd0UPi0n6n0hdheUuGKy','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (301,'hana.saad8575@gmail.com','Hana Saad','$2b$12$4iJn/6z3Y.IJAWWY9qSD5el7LWrNQB.HB0dzyNrOir8xPbxJS8VRm','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (302,'ziad.fouad1031@gmail.com','Ziad Fouad','$2b$12$VLTBQIiuMo3Pe5voN394puTa61WgBjGpLuWtc34kMs.RlAty/NR2e','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (303,'heba.said1173@gmail.com','Heba Said','$2b$12$hj56JyT4z3ZcMcqUsmVt/OFvxK/4cuj35FyYj.sZshCrqZmzqHBE6','patient','2025-11-25 18:49:10');
INSERT INTO `` (`user_id`,`user_email`,`user_name`,`user_password`,`user_type`,`created_at`) VALUES (304,'mohameka@gmail.com','mohameka','$2b$12$VQ1mw4xSZJy4Kap1iRCHJuGraLaCtqMLbqdiDN6p9oXw9jziGZLBW','patient','2025-11-25 18:49:10');

-- ==============================================
--              Patients
-- ==============================================


INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (256,'000000000000','Mahala, Alex',0,-1,-1,'2003-01-10','2025-10-02','Female','Nourhan Adel - 01230597742','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (257,'01127877754','Mansoura, Dakahlia',1,1,3,'1980-09-03','2025-10-17','Female','Heba Said - 01573388042','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (258,'01009852410','Shobra, Cairo',1,1,5,'1960-04-05','2025-10-17','Male','Khaled Naguib - 01531325539','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (259,'01230889100','Port Said, Egypt',1,2,3,'1950-07-08','2025-10-05','Male','Hana Saad - 01099078430','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (260,'01524465071','Nasr City, Cairo',1,3,1,'2003-09-21','2025-10-15','Female','Salma Ibrahim - 01272550336','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (261,'01016902922','Maadi, Cairo',0,-1,-1,'1955-12-08','2025-10-18','Male','Tarek Ismail - 01000954574','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (262,'01107687690','Maadi, Cairo',0,-1,-1,'2007-09-25','2025-10-16','Female','Youssef Ali - 01207836765','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (263,'01286728653','Heliopolis, Cairo',0,-1,-1,'1965-03-29','2025-10-02','Female','Ziad Fouad - 01594934682','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (264,'01054628239','6th of October City, Giza',1,3,3,'1985-05-27','2025-10-16','Male','Ahmed El-Sayed - 01513989704','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (265,'01570878870','Nasr City, Cairo',1,2,5,'1985-05-08','2025-10-10','Female','Mahmoud Tarek - 01270243875','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (266,'01088895993','Alexandria, Roushdy',1,1,2,'1951-12-11','2025-09-26','Male','Mariam Kamal - 01240043837','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (267,'01567917897','Heliopolis, Cairo',0,-1,-1,'1989-11-18','2025-10-10','Female','Nourhan Adel - 01040976564','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (268,'01127093919','Maadi, Cairo',0,-1,-1,'1989-09-22','2025-10-12','Female','Nourhan Adel - 01016860887','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (269,'01199572175','Alexandria, Roushdy',0,-1,-1,'1956-01-13','2025-10-18','Male','Heba Said - 01261647175','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (270,'000000000000','Nasr City, Cairo',0,-1,-1,'1950-06-18','2025-09-23','Female','Nada Fahmy - 01166559178','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (271,'01564052201','6th of October City, Giza',0,-1,-1,'1992-06-06','2025-10-19','Female','Salma Ibrahim - 01029320607','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (272,'01568344942','Zagazig, Sharqia',0,-1,-1,'1979-06-08','2025-10-02','Male','Mona Hassan - 01095902939','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (273,'01094521989','Alexandria, Roushdy',1,2,1,'1978-02-03','2025-09-27','Male','Hana Saad - 01537397973','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (274,'01298695016','Dokki, Giza',0,-1,-1,'1965-01-31','2025-09-25','Female','Ahmed El-Sayed - 01265080767','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (275,'01253889002','Alexandria, Roushdy',0,-1,-1,'1957-04-03','2025-09-30','Male','Mai Kamal - 01590529259','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (276,'01054268659','Zagazig, Sharqia',1,1,4,'1977-03-18','2025-10-07','Female','Omar Farouk - 01523417195','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (277,'01261482476','Shobra, Cairo',0,-1,-1,'1966-08-06','2025-10-04','Female','Ziad Fouad - 01547155686','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (278,'01223657526','Dokki, Giza',1,1,1,'2010-03-08','2025-09-22','Male','Ziad Fouad - 01184722921','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (279,'01599247727','Port Said, Egypt',0,-1,-1,'1986-05-01','2025-09-27','Female','Mariam Kamal - 01213134579','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (280,'01166895602','Shobra, Cairo',0,-1,-1,'2012-04-25','2025-10-20','Male','Ahmed El-Sayed - 01546267855','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (281,'01588906911','Nasr City, Cairo',0,-1,-1,'2008-02-04','2025-10-01','Male','Ramy Amin - 01168517634','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (282,'01055250955','Zagazig, Sharqia',0,-1,-1,'1962-07-12','2025-10-16','Male','Mariam Kamal - 01516224669','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (283,'01541925545','Port Said, Egypt',0,-1,-1,'1999-02-17','2025-10-11','Male','Salma Ibrahim - 01200984372','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (284,'01594433445','6th of October City, Giza',0,-1,-1,'2014-03-03','2025-10-02','Female','Fatma Hassan - 01533572255','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (285,'01145083777','Maadi, Cairo',0,-1,-1,'1968-05-20','2025-09-22','Female','Amr Halim - 01564129068','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (286,'01035187230','Nasr City, Cairo',0,-1,-1,'2011-09-28','2025-10-13','Female','Hana Saad - 01192514162','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (287,'01165223471','Heliopolis, Cairo',0,-1,-1,'1952-03-03','2025-10-16','Female','Ramy Amin - 01256966214','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (288,'01136257968','Dokki, Giza',0,-1,-1,'1959-10-23','2025-09-24','Male','Karim Mostafa - 01186718761','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (289,'01086036592','Shobra, Cairo',1,2,4,'1996-04-23','2025-10-01','Male','Omar Farouk - 01531387105','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (290,'01093589436','Heliopolis, Cairo',0,-1,-1,'1952-10-18','2025-10-05','Male','Amr Halim - 01029300099','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (291,'01163818426','Maadi, Cairo',0,-1,-1,'1963-03-30','2025-10-20','Male','Youssef Ali - 01074146984','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (292,'01187223682','Nasr City, Cairo',0,-1,-1,'1951-01-29','2025-10-10','Female','Salma Ibrahim - 01094327098','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (293,'01014248159','Zagazig, Sharqia',0,-1,-1,'1952-01-21','2025-10-05','Female','Mahmoud Tarek - 01118774492','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (294,'01117403221','Maadi, Cairo',1,2,2,'1991-01-26','2025-09-23','Female','Nada Fahmy - 01528129834','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (295,'01265208117','6th of October City, Giza',0,3,1,'1966-08-31','2025-10-06','Male','Nada Fahmy - 01068093996','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (296,'01149909893','Nasr City, Cairo',0,-1,-1,'2005-09-03','2025-09-25','Female','Ramy Amin - 01561736976','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (297,'01542025037','Alexandria, Roushdy',0,-1,-1,'1987-04-22','2025-09-26','Male','Hana Saad - 01042940684','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (298,'01273972503','Mansoura, Dakahlia',1,3,2,'1989-10-01','2025-10-04','Male','Hana Saad - 01226614775','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (299,'01164588795','Zagazig, Sharqia',1,3,4,'1950-12-20','2025-09-27','Female','Tarek Ismail - 01158949382','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (300,'01220989849','Maadi, Cairo',0,-1,-1,'2015-08-22','2025-10-21','Female','Tarek Ismail - 01140834935','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (301,'01181806846','Maadi, Cairo',0,-1,-1,'1986-07-06','2025-09-26','Male','Tarek Ismail - 01551572022','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (302,'01572723340','Zagazig, Sharqia',0,-1,-1,'1997-02-05','2025-10-09','Female','Mai Kamal - 01213123725','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (303,'01522221393','6th of October City, Giza',0,-1,-1,'1974-12-05','2025-09-27','Female','Nourhan Adel - 01584215862','2025-09-21 16:08:32');
INSERT INTO `` (`patient_id`,`patient_phone`,`patient_address`,`isAssignedToRoom`,`room_number`,`floor_number`,`date_of_birth`,`next_check_date`,`patient_gender`,`emergency_contact`,`created_at`) VALUES (304,'01597240455','Maadi, Cairo',0,-1,-1,'1983-03-10','2025-10-02','Male','Nourhan Adel - 01230597742','2025-09-21 18:51:15');


-- ==========================================
-- Doctors
-- ==========================================
INSERT INTO doctors (doctor_id, hosp_emp_id, initial_consultation_price, followup_consultation_price, years_of_exp)
VALUES
(8, 8, 1200, 800, 15),
(12, 12, 900, 600, 8),
(13, 13, 1100, 750, 12),
(22, 22, 850, 550, 6),
(35, 35, 1300, 900, 18),
(39, 39, 950, 650, 9),
(49, 49, 1400, 950, 20),
(55, 55, 700, 480, 4),
(68, 68, 1050, 700, 11),
(82, 82, 1250, 850, 16),
(88, 88, 800, 520, 5),
(98, 98, 1150, 780, 13),
(106, 106, 1350, 920, 17),
(115, 115, 1000, 680, 10),
(117, 117, 1450, 980, 19),
(124, 124, 750, 500, 3),
(126, 126, 500, 350, 2),
(138, 138, 1200, 820, 14),
(144, 144, 950, 630, 7),
(147, 147, 1100, 720, 12),
(163, 163, 1300, 880, 16);

-- ==========================================
-- Surgeons
-- ==========================================
INSERT INTO surgeons (surgeon_id, hosp_emp_id, initial_consultation_price, followup_consultation_price, surgery_price, years_of_exp)
VALUES
(27, 27, 1400, 900, 120000, 18),
(32, 32, 1000, 650, 75000, 10),
(40, 40, 900, 600, 45000, 7),
(47, 47, 1300, 850, 95000, 15),
(57, 57, 800, 550, 35000, 5),
(66, 66, 1500, 1000, 140000, 20),
(74, 74, 1100, 700, 60000, 9),
(89, 89, 1200, 800, 85000, 13),
(96, 96, 950, 620, 50000, 8),
(118, 118, 1350, 920, 110000, 16),
(131, 131, 850, 580, 40000, 6),
(148, 148, 1250, 820, 90000, 14),
(157, 157, 1050, 680, 65000, 11),
(162, 162, 1150, 750, 78000, 12);

-- ==========================================
-- Nurses
-- ==========================================
INSERT INTO nurses (nurse_id, hosp_emp_id, floor_number)
VALUES
(4, 4, 3),
(15, 15, 1),
(24, 24, 5),
(25, 25, 2),
(29, 29, 4),
(31, 31, 1),
(34, 34, 3),
(54, 54, 5),
(69, 69, 2),
(83, 83, 4),
(86, 86, 1),
(95, 95, 3),
(119, 119, 5),
(135, 135, 2),
(136, 136, 4),
(137, 137, 1),
(141, 141, 3),
(152, 152, 5),
(171, 171, 2),
(185, 185, 4),
(200, 200, 1);

-- ==========================================
-- Availability for Doctors
-- ==========================================
INSERT INTO availability (hosp_emp_id, day_of_week, start_time, end_time)
VALUES
-- Doctor 8 (3 days)
(8, 1, '09:00:00', '17:00:00'),
(8, 2, '10:00:00', '18:00:00'),
(8, 4, '08:00:00', '16:00:00'),

-- Doctor 12 (3 days)
(12, 0, '08:30:00', '16:30:00'),
(12, 2, '09:00:00', '17:00:00'),
(12, 5, '10:00:00', '18:00:00'),

-- Doctor 13 (3 days)
(13, 1, '09:00:00', '17:00:00'),
(13, 3, '08:00:00', '16:00:00'),
(13, 5, '10:00:00', '18:00:00'),

-- Doctor 22 (3 days)
(22, 0, '08:00:00', '16:00:00'),
(22, 2, '09:30:00', '17:30:00'),
(22, 4, '10:00:00', '18:00:00'),

-- Doctor 35 (3 days)
(35, 1, '08:30:00', '16:30:00'),
(35, 3, '09:00:00', '17:00:00'),
(35, 5, '08:00:00', '16:00:00'),

-- Doctor 39 (3 days)
(39, 0, '09:00:00', '17:00:00'),
(39, 2, '10:00:00', '18:00:00'),
(39, 4, '08:30:00', '16:30:00'),

-- Doctor 49 (3 days)
(49, 1, '08:00:00', '16:00:00'),
(49, 3, '09:00:00', '17:00:00'),
(49, 5, '10:00:00', '18:00:00'),

-- Doctor 55 (3 days)
(55, 0, '09:30:00', '17:30:00'),
(55, 2, '08:00:00', '16:00:00'),
(55, 4, '09:00:00', '17:00:00'),

-- Doctor 68 (3 days)
(68, 1, '10:00:00', '18:00:00'),
(68, 3, '08:30:00', '16:30:00'),
(68, 5, '09:00:00', '17:00:00'),

-- Doctor 82 (3 days)
(82, 0, '08:00:00', '16:00:00'),
(82, 2, '09:00:00', '17:00:00'),
(82, 4, '10:00:00', '18:00:00'),

-- Doctor 88 (3 days)
(88, 1, '09:00:00', '17:00:00'),
(88, 3, '08:00:00', '16:00:00'),
(88, 5, '09:30:00', '17:30:00'),

-- Doctor 98 (3 days)
(98, 0, '10:00:00', '18:00:00'),
(98, 2, '08:30:00', '16:30:00'),
(98, 4, '09:00:00', '17:00:00'),

-- Doctor 106 (3 days)
(106, 1, '08:00:00', '16:00:00'),
(106, 3, '09:00:00', '17:00:00'),
(106, 5, '10:00:00', '18:00:00'),

-- Doctor 115 (3 days)
(115, 0, '09:00:00', '17:00:00'),
(115, 2, '08:00:00', '16:00:00'),
(115, 4, '09:30:00', '17:30:00'),

-- Doctor 117 (3 days)
(117, 1, '10:00:00', '18:00:00'),
(117, 3, '08:30:00', '16:30:00'),
(117, 5, '09:00:00', '17:00:00'),

-- Doctor 124 (3 days)
(124, 0, '08:00:00', '16:00:00'),
(124, 2, '09:00:00', '17:00:00'),
(124, 4, '10:00:00', '18:00:00'),

-- Doctor 126 (3 days)
(126, 1, '09:00:00', '17:00:00'),
(126, 3, '08:00:00', '16:00:00'),
(126, 5, '09:30:00', '17:30:00'),

-- Doctor 138 (3 days)
(138, 0, '10:00:00', '18:00:00'),
(138, 2, '08:30:00', '16:30:00'),
(138, 4, '09:00:00', '17:00:00'),

-- Doctor 144 (3 days)
(144, 1, '08:00:00', '16:00:00'),
(144, 3, '09:00:00', '17:00:00'),
(144, 5, '10:00:00', '18:00:00'),

-- Doctor 147 (3 days)
(147, 0, '09:00:00', '17:00:00'),
(147, 2, '08:00:00', '16:00:00'),
(147, 4, '09:30:00', '17:30:00'),

-- Doctor 163 (3 days)
(163, 1, '10:00:00', '18:00:00'),
(163, 3, '08:30:00', '16:30:00'),
(163, 5, '09:00:00', '17:00:00');

-- ==========================================
-- Availability for Surgeons
-- ==========================================
INSERT INTO availability (hosp_emp_id, day_of_week, start_time, end_time)
VALUES
-- Surgeon 27 (3 days)
(27, 1, '08:00:00', '16:00:00'),
(27, 3, '09:00:00', '17:00:00'),
(27, 5, '10:00:00', '18:00:00'),

-- Surgeon 32 (3 days)
(32, 0, '09:00:00', '17:00:00'),
(32, 2, '08:30:00', '16:30:00'),
(32, 4, '09:30:00', '17:30:00'),

-- Surgeon 40 (3 days)
(40, 1, '10:00:00', '18:00:00'),
(40, 3, '08:00:00', '16:00:00'),
(40, 5, '09:00:00', '17:00:00'),

-- Surgeon 47 (3 days)
(47, 0, '08:30:00', '16:30:00'),
(47, 2, '09:00:00', '17:00:00'),
(47, 4, '10:00:00', '18:00:00'),

-- Surgeon 57 (3 days)
(57, 1, '08:00:00', '16:00:00'),
(57, 3, '09:00:00', '17:00:00'),
(57, 5, '09:30:00', '17:30:00'),

-- Surgeon 66 (3 days)
(66, 0, '10:00:00', '18:00:00'),
(66, 2, '08:00:00', '16:00:00'),
(66, 4, '09:00:00', '17:00:00'),

-- Surgeon 74 (3 days)
(74, 1, '09:00:00', '17:00:00'),
(74, 3, '08:30:00', '16:30:00'),
(74, 5, '10:00:00', '18:00:00'),

-- Surgeon 89 (3 days)
(89, 0, '08:00:00', '16:00:00'),
(89, 2, '09:00:00', '17:00:00'),
(89, 4, '09:30:00', '17:30:00'),

-- Surgeon 96 (3 days)
(96, 1, '10:00:00', '18:00:00'),
(96, 3, '08:00:00', '16:00:00'),
(96, 5, '09:00:00', '17:00:00'),

-- Surgeon 118 (3 days)
(118, 0, '09:00:00', '17:00:00'),
(118, 2, '08:30:00', '16:30:00'),
(118, 4, '10:00:00', '18:00:00'),

-- Surgeon 131 (3 days)
(131, 1, '08:00:00', '16:00:00'),
(131, 3, '09:00:00', '17:00:00'),
(131, 5, '09:30:00', '17:30:00'),

-- Surgeon 148 (3 days)
(148, 0, '10:00:00', '18:00:00'),
(148, 2, '08:00:00', '16:00:00'),
(148, 4, '09:00:00', '17:00:00'),

-- Surgeon 157 (3 days)
(157, 1, '09:00:00', '17:00:00'),
(157, 3, '08:30:00', '16:30:00'),
(157, 5, '10:00:00', '18:00:00'),

-- Surgeon 162 (3 days)
(162, 0, '08:00:00', '16:00:00'),
(162, 2, '09:00:00', '17:00:00'),
(162, 4, '09:30:00', '17:30:00');

-- ==========================================
-- Availability for Nurses
-- ==========================================
INSERT INTO availability (hosp_emp_id, day_of_week, start_time, end_time)
VALUES
-- Nurse 4 (3 days)
(4, 0, '07:00:00', '15:00:00'),
(4, 2, '08:00:00', '16:00:00'),
(4, 4, '09:00:00', '17:00:00'),

-- Nurse 15 (3 days)
(15, 1, '07:30:00', '15:30:00'),
(15, 3, '08:30:00', '16:30:00'),
(15, 5, '09:30:00', '17:30:00'),

-- Nurse 24 (3 days)
(24, 0, '08:00:00', '16:00:00'),
(24, 2, '09:00:00', '17:00:00'),
(24, 4, '10:00:00', '18:00:00'),

-- Nurse 25 (3 days)
(25, 1, '07:00:00', '15:00:00'),
(25, 3, '08:00:00', '16:00:00'),
(25, 5, '09:00:00', '17:00:00'),

-- Nurse 29 (3 days)
(29, 0, '08:30:00', '16:30:00'),
(29, 2, '09:30:00', '17:30:00'),
(29, 4, '10:30:00', '18:30:00'),

-- Nurse 31 (3 days)
(31, 1, '07:00:00', '15:00:00'),
(31, 3, '08:00:00', '16:00:00'),
(31, 5, '09:00:00', '17:00:00'),

-- Nurse 34 (3 days)
(34, 0, '08:00:00', '16:00:00'),
(34, 2, '09:00:00', '17:00:00'),
(34, 4, '10:00:00', '18:00:00'),

-- Nurse 54 (3 days)
(54, 1, '07:30:00', '15:30:00'),
(54, 3, '08:30:00', '16:30:00'),
(54, 5, '09:30:00', '17:30:00'),

-- Nurse 69 (3 days)
(69, 0, '08:00:00', '16:00:00'),
(69, 2, '09:00:00', '17:00:00'),
(69, 4, '10:00:00', '18:00:00'),

-- Nurse 83 (3 days)
(83, 1, '07:00:00', '15:00:00'),
(83, 3, '08:00:00', '16:00:00'),
(83, 5, '09:00:00', '17:00:00'),

-- Nurse 86 (3 days)
(86, 0, '08:30:00', '16:30:00'),
(86, 2, '09:30:00', '17:30:00'),
(86, 4, '10:30:00', '18:30:00'),

-- Nurse 95 (3 days)
(95, 1, '07:00:00', '15:00:00'),
(95, 3, '08:00:00', '16:00:00'),
(95, 5, '09:00:00', '17:00:00'),

-- Nurse 119 (3 days)
(119, 0, '08:00:00', '16:00:00'),
(119, 2, '09:00:00', '17:00:00'),
(119, 4, '10:00:00', '18:00:00'),

-- Nurse 135 (3 days)
(135, 1, '07:30:00', '15:30:00'),
(135, 3, '08:30:00', '16:30:00'),
(135, 5, '09:30:00', '17:30:00'),

-- Nurse 136 (3 days)
(136, 0, '08:00:00', '16:00:00'),
(136, 2, '09:00:00', '17:00:00'),
(136, 4, '10:00:00', '18:00:00'),

-- Nurse 137 (3 days)
(137, 1, '07:00:00', '15:00:00'),
(137, 3, '08:00:00', '16:00:00'),
(137, 5, '09:00:00', '17:00:00'),

-- Nurse 141 (3 days)
(141, 0, '08:30:00', '16:30:00'),
(141, 2, '09:30:00', '17:30:00'),
(141, 4, '10:30:00', '18:30:00'),

-- Nurse 152 (3 days)
(152, 1, '07:00:00', '15:00:00'),
(152, 3, '08:00:00', '16:00:00'),
(152, 5, '09:00:00', '17:00:00'),

-- Nurse 171 (3 days)
(171, 0, '08:00:00', '16:00:00'),
(171, 2, '09:00:00', '17:00:00'),
(171, 4, '10:00:00', '18:00:00'),

-- Nurse 185 (3 days)
(185, 1, '07:30:00', '15:30:00'),
(185, 3, '08:30:00', '16:30:00'),
(185, 5, '09:30:00', '17:30:00'),

-- Nurse 200 (3 days)
(200, 0, '08:00:00', '16:00:00'),
(200, 2, '09:00:00', '17:00:00'),
(200, 4, '10:00:00', '18:00:00');

-- ==========================================
-- Consultations for Doctors and Surgeons
-- ==========================================
-- ==========================================
-- Consultations for Doctors and Surgeons (1-hour duration, mixed statuses)
-- ==========================================
INSERT INTO consultations (hosp_emp_id, patient_id, availability_id, consultation_date, start_time, end_time, consultation_status, consultation_type)
VALUES
-- Doctor 8 consultations
(8, NULL, 1, '2024-12-02', '09:00:00', '10:00:00', 'Scheduled', 'initial_consultation_price'),
(8, NULL, 1, '2024-12-02', '10:30:00', '11:30:00', 'Completed', 'followup_consultation_price'),
(8, NULL, 2, '2024-12-03', '11:00:00', '12:00:00', 'Cancelled', 'initial_consultation_price'),
(8, NULL, 3, '2024-12-05', '14:00:00', '15:00:00', 'Scheduled', 'followup_consultation_price'),

-- Doctor 12 consultations
(12, NULL, 4, '2024-12-01', '09:00:00', '10:00:00', 'Completed', 'initial_consultation_price'),
(12, NULL, 5, '2024-12-03', '10:30:00', '11:30:00', 'Scheduled', 'followup_consultation_price'),
(12, NULL, 6, '2024-12-06', '11:00:00', '12:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 13 consultations
(13, NULL, 7, '2024-12-02', '10:00:00', '11:00:00', 'Scheduled', 'initial_consultation_price'),
(13, NULL, 8, '2024-12-04', '13:00:00', '14:00:00', 'Completed', 'followup_consultation_price'),
(13, NULL, 9, '2024-12-06', '15:00:00', '16:00:00', 'Scheduled', 'initial_consultation_price'),

-- Surgeon 27 consultations
(27, NULL, 64, '2024-12-02', '09:00:00', '10:00:00', 'Completed', 'initial_consultation_price'),
(27, NULL, 65, '2024-12-04', '10:30:00', '11:30:00', 'Cancelled', 'followup_consultation_price'),
(27, NULL, 66, '2024-12-06', '14:00:00', '15:00:00', 'Scheduled', 'initial_consultation_price'),

-- Surgeon 32 consultations
(32, NULL, 67, '2024-12-01', '10:00:00', '11:00:00', 'Scheduled', 'initial_consultation_price'),
(32, NULL, 68, '2024-12-03', '11:30:00', '12:30:00', 'Completed', 'followup_consultation_price'),
(32, NULL, 69, '2024-12-05', '15:00:00', '16:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 22 consultations
(22, NULL, 10, '2024-12-01', '09:00:00', '10:00:00', 'Completed', 'initial_consultation_price'),
(22, NULL, 11, '2024-12-03', '11:00:00', '12:00:00', 'Scheduled', 'followup_consultation_price'),
(22, NULL, 12, '2024-12-05', '14:00:00', '15:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 35 consultations
(35, NULL, 13, '2024-12-02', '10:00:00', '11:00:00', 'Scheduled', 'initial_consultation_price'),
(35, NULL, 14, '2024-12-04', '14:00:00', '15:00:00', 'Completed', 'followup_consultation_price'),
(35, NULL, 15, '2024-12-06', '15:30:00', '16:30:00', 'Scheduled', 'initial_consultation_price'),

-- Surgeon 40 consultations
(40, NULL, 70, '2024-12-02', '11:00:00', '12:00:00', 'Cancelled', 'initial_consultation_price'),
(40, NULL, 71, '2024-12-04', '13:30:00', '14:30:00', 'Scheduled', 'followup_consultation_price'),
(40, NULL, 72, '2024-12-06', '16:00:00', '17:00:00', 'Completed', 'initial_consultation_price'),

-- Doctor 39 consultations
(39, NULL, 16, '2024-12-01', '10:30:00', '11:30:00', 'Scheduled', 'initial_consultation_price'),
(39, NULL, 17, '2024-12-03', '14:00:00', '15:00:00', 'Completed', 'followup_consultation_price'),
(39, NULL, 18, '2024-12-05', '15:30:00', '16:30:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 49 consultations
(49, NULL, 19, '2024-12-02', '09:30:00', '10:30:00', 'Completed', 'initial_consultation_price'),
(49, NULL, 20, '2024-12-04', '11:00:00', '12:00:00', 'Scheduled', 'followup_consultation_price'),
(49, NULL, 21, '2024-12-06', '13:00:00', '14:00:00', 'Scheduled', 'initial_consultation_price'),

-- Surgeon 47 consultations
(47, NULL, 73, '2024-12-01', '10:00:00', '11:00:00', 'Cancelled', 'initial_consultation_price'),
(47, NULL, 74, '2024-12-03', '13:00:00', '14:00:00', 'Scheduled', 'followup_consultation_price'),
(47, NULL, 75, '2024-12-05', '14:30:00', '15:30:00', 'Completed', 'initial_consultation_price'),

-- Doctor 55 consultations
(55, NULL, 22, '2024-12-01', '11:00:00', '12:00:00', 'Scheduled', 'initial_consultation_price'),
(55, NULL, 23, '2024-12-03', '15:00:00', '16:00:00', 'Completed', 'followup_consultation_price'),
(55, NULL, 24, '2024-12-05', '16:30:00', '17:30:00', 'Cancelled', 'initial_consultation_price'),

-- Surgeon 57 consultations
(57, NULL, 76, '2024-12-02', '09:00:00', '10:00:00', 'Completed', 'initial_consultation_price'),
(57, NULL, 77, '2024-12-04', '12:00:00', '13:00:00', 'Scheduled', 'followup_consultation_price'),
(57, NULL, 78, '2024-12-06', '14:00:00', '15:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 68 consultations
(68, NULL, 25, '2024-12-02', '11:30:00', '12:30:00', 'Scheduled', 'initial_consultation_price'),
(68, NULL, 26, '2024-12-04', '14:30:00', '15:30:00', 'Completed', 'followup_consultation_price'),
(68, NULL, 27, '2024-12-06', '16:00:00', '17:00:00', 'Scheduled', 'initial_consultation_price'),

-- Surgeon 66 consultations
(66, NULL, 79, '2024-12-01', '11:00:00', '12:00:00', 'Cancelled', 'initial_consultation_price'),
(66, NULL, 80, '2024-12-03', '15:30:00', '16:30:00', 'Scheduled', 'followup_consultation_price'),
(66, NULL, 81, '2024-12-05', '17:00:00', '18:00:00', 'Completed', 'initial_consultation_price'),

-- Doctor 82 consultations
(82, NULL, 28, '2024-12-01', '09:00:00', '10:00:00', 'Completed', 'initial_consultation_price'),
(82, NULL, 29, '2024-12-03', '10:30:00', '11:30:00', 'Scheduled', 'followup_consultation_price'),
(82, NULL, 30, '2024-12-05', '13:00:00', '14:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 88 consultations
(88, NULL, 31, '2024-12-02', '10:00:00', '11:00:00', 'Scheduled', 'initial_consultation_price'),
(88, NULL, 32, '2024-12-04', '12:30:00', '13:30:00', 'Completed', 'followup_consultation_price'),
(88, NULL, 33, '2024-12-06', '15:00:00', '16:00:00', 'Scheduled', 'initial_consultation_price'),

-- Doctor 98 consultations
(98, NULL, 34, '2024-12-01', '11:00:00', '12:00:00', 'Cancelled', 'initial_consultation_price'),
(98, NULL, 35, '2024-12-03', '13:30:00', '14:30:00', 'Scheduled', 'followup_consultation_price'),
(98, NULL, 36, '2024-12-05', '15:00:00', '16:00:00', 'Completed', 'initial_consultation_price'),

-- Doctor 106 consultations
(106, NULL, 37, '2024-12-02', '09:30:00', '10:30:00', 'Scheduled', 'initial_consultation_price'),
(106, NULL, 38, '2024-12-04', '11:00:00', '12:00:00', 'Completed', 'followup_consultation_price'),
(106, NULL, 39, '2024-12-06', '14:00:00', '15:00:00', 'Cancelled', 'initial_consultation_price'),

-- Doctor 115 consultations
(115, NULL, 40, '2024-12-01', '10:00:00', '11:00:00', 'Completed', 'initial_consultation_price'),
(115, NULL, 41, '2024-12-03', '12:30:00', '13:30:00', 'Scheduled', 'followup_consultation_price'),
(115, NULL, 42, '2024-12-05', '15:30:00', '16:30:00', 'Scheduled', 'initial_consultation_price');

-- ==========================================
-- Staff-Patient Relationships
-- ==========================================


-- Staff_id = 12 (Doctor) assigned to patients
INSERT INTO staff_patient (staff_id, patient_id, relation_type, assigned_date)
VALUES
-- Doctor 12 assigned to patients (focus on staff_id = 12)
(12, 256, 'Doctor', '2024-11-20 09:00:00'),
(12, 258, 'Doctor', '2024-11-21 10:30:00'),
(12, 260, 'Doctor', '2024-11-22 14:15:00'),
(12, 262, 'Doctor', '2024-11-25 11:00:00'),
(12, 264, 'Doctor', '2024-11-26 16:45:00'),
(12, 267, 'Doctor', '2024-11-27 09:30:00'),
(12, 270, 'Doctor', '2024-11-28 13:15:00'),
(12, 273, 'Doctor', '2024-11-29 08:00:00'),

-- Other doctors assigned to patients
(8, 257, 'Doctor', '2024-11-19 08:30:00'),
(8, 259, 'Doctor', '2024-11-20 13:20:00'),
(13, 261, 'Doctor', '2024-11-21 15:10:00'),
(13, 263, 'Doctor', '2024-11-22 09:45:00'),
(22, 265, 'Doctor', '2024-11-23 11:30:00'),
(35, 266, 'Doctor', '2024-11-24 10:20:00'),
(39, 268, 'Doctor', '2024-11-25 14:35:00'),
(49, 269, 'Doctor', '2024-11-26 08:50:00'),
(55, 271, 'Doctor', '2024-11-27 11:00:00'),
(68, 272, 'Doctor', '2024-11-28 15:10:00'),
(82, 274, 'Doctor', '2024-11-29 09:20:00'),
(88, 275, 'Doctor', '2024-11-30 13:30:00'),
(98, 276, 'Doctor', '2024-12-01 10:40:00'),
(106, 277, 'Doctor', '2024-12-02 14:50:00'),
(115, 278, 'Doctor', '2024-12-03 08:15:00'),
(117, 279, 'Doctor', '2024-12-04 16:25:00'),
(124, 280, 'Doctor', '2024-12-05 11:35:00'),
(126, 281, 'Doctor', '2024-12-06 09:45:00'),
(138, 282, 'Doctor', '2024-12-07 13:55:00'),
(144, 283, 'Doctor', '2024-12-08 15:05:00'),
(147, 284, 'Doctor', '2024-12-09 10:15:00'),
(163, 285, 'Doctor', '2024-12-10 14:25:00'),

-- Surgeons assigned to patients
(27, 286, 'Surgeon', '2024-11-24 10:00:00'),
(27, 289, 'Surgeon', '2024-11-25 14:00:00'),
(32, 287, 'Surgeon', '2024-11-26 08:15:00'),
(32, 290, 'Surgeon', '2024-11-27 16:30:00'),
(40, 288, 'Surgeon', '2024-11-28 12:45:00'),
(47, 291, 'Surgeon', '2024-11-29 11:25:00'),
(57, 292, 'Surgeon', '2024-11-30 15:40:00'),
(66, 293, 'Surgeon', '2024-12-01 09:50:00'),
(74, 294, 'Surgeon', '2024-12-02 13:20:00'),
(89, 295, 'Surgeon', '2024-12-03 16:10:00'),
(96, 296, 'Surgeon', '2024-12-04 10:30:00'),
(118, 297, 'Surgeon', '2024-12-05 14:40:00'),
(131, 298, 'Surgeon', '2024-12-06 08:50:00'),
(148, 299, 'Surgeon', '2024-12-07 15:00:00'),
(157, 300, 'Surgeon', '2024-12-08 11:10:00'),
(162, 301, 'Surgeon', '2024-12-09 13:20:00'),

-- Additional assignments for staff_id = 12 with more patients
(12, 302, 'Doctor', '2024-11-30 10:00:00'),
(12, 303, 'Doctor', '2024-12-01 14:30:00'),
(12, 304, 'Doctor', '2024-12-02 11:45:00');

-- ==========================================
-- Perms 
-- ==========================================
INSERT INTO hospital_perms ( perm_name)
VALUES
  (  'Modify Employee Data'),
  (  'Modify Patient Files'),
  (  'Modify Employee Perms'),
  (  'Modify Employee Role'),
  (  'Delete Patient'),
  (  'Access Rooms'),
  (  'Modify Rooms'),
  (  'Modify Other Patient'),
  ( 'Modify My Patient'),
  ( 'Modify Rooms'),
  ( 'Modify Health Status'),
  ( 'Modify Availability'),
  ( 'Access Other Patients.');

-- Insert all permissions for user_id=12
INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
VALUES 
(1, 12),  -- Modify Employee Data
(3, 12),  -- Modify Patient Files
(4, 12),  -- Modify Employee Perms
(5, 12),  -- Modify Employee Role
(6, 12),  -- Delete Patient
(7, 12),  -- Access Rooms
(8, 12),  -- Modify Rooms
(9, 12),  -- Modify Other Patient
(10, 12); -- Modify Patient Data

-- ==========================================
-- Roles
-- ==========================================

-- Insert SuperAdmin role for user_id=12
INSERT INTO hospital_roles (hosp_emp_id, role_name)
VALUES (12, 'SuperAdmin');

