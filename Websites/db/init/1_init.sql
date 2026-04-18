-- ==========================================
-- General Related Tables
-- ==========================================

CREATE TABLE table_version (
    table_name VARCHAR(100) PRIMARY KEY,
    current_version BIGINT NOT NULL
);

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,       -- new column
    modifier_id INT NOT NULL,
    method VARCHAR(50) NOT NULL,
    affects_who JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified users table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE  NOT NULL,
    user_name VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    user_password VARCHAR(255) NOT NULL,
    user_type ENUM('patient', 'employee') NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ==========================================
-- EMS Related Tables
-- ==========================================
-- Employees table
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
    emp_id INT PRIMARY KEY NOT NULL,
    emp_salary INT NOT NULL DEFAULT 0,
    emp_abscence INT NOT NULL DEFAULT 0,
    emp_bonus INT NOT NULL DEFAULT 0,
    emp_rate INT NOT NULL DEFAULT 0,
    emp_title VARCHAR(100) DEFAULT NULL,
    emp_specialty VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (emp_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unregistered employees
DROP TABLE IF EXISTS unregistered_employees;
CREATE TABLE unregistered_employees (
    emp_id INT NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(255) DEFAULT NULL,
    emp_title VARCHAR(100) DEFAULT NULL,
    emp_specialty VARCHAR(100) DEFAULT NULL,
    user_password VARCHAR(255) DEFAULT NULL,
    user_email VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (emp_id),
    UNIQUE KEY (user_email)
);

-- Roles (1:1)
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    emp_id INT NOT NULL,
    role_name ENUM('NormalUser', 'SuperAdmin', 'Admin') NOT NULL,
    PRIMARY KEY (emp_id, role_name),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Permissions
DROP TABLE IF EXISTS perms;
CREATE TABLE perms (
    perm_id INT NOT NULL,
    perm_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (perm_id)
);

-- Employee permissions (1:M)
DROP TABLE IF EXISTS employee_perms;
CREATE TABLE employee_perms (
    perm_id INT NOT NULL,
    emp_id INT NOT NULL,
    UNIQUE KEY (perm_id, emp_id),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (perm_id) REFERENCES perms(perm_id)
);

-- ==========================================
-- Hospital Related Tables
-- ==========================================

-- ==========================================
-- Employees_Hospital (Bridge Table to store all employees_hospital ids in one place)

DROP TABLE IF EXISTS employees_hospital;
CREATE TABLE employees_hospital (
    hosp_emp_id INT NOT NULL PRIMARY KEY , 
    emp_id INT NOT NULL UNIQUE,
    emp_title VARCHAR(50) NOT NULL, -- Employee refers to non-hospital staff
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
    emp_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (emp_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Surgeons

DROP TABLE IF EXISTS surgeons;
CREATE TABLE surgeons (
    emp_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    surgery_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (emp_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Nurses

DROP TABLE IF EXISTS nurses;
CREATE TABLE nurses (
    emp_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,  
    floor_number INT NOT NULL DEFAULT -1,
    FOREIGN KEY (emp_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ==========================================
-- patients

DROP TABLE IF EXISTS patients;
CREATE TABLE patients (
    user_id INT PRIMARY KEY,     -- unique patient ID
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
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);





-- ==========================================
-- doctor_patient (Map  doctors to patients)

DROP TABLE IF EXISTS staff_patient;
CREATE TABLE staff_patient (
    staff_id INT NOT NULL,     
    user_id INT NOT NULL,
    relation_type ENUM('Doctor', 'Surgeon', 'Nurse', 'Employee') NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (staff_id, user_id, relation_type),

    FOREIGN KEY (staff_id) REFERENCES employees_hospital(emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (user_id) REFERENCES patients(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);






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
    user_id INT NULL,                            -- patient assigned (if any)
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

    FOREIGN KEY (user_id)
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
    user_id INT DEFAULT NULL,
    isOccupied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE (room_number, floor_id) -- prevent duplicate room numbers on the same floor
);

-- ====================================================================================
--          Medicine Related Tables
-- ====================================================================================

-- Patient-medicine assignment (one row per patient+medicine pair)
CREATE TABLE patient_meds (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id  INT         NOT NULL,
    med_id      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES patients(user_id) ON DELETE CASCADE
);

-- Each scheduled time for that assignment (one row per dose time)
-- e.g. twice a day = 2 rows pointing to the same patient_meds.id
CREATE TABLE patient_med_times (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_med_id  INT     NOT NULL,
    take_at         TIME    NOT NULL,   -- e.g. '08:00:00', '20:00:00'

    FOREIGN KEY (patient_med_id) REFERENCES patient_meds(id) ON DELETE CASCADE
);
-- ====================================================================================
--          INDEX For faster searching (many unique values for column)
-- ====================================================================================


CREATE INDEX ix_users_user_email ON users(user_email);

CREATE INDEX ix_patients_patient_phone ON patients(patient_phone);

CREATE INDEX ix_consultations_hosp_emp_id ON consultations(hosp_emp_id);

CREATE INDEX ix_consultations_user_id ON consultations(user_id);

CREATE INDEX ix_availability_user_id ON availability(hosp_emp_id);

CREATE INDEX ix_employees_emp_specialty ON employees(emp_specialty);


