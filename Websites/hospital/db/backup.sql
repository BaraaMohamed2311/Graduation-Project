use ems_db;
show tables;

CREATE INDEX idx_emp_title ON employees(emp_title);
CREATE INDEX idx_emp_email ON employees(emp_email);
CREATE INDEX idx_pat_email ON patients(patient_email);

SELECT * FROM employees where emp_title = "Nurse";
SELECT * FROM hospital_roles where hosp_emp_id = 1016;

SELECT COALESCE((SELECT COALESCE(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ') , 'None') FROM hospital_perms hp JOIN hospital_emp_perms hep ON hp.perm_id = hep.perm_id WHERE hep.hosp_emp_id =1016), 'None') AS perm_name;
SELECT hp.perm_name FROM hospital_perms hp JOIN hospital_emp_perms hep ON hp.perm_id = hep.perm_id WHERE hep.hosp_emp_id = 1016;

SELECT * FROM doctors ;

SELECT * FROM surgeons;

SELECT * FROM nurses;

SELECT * FROM patients ;

SELECT * FROM patients where patient_email = "nourhan.adel8149@gmail.com";
SELECT * FROM surgeons where surgeon_id = 1004;
SELECT * FROM nurses where nurse_id = 1003;

SELECT * FROM doctor_patient;

SELECT * FROM doctor_availability;

SELECT * FROM employees_hospital where hosp_emp_id = 1204;

SELECT * FROM hospital_perms;


SELECT * FROM hospital_emp_perms;


SELECT * FROM hospital_roles;

SELECT 
        -- Doctor info
        d.doctor_id,
        d.hosp_emp_id,
        d.initial_consultation_price,
        d.followup_consultation_price,
        d.years_of_exp,
		GROUP_CONCAT(
        CONCAT(da.day_of_week, ': ', da.start_time, '-', da.end_time)
        ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
        SEPARATOR '; '
		) AS availability_schedule
    FROM doctors d
    JOIN doctor_availability da
    ON d.doctor_id = da.doctor_id

    WHERE d.doctor_id = 1016  GROUP BY d.doctor_id, d.hosp_emp_id, d.initial_consultation_price, d.followup_consultation_price, d.years_of_exp;


SELECT 
    d.doctor_id,
    da.day_of_week,
    da.start_time,
    da.end_time
FROM doctors d
JOIN doctor_availability da 
    ON d.doctor_id = da.doctor_id
WHERE d.doctor_id = 1016
ORDER BY FIELD(da.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday');


SELECT 
    p.patient_id,
    p.patient_name,
    p.patient_email,
    p.patient_phone,
    p.patient_address,
    p.isAssignedToRoom,
    p.floor_number,
    p.room_number,
    p.date_of_birth,
    p.next_check_date,
    p.patient_gender,
    p.emergency_contact,
    p.created_at,
    dp.assigned_date
FROM doctor_patient dp
JOIN patients p 
    ON dp.patient_id = p.patient_id
WHERE dp.doctor_id = 1016;

-- ==========================================
-- Employees_Hospital (Bridge Table)
-- ==========================================
DROP TABLE IF EXISTS employees_hospital;
CREATE TABLE employees_hospital (
    hosp_emp_id INT NOT NULL PRIMARY KEY , -- not unique by itself as users added could have same id but in different tables
    emp_id INT NOT NULL UNIQUE,
    emp_title ENUM('Doctor', 'Surgeon', 'Nurse','Employee') NOT NULL,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
	UNIQUE (hosp_emp_id, emp_title) -- that's why combination has to be unique
);



-- ==========================================
-- Doctors
-- ==========================================
DROP TABLE IF EXISTS doctors;
CREATE TABLE doctors (
    doctor_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Surgeons
-- ==========================================
DROP TABLE IF EXISTS surgeons;
CREATE TABLE surgeons (
    surgeon_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,
    initial_consultation_price INT NOT NULL DEFAULT 0,
    followup_consultation_price INT NOT NULL DEFAULT 0,
    surgery_price INT NOT NULL DEFAULT 0,
    years_of_exp INT NOT NULL DEFAULT 0,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- Nurses
-- ==========================================
DROP TABLE IF EXISTS nurses;
CREATE TABLE nurses (
    nurse_id INT PRIMARY KEY,
    hosp_emp_id INT UNIQUE NOT NULL,  
    floor_number INT NOT NULL DEFAULT -1,
    FOREIGN KEY (hosp_emp_id) REFERENCES employees_hospital(hosp_emp_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- Patients table
DROP TABLE IF EXISTS patients;
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,     -- unique patient ID
    patient_name VARCHAR(100) NOT NULL,
    patient_email varchar(50) DEFAULT NULL,
	patient_password varchar(255) DEFAULT NULL,
    patient_phone VARCHAR(20),
    patient_address VARCHAR(255),
    isAssignedToRoom BOOLEAN DEFAULT FALSE,  
    room_number INT NOT NULL DEFAULT -1,
    floor_number INT NOT NULL DEFAULT -1,
    date_of_birth DATE,
    next_check_date DATE,
    patient_gender ENUM('Male', 'Female', 'Other'),
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




-- Join table (many-to-many relationship between doctors and patients)
DROP TABLE IF EXISTS doctor_patient;
CREATE TABLE doctor_patient (
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- when doctor started treating patient
    PRIMARY KEY (doctor_id, patient_id),              -- composite PK
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================
-- doctor_availability
-- ==========================================

DROP TABLE IF EXISTS availability;
CREATE TABLE availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,   -- unique slot id
    hosp_emp_id INT NOT NULL,                           -- FK to doctors
    day_of_week ENUM(
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
    ) NOT NULL,
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
-- Hospital Permissions
-- ==========================================
DROP TABLE IF EXISTS hospital_perms;
CREATE TABLE hospital_perms (
  perm_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  perm_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- sample perms
INSERT INTO hospital_perms VALUES
 (1,'Modify Employee Data'),
 (3,'Modify Patient Files'),
 (4,'Modify Employee Perms'),
 (5,'Modify Employee Role'),
 (6,'Delete Patient'),
 (7,'Access Rooms')و
 (8,'Modify Rooms'),
(9,'Modify Other Patient'),
(10,'Modify Patient Data');






select * from hospital_perms;




-- ==========================================
-- Hospital Employee → Permissions (bridge)
-- ==========================================
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
--
-- Table structure for table `roles`
--

-- ==========================================
-- Hospital Roles
-- ==========================================
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
-- Hospital Rooms and Floors
-- ==========================================
DROP TABLE IF EXISTS floors;
CREATE TABLE floors (
    floor_id INT AUTO_INCREMENT PRIMARY KEY,
    floor_number INT NOT NULL UNIQUE
);



-- Rooms table (each room belongs to one floor)
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number INT NOT NULL,
    floor_id INT NOT NULL,
    patient_id INT DEFAULT NULL,
    isOccupied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    UNIQUE (room_number, floor_id) -- prevent duplicate room numbers on the same floor
);



-- ==========================================
-- Add users ids to employees_hospital then add them to each seperate table
-- ==========================================

-- for baraamohamed2311@gmail.com
INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title) VALUES
(1200, 1200, 'Employee');

-- Doctors
INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title) VALUES
(1016, 1016, 'Doctor'),
(1045, 1045, 'Doctor'),
(1065, 1065, 'Doctor'),
(1067, 1067, 'Doctor'),
(1075, 1075, 'Doctor'),
(1077, 1077, 'Doctor'),
(1088, 1088, 'Doctor'),
(1090, 1090, 'Doctor'),
(1091, 1091, 'Doctor'),
(1095, 1095, 'Doctor'),
(1102, 1102, 'Doctor'),
(1105, 1105, 'Doctor'),
(1120, 1120, 'Doctor'),
(1124, 1124, 'Doctor'),
(1134, 1134, 'Doctor'),
(1148, 1148, 'Doctor'),
(1156, 1156, 'Doctor'),
(1162, 1162, 'Doctor'),
(1192, 1192, 'Doctor');


-- Surgeons
INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title) VALUES
(1004, 1004, 'Surgeon'),
(1029, 1029, 'Surgeon'),
(1046, 1046, 'Surgeon'),
(1061, 1061, 'Surgeon'),
(1080, 1080, 'Surgeon'),
(1083, 1083, 'Surgeon'),
(1089, 1089, 'Surgeon'),
(1099, 1099, 'Surgeon'),
(1103, 1103, 'Surgeon'),
(1155, 1155, 'Surgeon'),
(1158, 1158, 'Surgeon'),
(1179, 1179, 'Surgeon'),
(1180, 1180, 'Surgeon'),
(1190, 1190, 'Surgeon');


-- Nurses
INSERT INTO employees_hospital (hosp_emp_id, emp_id, emp_title) VALUES
(1003, 1003, 'Nurse'),
(1024, 1024, 'Nurse'),
(1034, 1034, 'Nurse'),
(1039, 1039, 'Nurse'),
(1047, 1047, 'Nurse'),
(1068, 1068, 'Nurse'),
(1069, 1069, 'Nurse'),
(1072, 1072, 'Nurse'),
(1093, 1093, 'Nurse'),
(1100, 1100, 'Nurse'),
(1108, 1108, 'Nurse'),
(1110, 1110, 'Nurse'),
(1116, 1116, 'Nurse'),
(1127, 1127, 'Nurse'),
(1142, 1142, 'Nurse'),
(1153, 1153, 'Nurse'),
(1168, 1168, 'Nurse'),
(1172, 1172, 'Nurse'),
(1175, 1175, 'Nurse'),
(1196, 1196, 'Nurse');




INSERT INTO doctors (doctor_id, hosp_emp_id, initial_consultation_price, followup_consultation_price, years_of_exp) VALUES
(1016, 1016, 1200, 800, 12),
(1045, 1045, 1500, 900, 18),
(1065, 1065, 700, 500, 7),
(1067, 1067, 1800, 1600, 22),
(1075, 1075, 1300, 600, 15),
(1077, 1077, 500, 300, 5),
(1088, 1088, 1700, 1000, 20),
(1090, 1090, 1400, 1100, 14),
(1091, 1091, 1900, 1500, 25),
(1095, 1095, 800, 600, 8),
(1102, 1102, 1600, 700, 19),
(1105, 1105, 600, 400, 6),
(1120, 1120, 1000, 900, 10),
(1124, 1124, 2000, 1800, 28),
(1134, 1134, 900, 500, 9),
(1148, 1148, 1500, 1200, 16),
(1156, 1156, 1100, 700, 11),
(1162, 1162, 1300, 600, 13),
(1192, 1192, 1700, 900, 21);



INSERT INTO surgeons (surgeon_id, hosp_emp_id, initial_consultation_price, followup_consultation_price, years_of_exp, surgery_price) VALUES
(1004, 1004, 1500, 1200, 18, 25000),
(1029, 1029, 1700, 1400, 22, 40000),
(1046, 1046, 1300, 1000, 12, 15000),
(1061, 1061, 1200, 900, 10, 12000),
(1080, 1080, 2000, 1700, 25, 60000),
(1083, 1083, 1400, 1100, 14, 18000),
(1089, 1089, 1600, 1300, 20, 30000),
(1099, 1099, 1100, 800, 8, 10000),
(1103, 1103, 1800, 1500, 24, 50000),
(1155, 1155, 1000, 700, 7, 8000),
(1158, 1158, 900, 600, 6, 7000),
(1179, 1179, 1500, 1200, 16, 22000),
(1180, 1180, 1700, 1400, 21, 35000),
(1190, 1190, 1400, 1100, 13, 20000);

INSERT INTO nurses (nurse_id, hosp_emp_id, floor_number) VALUES
(1003, 1003, 3),
(1024, 1024, 2),
(1034, 1034, 2),
(1039, 1039, 5),
(1047, 1047, 4),
(1068, 1068, 4),
(1069, 1069, 3),
(1072, 1072, 1),
(1093, 1093, 2),
(1100, 1100, 3),
(1108, 1108, 4),
(1110, 1110, 3),
(1116, 1116, 1),
(1127, 1127, 2),
(1142, 1142, 3),
(1153, 1153, 4),
(1168, 1168, 4),
(1172, 1172, 3),
(1175, 1175, 2),
(1196, 1196, 1);

INSERT INTO availability (hosp_emp_id, day_of_week, start_time, end_time)
VALUES
-- 🔹 Surgeons
(1004, 'Monday', '08:00:00', '12:00:00'),
(1004, 'Thursday', '13:00:00', '17:00:00'),

(1029, 'Tuesday', '09:00:00', '13:00:00'),
(1029, 'Friday', '14:00:00', '18:00:00'),

(1046, 'Wednesday', '10:00:00', '14:00:00'),
(1046, 'Saturday', '09:00:00', '13:00:00'),

(1061, 'Monday', '14:00:00', '18:00:00'),
(1061, 'Thursday', '08:00:00', '12:00:00'),

(1080, 'Tuesday', '08:30:00', '12:30:00'),
(1080, 'Friday', '15:00:00', '19:00:00'),

(1083, 'Wednesday', '09:00:00', '13:00:00'),
(1083, 'Sunday', '10:00:00', '14:00:00'),

(1089, 'Thursday', '13:30:00', '17:30:00'),
(1089, 'Saturday', '08:00:00', '12:00:00'),

(1099, 'Monday', '09:00:00', '13:00:00'),
(1099, 'Friday', '14:00:00', '18:00:00'),

(1103, 'Tuesday', '10:00:00', '14:00:00'),
(1103, 'Thursday', '15:00:00', '19:00:00'),

(1155, 'Wednesday', '08:00:00', '12:00:00'),
(1155, 'Saturday', '13:00:00', '17:00:00'),

(1158, 'Monday', '13:00:00', '17:00:00'),
(1158, 'Thursday', '09:00:00', '13:00:00'),

(1179, 'Tuesday', '09:30:00', '13:30:00'),
(1179, 'Friday', '15:30:00', '19:30:00'),

(1180, 'Wednesday', '10:00:00', '14:00:00'),
(1180, 'Sunday', '08:00:00', '12:00:00'),

(1190, 'Thursday', '08:30:00', '12:30:00'),
(1190, 'Saturday', '14:00:00', '18:00:00'),

-- 🔹 Nurses
(1003, 'Monday', '07:00:00', '11:00:00'),
(1003, 'Thursday', '13:00:00', '17:00:00'),

(1024, 'Tuesday', '08:00:00', '12:00:00'),
(1024, 'Friday', '14:00:00', '18:00:00'),

(1034, 'Wednesday', '07:30:00', '11:30:00'),
(1034, 'Saturday', '12:00:00', '16:00:00'),

(1039, 'Monday', '12:00:00', '16:00:00'),
(1039, 'Thursday', '08:00:00', '12:00:00'),

(1047, 'Tuesday', '09:00:00', '13:00:00'),
(1047, 'Friday', '13:00:00', '17:00:00'),

(1068, 'Wednesday', '10:00:00', '14:00:00'),
(1068, 'Sunday', '08:00:00', '12:00:00'),

(1069, 'Monday', '07:00:00', '11:00:00'),
(1069, 'Saturday', '13:00:00', '17:00:00'),

(1072, 'Tuesday', '08:30:00', '12:30:00'),
(1072, 'Friday', '15:00:00', '19:00:00'),

(1093, 'Wednesday', '09:00:00', '13:00:00'),
(1093, 'Thursday', '14:00:00', '18:00:00'),

(1100, 'Monday', '12:30:00', '16:30:00'),
(1100, 'Friday', '08:00:00', '12:00:00'),

(1108, 'Tuesday', '07:00:00', '11:00:00'),
(1108, 'Sunday', '13:00:00', '17:00:00'),

(1110, 'Wednesday', '08:00:00', '12:00:00'),
(1110, 'Saturday', '14:00:00', '18:00:00'),

(1116, 'Monday', '09:00:00', '13:00:00'),
(1116, 'Thursday', '15:00:00', '19:00:00'),

(1127, 'Tuesday', '10:00:00', '14:00:00'),
(1127, 'Friday', '09:00:00', '13:00:00'),

(1142, 'Wednesday', '07:30:00', '11:30:00'),
(1142, 'Sunday', '14:00:00', '18:00:00'),

(1153, 'Monday', '13:00:00', '17:00:00'),
(1153, 'Thursday', '09:00:00', '13:00:00'),

(1168, 'Tuesday', '08:00:00', '12:00:00'),
(1168, 'Saturday', '12:00:00', '16:00:00'),

(1172, 'Wednesday', '09:30:00', '13:30:00'),
(1172, 'Friday', '14:30:00', '18:30:00'),

(1175, 'Monday', '08:00:00', '12:00:00'),
(1175, 'Thursday', '13:00:00', '17:00:00'),

(1196, 'Tuesday', '07:30:00', '11:30:00'),
(1196, 'Sunday', '10:00:00', '14:00:00');







-- baraamohamed2311@gmail.com as SuperAdmin
INSERT INTO hospital_roles (hosp_emp_id, role_name) VALUES
(1200, 'SuperAdmin');

-- Doctors as Admins
INSERT INTO hospital_roles (hosp_emp_id, role_name) VALUES
(1016, 'Admin'),
(1045, 'Admin'),
(1065, 'Admin'),
(1067, 'Admin'),
(1075, 'Admin'),
(1077, 'Admin'),
(1088, 'Admin'),
(1090, 'Admin'),
(1091, 'Admin'),
(1095, 'Admin'),
(1102, 'Admin'),
(1105, 'Admin'),
(1120, 'Admin'),
(1124, 'Admin'),
(1134, 'Admin'),
(1148, 'Admin'),
(1156, 'Admin'),
(1162, 'Admin'),
(1192, 'Admin');

-- Surgeons as Admins
INSERT INTO hospital_roles (hosp_emp_id, role_name) VALUES
(1004, 'Admin'),
(1029, 'Admin'),
(1046, 'Admin'),
(1061, 'Admin'),
(1080, 'Admin'),
(1083, 'Admin'),
(1089, 'Admin'),
(1099, 'Admin'),
(1103, 'Admin'),
(1155, 'Admin'),
(1158, 'Admin'),
(1179, 'Admin'),
(1180, 'Admin'),
(1190, 'Admin');

-- Nurses as Admins
INSERT INTO hospital_roles (hosp_emp_id, role_name) VALUES
(1003, 'Admin'),
(1024, 'Admin'),
(1034, 'Admin'),
(1039, 'Admin'),
(1047, 'Admin'),
(1068, 'Admin'),
(1069, 'Admin'),
(1072, 'Admin'),
(1093, 'Admin'),
(1100, 'Admin'),
(1108, 'Admin'),
(1110, 'Admin'),
(1116, 'Admin'),
(1127, 'Admin'),
(1142, 'Admin'),
(1153, 'Admin'),
(1168, 'Admin'),
(1172, 'Admin'),
(1175, 'Admin'),
(1196, 'Admin');

-- patients
INSERT INTO `patients` (patient_id, patient_name, patient_email, patient_password, patient_phone, patient_address, isAssignedToRoom, floor_number, date_of_birth, next_check_date, patient_gender, emergency_contact) VALUES
(1,'Ahmed El-Sayed','ahmed.el-sayed9672@gmail.com','$2b$12$fdO6tfPx7ScGN08jbdtSIeyAWkC3G9yZWcqbI1kLxkTEOO4wBTF2e','01597240455','Maadi, Cairo',FALSE,-1,'1983-03-10','2025-10-02','Male','Nourhan Adel - 01230597742'),
(2,'Nada Fahmy','nada.fahmy472@gmail.com','$2b$12$yLCreYUqdVr76QCigEga/enAXG/zjNP6pX/T9kUcY9jzW/tp/h6zq','01296722388','Heliopolis, Cairo',TRUE,6,'1959-08-03','2025-10-17','Male','Heba Said - 01172775502'),
(3,'Mona Hassan','mona.hassan507@gmail.com','$2b$12$CnHqcKtP3KkVsOZfhQkJ9uTaFC0aFB/4T2pfaPBhdx8jmg6XGqbsi','01127877754','Mansoura, Dakahlia',TRUE,3,'1980-09-03','2025-10-17','Female','Heba Said - 01573388042'),
(4,'Mai Kamal','mai.kamal1099@gmail.com','$2b$12$5bhuAZ5KGpn40ljAeqRgAeTUMJrxV.DqUn9d6bfdWp5Gfv.WJhd/y','01009852410','Shobra, Cairo',TRUE,5,'1960-04-05','2025-10-17','Male','Khaled Naguib - 01531325539'),
(5,'Mona Hassan','mona.hassan1343@gmail.com','$2b$12$zIXd1Re.Lf2oaUKBKjKYGer2..HC2j9GmcRuMn.iPcJOVfKTMuNm6','01230889100','Port Said, Egypt',TRUE,3,'1950-07-08','2025-10-05','Male','Hana Saad - 01099078430'),
(6,'Mahmoud Tarek','mahmoud.tarek3417@gmail.com','$2b$12$j/.1htJwy81jDnjZTg2t3uHsgi6vNDU2mpSbjbAWxvcVVCx27BOiu','01524465071','Nasr City, Cairo',FALSE,-1,'2003-09-21','2025-10-15','Female','Salma Ibrahim - 01272550336'),
(7,'Youssef Ali','youssef.ali4565@gmail.com','$2b$12$W.6Nk1RkFRBwOPmLbxdi/.e13rS25K8aPtEWv.8fccvKRD3Ruslgy','01016902922','Maadi, Cairo',TRUE,6,'1955-12-08','2025-10-18','Male','Tarek Ismail - 01000954574'),
(8,'Ramy Amin','ramy.amin581@gmail.com','$2b$12$PJ4GxC07sDkBEK3gLgWSSehXJiHBHxP9ApOcatZ3pejSRVH4/.6ay','01107687690','Maadi, Cairo',TRUE,0,'2007-09-25','2025-10-16','Female','Youssef Ali - 01207836765'),
(9,'Salma Ibrahim','salma.ibrahim4419@gmail.com','$2b$12$JTzZesSgZqaGB95RV2p/ou4E9gDlRbrcx.61DocOWBWs4qiNzr3C2','01286728653','Heliopolis, Cairo',FALSE,-1,'1965-03-29','2025-10-02','Female','Ziad Fouad - 01594934682'),
(10,'Karim Mostafa','karim.mostafa6766@gmail.com','$2b$12$/HaMkpKyibAnEZoxfG3S9.oLD3vDsp9ncYhoykteY1WYgk5qrRq2i','01054628239','6th of October City, Giza',TRUE,3,'1985-05-27','2025-10-16','Male','Ahmed El-Sayed - 01513989704'),
(11,'Mona Hassan','mona.hassan245@gmail.com','$2b$12$8gKdsWPlgxpcz5JU8mhMTOeeoED.2bs4QQPX1qM.7q7Nj7cWkddDe','01570878870','Nasr City, Cairo',TRUE,5,'1985-05-08','2025-10-10','Female','Mahmoud Tarek - 01270243875'),
(12,'Karim Mostafa','karim.mostafa5236@gmail.com','$2b$12$Y4JOmhujQWg1KCFf0JASHOCORW/5eXQKV1nP9bxObO92OejC/Ur2a','01088895993','Alexandria, Roushdy',TRUE,2,'1951-12-11','2025-09-26','Male','Mariam Kamal - 01240043837'),
(13,'Mariam Kamal','mariam.kamal8674@gmail.com','$2b$12$B1lB37gya9XjGyNp2hLiPeGI/.hXrHvfK.6ISkrl11mvc9sSqmDE6','01567917897','Heliopolis, Cairo',FALSE,-1,'1989-11-18','2025-10-10','Female','Nourhan Adel - 01040976564'),
(14,'Fatma Hassan','fatma.hassan7044@gmail.com','$2b$12$DdnE/N6HDclTmG482PliiOE0KSb3jN3x9Cj1ektKehkdKRzZGk4h2','01127093919','Maadi, Cairo',FALSE,-1,'1989-09-22','2025-10-12','Female','Nourhan Adel - 01016860887'),
(15,'Ahmed El-Sayed','ahmed.el-sayed9556@gmail.com','$2b$12$knt1CShmxX/sxLb9tYA4ceDDMdq5EHDNlpJAKjxyuPc9RlSVZX7Um','01199572175','Alexandria, Roushdy',FALSE,-1,'1956-01-13','2025-10-18','Male','Heba Said - 01261647175'),
(16,'Nourhan Adel','nourhan.adel8149@gmail.com','$2b$12$hHx5Eyu0Fmb4bmOFeGFmHuahFtVXZ2u3W1tpW7GdrQDiGcpxMoZaa','01121712113','Nasr City, Cairo',FALSE,-1,'1950-06-18','2025-09-23','Male','Nada Fahmy - 01166559178'),
(17,'Karim Mostafa','karim.mostafa6811@gmail.com','$2b$12$IA6Yi0XElIwH/3qwPXatSutJckkkp8juwHKua56xWubzCV4wIeESS','01564052201','6th of October City, Giza',FALSE,-1,'1992-06-06','2025-10-19','Female','Salma Ibrahim - 01029320607'),
(18,'Ramy Amin','ramy.amin7324@gmail.com','$2b$12$ja16KLPzi4aHcOrrR02Iuu06MSdGKndaOuOfhOBfAqGTde8U236C6','01568344942','Zagazig, Sharqia',FALSE,-1,'1979-06-08','2025-10-02','Male','Mona Hassan - 01095902939'),
(19,'Hana Saad','hana.saad8530@gmail.com','$2b$12$uN8Ty/B10XZisu76DY1J/u5sdJJFCOAtXxrVGzOUS4xxFzxAeKdPK','01094521989','Alexandria, Roushdy',TRUE,0,'1978-02-03','2025-09-27','Male','Hana Saad - 01537397973'),
(20,'Ziad Fouad','ziad.fouad1261@gmail.com','$2b$12$lTfTrECvDeV0huOrDq2Yje4AXo1N7OHB0/mOTjVbzWifbmxMM0nGi','01298695016','Dokki, Giza',FALSE,-1,'1965-01-31','2025-09-25','Female','Ahmed El-Sayed - 01265080767'),
(21,'Tarek Ismail','tarek.ismail843@gmail.com','$2b$12$Vck5yh2XMgQGZLiyioExB.Eucs9fqf6ygWDlrSPolmrARNfD3RjCO','01253889002','Alexandria, Roushdy',FALSE,-1,'1957-04-03','2025-09-30','Male','Mai Kamal - 01590529259'),
(22,'Nada Fahmy','nada.fahmy6439@gmail.com','$2b$12$xJKBSc22xvqCQe4i3FfowuTfwY1.GJXI2oe9mgAQ9ogziuzBtVbWS','01504605385','Port Said, Egypt',TRUE,5,'2013-03-15','2025-09-23','Female','Karim Mostafa - 01039534751'),
(23,'Amr Halim','amr.halim1037@gmail.com','$2b$12$WwzyLsGzR0y15muirra8q.TXDLbPgBz.LqTde3T6O0XHAMEAjOyXq','01054268659','Zagazig, Sharqia',TRUE,4,'1977-03-18','2025-10-07','Female','Omar Farouk - 01523417195'),
(24,'Tarek Ismail','tarek.ismail3337@gmail.com','$2b$12$3exYEXgNKfS0syucJelQMeqb307/RhTzP2j8WbiFwlq.ImtPIh.Zi','01261482476','Shobra, Cairo',FALSE,-1,'1966-08-06','2025-10-04','Female','Ziad Fouad - 01547155686'),
(25,'Mahmoud Tarek','mahmoud.tarek8739@gmail.com','$2b$12$lVd.WltDUNAW4ha53xVWne5T5p8HlqnlNl.8aHy4St92ZNiF646.y','01223657526','Dokki, Giza',TRUE,1,'2010-03-08','2025-09-22','Male','Ziad Fouad - 01184722921'),
(26,'Layla Mohamed','layla.mohamed8671@gmail.com','$2b$12$0cVTF8gRb6BuN6TxPNzi..Z5zhZHNPw4/ZIpgHIUYXBoUTdkFIag2','01599247727','Port Said, Egypt',FALSE,-1,'1986-05-01','2025-09-27','Female','Mariam Kamal - 01213134579'),
(27,'Fatma Hassan','fatma.hassan4758@gmail.com','$2b$12$Z8KFprugN5F0BPOzuftKA.rbpd1A6OHgldQggcEq2/fJMwlw1EYXm','01166895602','Shobra, Cairo',TRUE,3,'2012-04-25','2025-10-20','Male','Ahmed El-Sayed - 01546267855'),
(28,'Fatma Hassan','fatma.hassan9934@gmail.com','$2b$12$mwbx3Z0ynYbMeQyUJKb3qu0VP6Q/9j6tLxnf5Z7PEKwJrl1tWe1/e','01588906911','Nasr City, Cairo',FALSE,-1,'2008-02-04','2025-10-01','Male','Ramy Amin - 01168517634'),
(29,'Khaled Naguib','khaled.naguib3118@gmail.com','$2b$12$fuFYsPFa7Wb/8fsqRwYbz.xSHu1s2GNG2okX0QhrjbyWBHc7Iebs2','01055250955','Zagazig, Sharqia',FALSE,-1,'1962-07-12','2025-10-16','Male','Mariam Kamal - 01516224669'),
(30,'Omar Farouk','omar.farouk6660@gmail.com','$2b$12$fD3U6oXQD3IDKfJM4ZOngukqZgC0/TR3wn4jIIyQ0JRbrC4GhUXpi','01541925545','Port Said, Egypt',FALSE,-1,'1999-02-17','2025-10-11','Male','Salma Ibrahim - 01200984372'),
(31,'Nourhan Adel','nourhan.adel3790@gmail.com','$2b$12$em/2PV.FqmwmVMjV7XJAeOPxdRB9L4HqbrD9Xh98wDikCXOz/Zcai','01594433445','6th of October City, Giza',FALSE,-1,'2014-03-03','2025-10-02','Female','Fatma Hassan - 01533572255'),
(32,'Heba Said','heba.said3399@gmail.com','$2b$12$D5lLBe4zyXU/4VYIcC1x.uzMkAwFQXDBU6tSmldEja8.wfBtlAl5m','01145083777','Maadi, Cairo',FALSE,-1,'1968-05-20','2025-09-22','Female','Amr Halim - 01564129068'),
(33,'Tarek Ismail','tarek.ismail6620@gmail.com','$2b$12$8j2IKagpgattbm40hn2XzOWeTPhcMdaUNECIeZCtf038VxwHPMSS.','01035187230','Nasr City, Cairo',FALSE,-1,'2011-09-28','2025-10-13','Female','Hana Saad - 01192514162'),
(34,'Mariam Kamal','mariam.kamal9632@gmail.com','$2b$12$qNTEvOcUyQSxXKPOFOPp7.BkRtBVAAbiLJXEFxs.QPGeb2z7pLKki','01165223471','Heliopolis, Cairo',TRUE,6,'1952-03-03','2025-10-16','Female','Ramy Amin - 01256966214'),
(35,'Tarek Ismail','tarek.ismail898@gmail.com','$2b$12$.p1zZuNze8jy4VXRnkn0UuycJN2JSIC73LmQxJmhevnfmtlmgFpey','01136257968','Dokki, Giza',FALSE,-1,'1959-10-23','2025-09-24','Male','Karim Mostafa - 01186718761'),
(36,'Salma Ibrahim','salma.ibrahim2709@gmail.com','$2b$12$ncsOELsL6nSQ1CVO49xaru78Gu/U9zDgcgI5dso9yInrCIYkXjfRS','01086036592','Shobra, Cairo',TRUE,4,'1996-04-23','2025-10-01','Male','Omar Farouk - 01531387105'),
(37,'Heba Said','heba.said965@gmail.com','$2b$12$XMv7/mNhQvNfjj2RkHqtg.Ef7UieKlj2CikdsUOJIXNHjcfk91MQi','01093589436','Heliopolis, Cairo',TRUE,3,'1952-10-18','2025-10-05','Male','Amr Halim - 01029300099'),
(38,'Khaled Naguib','khaled.naguib8097@gmail.com','$2b$12$SC8AAks7ajfSWAgY9KubFOLTZlT1JB4XYhwjaqu1Qfi5EDD4dA0a6','01163818426','Maadi, Cairo',TRUE,0,'1963-03-30','2025-10-20','Male','Youssef Ali - 01074146984'),
(39,'Mariam Kamal','mariam.kamal259@gmail.com','$2b$12$DvjxrxL0yv1oHP901qMV3.0Q/w8GZ6K0dzK6P5ExFX3tecNBIHqBG','01187223682','Nasr City, Cairo',FALSE,-1,'1951-01-29','2025-10-10','Female','Salma Ibrahim - 01094327098'),
(40,'Omar Farouk','omar.farouk9410@gmail.com','$2b$12$1Sfy7BTqrXcX.DHqRb1q/.WnjuFK5v9mwTAl.UAcb1lkfbWgC.R8K','01014248159','Zagazig, Sharqia',FALSE,-1,'1952-01-21','2025-10-05','Female','Mahmoud Tarek - 01118774492'),
(41,'Tarek Ismail','tarek.ismail2553@gmail.com','$2b$12$eEWDWHRNcsQNYQmAARPHg..fLoxno1/EK6ESNfUyYfz3MYICoAc4S','01117403221','Maadi, Cairo',TRUE,2,'1991-01-26','2025-09-23','Female','Nada Fahmy - 01528129834'),
(42,'Fatma Hassan','fatma.hassan1807@gmail.com','$2b$12$Xib3jKvD9esJYIJxOazU/ejQ6EABz2Mtrr1HmH6aD7MP0z1Fkx6T2','01265208117','6th of October City, Giza',TRUE,6,'1966-08-31','2025-10-06','Male','Nada Fahmy - 01068093996'),
(43,'Heba Said','heba.said9684@gmail.com','$2b$12$rIUNL00Bv4pFiembEozlVODi41oDVxzEN5Fo/52nvu1mTZbFmMJQa','01149909893','Nasr City, Cairo',TRUE,0,'2005-09-03','2025-09-25','Female','Ramy Amin - 01561736976'),
(44,'Karim Mostafa','karim.mostafa6502@gmail.com','$2b$12$KnHI.MFxKySOwO0A5g.1s.9tmir2t33581yr190i4pu53TDs/nDXy','01542025037','Alexandria, Roushdy',TRUE,5,'1987-04-22','2025-09-26','Male','Hana Saad - 01042940684'),
(45,'Mahmoud Tarek','mahmoud.tarek2397@gmail.com','$2b$12$mKMkBfZoN9rl45P1j1J3suPTHDDMNuOQBvgQZNQZ7nzWtcosQEhZi','01273972503','Mansoura, Dakahlia',TRUE,2,'1989-10-01','2025-10-04','Male','Hana Saad - 01226614775'),
(46,'Ramy Amin','ramy.amin6094@gmail.com','$2b$12$.wPD/da67L7Q/rbsi4IuyeBi82FlPyU8T1oTUm3MMAfNOj.x5SonC','01164588795','Zagazig, Sharqia',TRUE,2,'1950-12-20','2025-09-27','Female','Tarek Ismail - 01158949382'),
(47,'Nourhan Adel','nourhan.adel6361@gmail.com','$2b$12$2gkkYAdW5iIpZ5vZpHL26upbV7Xk0ZU7zdd0UPi0n6n0hdheUuGKy','01220989849','Maadi, Cairo',FALSE,-1,'2015-08-22','2025-10-21','Female','Tarek Ismail - 01140834935'),
(48,'Hana Saad','hana.saad8575@gmail.com','$2b$12$4iJn/6z3Y.IJAWWY9qSD5el7LWrNQB.HB0dzyNrOir8xPbxJS8VRm','01181806846','Maadi, Cairo',FALSE,-1,'1986-07-06','2025-09-26','Male','Tarek Ismail - 01551572022'),
(49,'Ziad Fouad','ziad.fouad1031@gmail.com','$2b$12$VLTBQIiuMo3Pe5voN394puTa61WgBjGpLuWtc34kMs.RlAty/NR2e','01572723340','Zagazig, Sharqia',TRUE,3,'1997-02-05','2025-10-09','Female','Mai Kamal - 01213123725'),
(50,'Heba Said','heba.said1173@gmail.com','$2b$12$hj56JyT4z3ZcMcqUsmVt/OFvxK/4cuj35FyYj.sZshCrqZmzqHBE6','01522221393','6th of October City, Giza',FALSE,-1,'1974-12-05','2025-09-27','Female','Nourhan Adel - 01584215862');


INSERT INTO doctor_patient (doctor_id, patient_id) VALUES
-- Doctor 1016
(1016, 1),
(1016, 2),
(1016, 3),

-- Doctor 1045
(1045, 4),
(1045, 5),
(1045, 6),

-- Doctor 1065
(1065, 7),
(1065, 8),
(1065, 9),

-- Doctor 1067
(1067, 10),
(1067, 11),
(1067, 12),

-- Doctor 1075
(1075, 13),
(1075, 14),
(1075, 15),

-- Doctor 1077
(1077, 16),
(1077, 17),
(1077, 18),

-- Doctor 1088
(1088, 19),
(1088, 20),
(1088, 21),

-- Doctor 1090
(1090, 22),
(1090, 23),
(1090, 24),

-- Doctor 1091
(1091, 25),
(1091, 26),
(1091, 27),

-- Doctor 1095
(1095, 28),
(1095, 29),
(1095, 30),

-- Doctor 1102
(1102, 31),
(1102, 32),
(1102, 33),

-- Doctor 1105
(1105, 34),
(1105, 35),
(1105, 36),

-- Doctor 1120
(1120, 37),
(1120, 38),
(1120, 39),

-- Doctor 1124
(1124, 40),
(1124, 41),
(1124, 42),

-- Doctor 1134
(1134, 43),
(1134, 44),
(1134, 45),

-- Doctor 1148
(1148, 46),
(1148, 47),
(1148, 48),

-- Doctor 1156
(1156, 49),
(1156, 50),
(1156, 1), -- cycle back to start

-- Doctor 1162
(1162, 2),
(1162, 3),
(1162, 4),

-- Doctor 1192
(1192, 5),
(1192, 6),
(1192, 7);

-- ==========================================
-- Insert Hospital Rooms and Floors
-- ==========================================

-- Insert 5 floors
INSERT INTO floors (floor_number)
VALUES (1), (2), (3), (4), (5);

-- Insert 3 rooms per floor (floor_id corresponds to the inserted floors above)
-- Floors assumed to exist: floor_id 1..5
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


-- Floor 1
UPDATE rooms SET patient_id = 25, isOccupied = TRUE WHERE room_number = 1 AND floor_id = 1;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 1, floor_number = 1 WHERE patient_id = 25;

UPDATE rooms SET patient_id = 19, isOccupied = TRUE WHERE room_number = 2 AND floor_id = 1;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 2, floor_number = 1 WHERE patient_id = 19;

UPDATE rooms SET patient_id = 6, isOccupied = TRUE WHERE room_number = 3 AND floor_id = 1;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 3, floor_number = 1 WHERE patient_id = 6;

-- Floor 2
UPDATE rooms SET patient_id = 12, isOccupied = TRUE WHERE room_number = 1 AND floor_id = 2;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 1, floor_number = 2 WHERE patient_id = 12;

UPDATE rooms SET patient_id = 41, isOccupied = TRUE WHERE room_number = 2 AND floor_id = 2;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 2, floor_number = 2 WHERE patient_id = 41;

UPDATE rooms SET patient_id = 45, isOccupied = TRUE WHERE room_number = 3 AND floor_id = 2;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 3, floor_number = 2 WHERE patient_id = 45;

-- Floor 3
UPDATE rooms SET patient_id = 3, isOccupied = TRUE WHERE room_number = 1 AND floor_id = 3;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 1, floor_number = 3 WHERE patient_id = 3;

UPDATE rooms SET patient_id = 5, isOccupied = TRUE WHERE room_number = 2 AND floor_id = 3;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 2, floor_number = 3 WHERE patient_id = 5;

UPDATE rooms SET patient_id = 10, isOccupied = TRUE WHERE room_number = 3 AND floor_id = 3;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 3, floor_number = 3 WHERE patient_id = 10;

-- Floor 4
UPDATE rooms SET patient_id = 23, isOccupied = TRUE WHERE room_number = 1 AND floor_id = 4;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 1, floor_number = 4 WHERE patient_id = 23;

UPDATE rooms SET patient_id = 36, isOccupied = TRUE WHERE room_number = 2 AND floor_id = 4;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 2, floor_number = 4 WHERE patient_id = 36;

UPDATE rooms SET patient_id = 46, isOccupied = TRUE WHERE room_number = 3 AND floor_id = 4;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 3, floor_number = 4 WHERE patient_id = 46;

-- Floor 5
UPDATE rooms SET patient_id = 4, isOccupied = TRUE WHERE room_number = 1 AND floor_id = 5;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 1, floor_number = 5 WHERE patient_id = 4;

UPDATE rooms SET patient_id = 11, isOccupied = TRUE WHERE room_number = 2 AND floor_id = 5;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 2, floor_number = 5 WHERE patient_id = 11;

UPDATE rooms SET patient_id = 22, isOccupied = TRUE WHERE room_number = 3 AND floor_id = 5;
UPDATE patients SET isAssignedToRoom = TRUE, room_number = 3, floor_number = 5 WHERE patient_id = 22;

-- ========================================
-- Inserting perms to users
-- ========================================

-- all perms for baraamohamed2311@gmail.com
INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id)
SELECT perm_id, 1200
FROM hospital_perms;

-- Doctors: Can access rooms and modify patient data/files, but not modify rooms.
INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id) VALUES
(1,1016),(3,1016),(7,1016),
(1,1045),(3,1045),(7,1045),
(1,1065),(3,1065),(7,1065),
(1,1067),(3,1067),(7,1067),
(1,1075),(3,1075),(7,1075),
(1,1077),(3,1077),(7,1077),
(1,1088),(3,1088),(7,1088),
(1,1090),(3,1090),(7,1090),
(1,1091),(3,1091),(7,1091),
(1,1095),(3,1095),(7,1095),
(1,1102),(3,1102),(7,1102),
(1,1105),(3,1105),(7,1105),
(1,1120),(3,1120),(7,1120),
(1,1124),(3,1124),(7,1124),
(1,1134),(3,1134),(7,1134),
(1,1148),(3,1148),(7,1148),
(1,1156),(3,1156),(7,1156),
(1,1162),(3,1162),(7,1162),
(1,1192),(3,1192),(7,1192);

-- Surgeons: Can access rooms, modify rooms, and modify data, but not perms/roles.
INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id) VALUES
(1,1004),(7,1004),(8,1004),
(1,1029),(7,1029),(8,1029),
(1,1046),(7,1046),(8,1046),
(1,1061),(7,1061),(8,1061),
(1,1080),(7,1080),(8,1080),
(1,1083),(7,1083),(8,1083),
(1,1089),(7,1089),(8,1089),
(1,1099),(7,1099),(8,1099),
(1,1103),(7,1103),(8,1103),
(1,1155),(7,1155),(8,1155),
(1,1158),(7,1158),(8,1158),
(1,1179),(7,1179),(8,1179),
(1,1180),(7,1180),(8,1180),
(1,1190),(7,1190),(8,1190);

-- Nurses: Can access rooms, modify rooms, maybe delete patient records if that makes sense, but not perms/roles.
INSERT INTO hospital_emp_perms (perm_id, hosp_emp_id) VALUES
(6,1003),(7,1003),(8,1003),
(6,1024),(7,1024),(8,1024),
(6,1034),(7,1034),(8,1034),
(6,1039),(7,1039),(8,1039),
(6,1047),(7,1047),(8,1047),
(6,1068),(7,1068),(8,1068),
(6,1069),(7,1069),(8,1069),
(6,1072),(7,1072),(8,1072),
(6,1093),(7,1093),(8,1093),
(6,1100),(7,1100),(8,1100),
(6,1108),(7,1108),(8,1108),
(6,1110),(7,1110),(8,1110),
(6,1116),(7,1116),(8,1116),
(6,1127),(7,1127),(8,1127),
(6,1142),(7,1142),(8,1142),
(6,1153),(7,1153),(8,1153),
(6,1168),(7,1168),(8,1168),
(6,1172),(7,1172),(8,1172),
(6,1175),(7,1175),(8,1175),
(6,1196),(7,1196),(8,1196);
