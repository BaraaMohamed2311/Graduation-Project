
-- ==========================================
-- Unified users Table

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_email varchar(255) NOT NULL,
    user_name varchar(255) NOT NULL,
	user_password varchar(255) NOT NULL,
    user_type ENUM('patient', 'employee') NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    
);


-- ==========================================
-- Employees users Table
DROP TABLE IF EXISTS `employees`;
CREATE TABLE employees (
  emp_id int PRIMARY KEY NOT NULL,
  emp_salary int NOT NULL DEFAULT 0,
  emp_abscence int NOT NULL DEFAULT 0,
  emp_bonus int NOT NULL DEFAULT 0,
  emp_rate int NOT NULL DEFAULT 0,
  emp_title varchar(100) DEFAULT NULL,
  emp_specialty varchar(100) DEFAULT NULL,
  FOREIGN KEY (emp_id) REFERENCES users(user_id) ON DELETE CASCADE
) ;
--------===================================================
--                      unregistered_employees
DROP TABLE IF EXISTS `unregistered_employees`;
CREATE TABLE `unregistered_employees` (
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(255) DEFAULT NULL,
  `emp_title` varchar(100) DEFAULT NULL,
  `emp_specialty` varchar(100) DEFAULT NULL,
  `emp_password` varchar(255) DEFAULT NULL,
  `emp_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`emp_id`),
  UNIQUE KEY `emp_email` (`emp_email`),
  UNIQUE KEY `emp_email_2` (`emp_email`)
) 
--------===================================================
--                      roles Map 1:1

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `emp_id` int NOT NULL,
  `role_name` enum('Employee','SuperAdmin','Admin') NOT NULL,
  PRIMARY KEY (`emp_id`,`role_name`),
  FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`)
) 
--------===================================================
--                      perms titles
DROP TABLE IF EXISTS `perms`;
CREATE TABLE `perms` (
  `perm_id` int NOT NULL,
  `perm_name` varchar(255) NOT NULL,
  PRIMARY KEY (`perm_id`)
) 

--------===================================================
--                      employee_perms Map 1:m
DROP TABLE IF EXISTS `employee_perms`;
CREATE TABLE `employee_perms` (
  `perm_id` int NOT NULL,
  `emp_id` int NOT NULL,
  UNIQUE KEY `perm_id` (`perm_id`,`emp_id`),
  KEY `emp_id` (`emp_id`),
  FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`),
  FOREIGN KEY (`perm_id`) REFERENCES `perms` (`perm_id`)
)





--------===================================================
--                      Insertions
--------===================================================

INSERT INTO employees (emp_id, emp_salary, emp_abscence, emp_bonus, emp_rate, emp_title, emp_specialty) VALUES
(1, 0, 0, 0, 0, 'Scientist', 'Data'),
(2, 0, 0, 0, 0, 'HR', 'HR'),
(3, 0, 0, 0, 0, 'CEO', 'Management'),
(4, 0, 0, 0, 0, 'Nurse', 'Emergency Room Nursing'),
(5, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(6, 0, 0, 0, 0, 'HR', 'HR'),
(7, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(8, 0, 0, 0, 0, 'Doctor', 'Dermatology (Skin)'),
(9, 0, 0, 0, 0, 'Scientist', 'Data'),
(10, 0, 0, 0, 0, 'Engineer', 'Cloud'),
(11, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(12, 0, 0, 0, 0, 'Doctor', 'Neurology (Brain)'),
(13, 0, 0, 0, 0, 'Doctor', 'Neurology (Brain)'),
(14, 0, 0, 0, 0, 'Developer', 'Front-End'),
(15, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(16, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(17, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(18, 0, 0, 0, 0, 'CEO', 'Management'),
(19, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(20, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(21, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(22, 0, 0, 0, 0, 'Doctor', 'Pediatrics (Kids)'),
(23, 0, 0, 0, 0, 'Engineer', 'Full-Stack'),
(24, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(25, 0, 0, 0, 0, 'Nurse', 'Cancer Nursing'),
(26, 0, 0, 0, 0, 'HR', 'HR'),
(27, 0, 0, 0, 0, 'Surgeon', 'Orthopedic Surgery'),
(28, 0, 0, 0, 0, 'Engineer', 'Cloud'),
(29, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(30, 0, 0, 0, 0, 'Developer', 'Back-End'),
(31, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(32, 0, 0, 0, 0, 'Surgeon', 'ENT Surgery'),
(33, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(34, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(35, 0, 0, 0, 0, 'Doctor', 'Neurology (Brain)'),
(36, 0, 0, 0, 0, 'Scientist', 'Data'),
(37, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(38, 0, 0, 0, 0, 'Engineer', 'Back-End'),
(39, 0, 0, 0, 0, 'Doctor', 'Dermatology (Skin)'),
(40, 0, 0, 0, 0, 'Surgeon', 'Plastic Surgery'),
(41, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(42, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(43, 0, 0, 0, 0, 'Intern', 'Front-End'),
(44, 0, 0, 0, 0, 'Intern', 'Back-End'),
(45, 0, 0, 0, 0, 'Intern', 'Front-End'),
(46, 0, 0, 0, 0, 'Developer', 'Front-End'),
(47, 0, 0, 0, 0, 'Surgeon', 'Plastic Surgery'),
(48, 0, 0, 0, 0, 'HR', 'HR'),
(49, 0, 0, 0, 0, 'Doctor', 'Neurology (Brain)'),
(50, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(51, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(52, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(53, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(54, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(55, 0, 0, 0, 0, 'Doctor', 'Front-End'),
(56, 0, 0, 0, 0, 'CEO', 'Management'),
(57, 0, 0, 0, 0, 'Surgeon', 'Heart Surgery'),
(58, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(59, 0, 0, 0, 0, 'HR', 'HR'),
(60, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(61, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(62, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(63, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(64, 0, 0, 0, 0, 'Scientist', 'Data'),
(65, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(66, 0, 0, 0, 0, 'Surgeon', 'Heart Surgery'),
(67, 0, 0, 0, 0, 'Engineer', 'Back-End'),
(68, 0, 0, 0, 0, 'Doctor', 'Pulmonology (Lungs)'),
(69, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(70, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(71, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(72, 0, 0, 0, 0, 'Developer', 'Back-End'),
(73, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(74, 0, 0, 0, 0, 'Surgeon', 'Brain Surgery'),
(75, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(76, 0, 0, 0, 0, 'CEO', 'Management'),
(77, 0, 0, 0, 0, 'CEO', 'Management'),
(78, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(79, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(80, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(81, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(82, 0, 0, 0, 0, 'Doctor', 'Pulmonology (Lungs)'),
(83, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(84, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(85, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(86, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(87, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(88, 0, 0, 0, 0, 'Doctor', 'Cardiology (Heart)'),
(89, 0, 0, 0, 0, 'Surgeon', 'Orthopedic Surgery'),
(90, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(91, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(92, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(93, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(94, 0, 0, 0, 0, 'HR', 'HR'),
(95, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(96, 0, 0, 0, 0, 'Surgeon', 'Brain Surgery'),
(97, 0, 0, 0, 0, 'Intern', 'Front-End'),
(98, 0, 0, 0, 0, 'Doctor', 'Pulmonology (Lungs)'),
(99, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(100, 0, 0, 0, 0, 'CEO', 'Management'),
(101, 0, 0, 0, 0, 'CEO', 'Management'),
(102, 0, 0, 0, 0, 'HR', 'HR'),
(103, 0, 0, 0, 0, 'Engineer', 'Cloud'),
(104, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(105, 0, 0, 0, 0, 'Intern', 'Back-End'),
(106, 0, 0, 0, 0, 'Doctor', 'Dermatology (Skin)'),
(107, 0, 0, 0, 0, 'CEO', 'Management'),
(108, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(109, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(110, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(111, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(112, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(113, 0, 0, 0, 0, 'CEO', 'Management'),
(114, 0, 0, 0, 0, 'Scientist', 'Data'),
(115, 0, 0, 0, 0, 'Doctor', 'Neurology (Brain)'),
(116, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(117, 0, 0, 0, 0, 'Doctor', 'Pediatrics (Kids)'),
(118, 0, 0, 0, 0, 'Surgeon', 'Heart Surgery'),
(119, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(120, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(121, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(122, 0, 0, 0, 0, 'CEO', 'Management'),
(123, 0, 0, 0, 0, 'Scientist', 'Data'),
(124, 0, 0, 0, 0, 'Doctor', 'Pulmonology (Lungs)'),
(125, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(126, 0, 0, 0, 0, 'Doctor', 'Oncology (Cancer)'),
(127, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(128, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(129, 0, 0, 0, 0, 'Developer', 'Front-End'),
(130, 0, 0, 0, 0, 'Engineer', 'Back-End'),
(131, 0, 0, 0, 0, 'Surgeon', 'Heart Surgery'),
(132, 0, 0, 0, 0, 'Intern', 'Front-End'),
(133, 0, 0, 0, 0, 'CEO', 'Management'),
(134, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(135, 0, 0, 0, 0, 'Nurse', 'Intensive Care Nursing'),
(136, 0, 0, 0, 0, 'Nurse', 'Cancer Nursing'),
(137, 0, 0, 0, 0, 'Nurse', 'Emergency Room Nursing'),
(138, 0, 0, 0, 0, 'Doctor', 'Cardiology (Heart)'),
(139, 0, 0, 0, 0, 'CEO', 'Management'),
(140, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(141, 0, 0, 0, 0, 'Nurse', 'Cancer Nursing'),
(142, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(143, 0, 0, 0, 0, 'Developer', 'Front-End'),
(144, 0, 0, 0, 0, 'Doctor', 'Pulmonology (Lungs)'),
(145, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(146, 0, 0, 0, 0, 'Engineer', 'Cloud'),
(147, 0, 0, 0, 0, 'Doctor', 'Cardiology (Heart)'),
(148, 0, 0, 0, 0, 'Surgeon', 'Heart Surgery'),
(149, 0, 0, 0, 0, 'Developer', 'Back-End'),
(150, 0, 0, 0, 0, 'Engineer', 'Full-Stack'),
(151, 0, 0, 0, 0, 'Intern', 'Back-End'),
(152, 0, 0, 0, 0, 'Nurse', 'Emergency Room Nursing'),
(153, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(154, 0, 0, 0, 0, 'Scientist', 'Data'),
(155, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(156, 0, 0, 0, 0, 'Intern', 'Back-End'),
(157, 0, 0, 0, 0, 'Surgeon', 'Brain Surgery'),
(158, 0, 0, 0, 0, 'Scientist', 'Data'),
(159, 0, 0, 0, 0, 'Scientist', 'Data'),
(160, 0, 0, 0, 0, 'Scientist', 'Data'),
(161, 0, 0, 0, 0, 'Intern', 'Full-Stack'),
(162, 0, 0, 0, 0, 'Surgeon', 'Brain Surgery'),
(163, 0, 0, 0, 0, 'Doctor', 'Dermatology (Skin)'),
(164, 0, 0, 0, 0, 'HR', 'HR'),
(165, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(166, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(167, 0, 0, 0, 0, 'CEO', 'Management'),
(168, 0, 0, 0, 0, 'Scientist', 'Data'),
(169, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(170, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(171, 0, 0, 0, 0, 'Nurse', 'Cancer Nursing'),
(172, 0, 0, 0, 0, 'Scientist', 'Data'),
(173, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(174, 0, 0, 0, 0, 'CEO', 'Management'),
(175, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(176, 0, 0, 0, 0, 'Engineer', 'UI/UX'),
(177, 0, 0, 0, 0, 'DevOps Engineer', 'Front-End'),
(178, 0, 0, 0, 0, 'HR', 'HR'),
(179, 0, 0, 0, 0, 'HR', 'HR'),
(180, 0, 0, 0, 0, 'Scientist', 'Data'),
(181, 0, 0, 0, 0, 'HR', 'HR'),
(182, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(183, 0, 0, 0, 0, 'Scientist', 'Data'),
(184, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(185, 0, 0, 0, 0, 'Nurse', 'Children''s Nursing'),
(186, 0, 0, 0, 0, 'Designer', 'UI/UX'),
(187, 0, 0, 0, 0, 'CEO', 'Management'),
(188, 0, 0, 0, 0, 'Developer', 'Full-Stack'),
(189, 0, 0, 0, 0, 'Engineer', 'Front-End'),
(190, 0, 0, 0, 0, 'Scientist', 'Data'),
(191, 0, 0, 0, 0, 'CEO', 'Management'),
(192, 0, 0, 0, 0, 'DevOps Engineer', 'Automation'),
(193, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(194, 0, 0, 0, 0, 'Developer', 'Front-End'),
(195, 0, 0, 0, 0, 'Developer', 'Front-End'),
(196, 0, 0, 0, 0, 'CEO', 'Management'),
(197, 0, 0, 0, 0, 'HR', 'HR'),
(198, 0, 0, 0, 0, 'Engineer', 'Cloud'),
(199, 0, 0, 0, 0, 'Cloud Engineer', 'Cloud'),
(200, 0, 0, 0, 0, 'Nurse', 'Cancer Nursing'),
(201, 0, 0, 0, 0, 'Designer', 'UI/UX');

INSERT INTO `unregistered_employees` (emp_id, emp_name, emp_title, emp_specialty, emp_email, emp_password) VALUES(1,'Ali Hamed','Scientist','Data','ali.hamed2464@gmail.com','$2b$12$XUxExC4fNH59oWlS69ddEOTXSiNhx5DuU7HFYnVhCoOxiY15j0YK2'),(2,'Mostafa Zaki','CEO','Management','mostafa.zaki3353@gmail.com','$2b$12$pLqeAPIdVH9g/WH2p89LfuOc.vtjSErXiYb8TPQKQ0do5XZQNl6ee'),(3,'Zein Yasser','Developer','Front-End','zein.yasser8384@gmail.com','$2b$12$xg6cHBT.woeF6SVUO5n.6Ob6TWwaDR2h80ydMPrWPdrPuzu4j40IW'),(4,'Mai Mahmoud','Nurse','Intensive Care Nursing','mai.mahmoud876@gmail.com','$2b$12$vIRxsbV.D6N6tGiGSdokBeiJw/tUGd3uQgiRg2/mldb6EKEhe5XAa'),(5,'Sara Hany','Surgeon','ENT Surgery','sara.hany7833@gmail.com','$2b$12$XQ.uN2uCitbuEXkyAPJbJ.puHvvfHAupka.wSTexwx/DN5kVGzOqK'),(6,'Youssef Masoud','Cloud Engineer','Cloud','youssef.masoud1354@gmail.com','$2b$12$OiBtxaMKBGIbfMD7DgEpvu2q3p.6wf/y/2KqAgFlGEIjn/YEDFVKi');

-- Make me SuperAdmin
INSERT INTO `roles` VALUES (1200,'baraamohamed2311@gmail.com','SuperAdmin');


-- Permission Titles
INSERT INTO `perms` VALUES (1,'Modify Data'),(2,'Modify Salary'),(3,'Display Salary'),(4,'Accept Registered'),(5,'Modify Perms'),(6,'Modify Role'),(7,'Delete User');

-- for baraamohaed2311@gmail.com
INSERT INTO employee_perms VALUES (1,14),(2,14),(3,14),(4,14),(5,14),(6,14),(7,14);

