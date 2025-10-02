-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: localhost    Database: ems_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employee_perms`
--

USE ems_db

DROP TABLE IF EXISTS `employee_perms`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_perms` (
  `perm_id` int NOT NULL,
  `emp_id` int NOT NULL,
  UNIQUE KEY `perm_id` (`perm_id`,`emp_id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `employee_perms_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`),
  CONSTRAINT `employee_perms_ibfk_2` FOREIGN KEY (`perm_id`) REFERENCES `perms` (`perm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_perms`
--



INSERT INTO `employee_perms` VALUES (1,1200),(2,1200),(3,1200),(4,1200),(5,1200),(6,1200),(7,1200),(1,1199),(3,1199);



--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `emp_id` int NOT NULL,
  `emp_name` varchar(40) DEFAULT NULL,
  `emp_salary` int NOT NULL DEFAULT 0,
  `emp_abscence` int NOT NULL DEFAULT 0,
  `emp_bonus` int NOT NULL DEFAULT 0,
  `emp_rate` int NOT NULL DEFAULT 0,
  `emp_title` varchar(30) DEFAULT NULL,
  `emp_specialty` varchar(30) DEFAULT NULL,
  `emp_email` varchar(50) DEFAULT NULL,
  `emp_password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`emp_id`),
  UNIQUE KEY `emp_email` (`emp_email`),
  UNIQUE KEY `emp_email_2` (`emp_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--



--
-- Table structure for table `perms`
--

DROP TABLE IF EXISTS `perms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perms` (
  `perm_id` int NOT NULL,
  `perm_name` varchar(255) NOT NULL,
  PRIMARY KEY (`perm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perms`
--



INSERT INTO `perms` VALUES (1,'Modify Data'),(2,'Modify Salary'),(3,'Display Salary'),(4,'Accept Registered'),(5,'Modify Perms'),(6,'Modify Role'),(7,'Delete User');



--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `emp_id` int NOT NULL,
  `emp_email` varchar(50) NOT NULL,
  `role_name` enum('Employee','SuperAdmin','Admin') NOT NULL,
  PRIMARY KEY (`emp_id`,`role_name`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--



INSERT INTO `roles` VALUES (1200,'baraamohamed2311@gmail.com','SuperAdmin'),(1199,'hany.aziz7480@gmail.com','Admin');



--
-- Table structure for table `unregistered_employees`
--

DROP TABLE IF EXISTS `unregistered_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unregistered_employees` (
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(40) DEFAULT NULL,
  `emp_title` varchar(30) DEFAULT NULL,
  `emp_specialty` varchar(30) DEFAULT NULL,
  `emp_password` varchar(255) DEFAULT NULL,
  `emp_email` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`emp_id`),
  UNIQUE KEY `emp_email` (`emp_email`),
  UNIQUE KEY `emp_email_2` (`emp_email`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unregistered_employees`
--



INSERT INTO `unregistered_employees` (emp_id, emp_name, emp_title, emp_specialty, emp_email, emp_password) VALUES(1,'Ali Hamed','Scientist','Data','ali.hamed2464@gmail.com','$2b$12$XUxExC4fNH59oWlS69ddEOTXSiNhx5DuU7HFYnVhCoOxiY15j0YK2'),(2,'Mostafa Zaki','CEO','Management','mostafa.zaki3353@gmail.com','$2b$12$pLqeAPIdVH9g/WH2p89LfuOc.vtjSErXiYb8TPQKQ0do5XZQNl6ee'),(3,'Zein Yasser','Developer','Front-End','zein.yasser8384@gmail.com','$2b$12$xg6cHBT.woeF6SVUO5n.6Ob6TWwaDR2h80ydMPrWPdrPuzu4j40IW'),(4,'Mai Mahmoud','Nurse','Intensive Care Nursing','mai.mahmoud876@gmail.com','$2b$12$vIRxsbV.D6N6tGiGSdokBeiJw/tUGd3uQgiRg2/mldb6EKEhe5XAa'),(5,'Sara Hany','Surgeon','ENT Surgery','sara.hany7833@gmail.com','$2b$12$XQ.uN2uCitbuEXkyAPJbJ.puHvvfHAupka.wSTexwx/DN5kVGzOqK'),(6,'Youssef Masoud','Cloud Engineer','Cloud','youssef.masoud1354@gmail.com','$2b$12$OiBtxaMKBGIbfMD7DgEpvu2q3p.6wf/y/2KqAgFlGEIjn/YEDFVKi');


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-09-26 17:49:51




INSERT INTO `employees` (emp_id, emp_name, emp_title, emp_specialty, emp_email, emp_password) VALUES(1000,'Omar Abdallah','Scientist','Data','omar.abdallah2464@gmail.com','$2b$12$XUxExC4fNH59oWlS69ddEOTXSiNhx5DuU7HFYnVhCoOxiY15j0YK2'),(1001,'Ramy Amin','CEO','Management','ramy.amin3353@gmail.com','$2b$12$pLqeAPIdVH9g/WH2p89LfuOc.vtjSErXiYb8TPQKQ0do5XZQNl6ee'),
(1002,'Ramy Amin','Developer','Front-End','ramy.amin8384@gmail.com','$2b$12$xg6cHBT.woeF6SVUO5n.6Ob6TWwaDR2h80ydMPrWPdrPuzu4j40IW'),
(1003,'Mai Kamal','Nurse','Intensive Care Nursing','mai.kamal876@gmail.com','$2b$12$vIRxsbV.D6N6tGiGSdokBeiJw/tUGd3uQgiRg2/mldb6EKEhe5XAa'),
(1004,'Sara Kamel','Surgeon','ENT Surgery','sara.kamel7833@gmail.com','$2b$12$XQ.uN2uCitbuEXkyAPJbJ.puHvvfHAupka.wSTexwx/DN5kVGzOqK'),
(1005,'Youssef Gamal','Cloud Engineer','Cloud','youssef.gamal1354@gmail.com','$2b$12$OiBtxaMKBGIbfMD7DgEpvu2q3p.6wf/y/2KqAgFlGEIjn/YEDFVKi'),
(1006,'Jessica White','Engineer','Back-End','jessica.white312@gmail.com','$2b$12$4rZHUb4rcLZ4.dgsX7WZruN4i/J0oVwamg7VG45zcnlOvn9vpGXdK'),
(1007,'Jessica White','CEO','Management','jessica.white5130@gmail.com','$2b$12$7ps05h9X1ql67qu012K2/O7b8lymZwvso2gCvyeKqZINCnqXI6F/O'),
(1008,'Youssef Gamal','CEO','Management','youssef.gamal7584@gmail.com','$2b$12$uzVRqESBMD9eYIKhGQKV.OiF1/8ZhS1GdHjNvb8qyx/UUwRja4bZy'),
(1009,'Tarek Ismail','Developer','Front-End','tarek.ismail4486@gmail.com','$2b$12$UifOgRO.CxcSJRelOK.mYObM3fOqgm02PO613VSVgn9vZhvK10/LW'),
(1010,'Khaled Naguib','DevOps Engineer','Automation','khaled.naguib7782@gmail.com','$2b$12$/MtO8.2ZtMJepwnfaWEbLOPbRwtPgDFrfOffrsBbhIYV3YaePsbdS'),
(1011,'Nada Fahmy','CEO','Management','nada.fahmy6580@gmail.com','$2b$12$kzCtlaMfkCZOiP8Do.rIduczo1oIZVRcbIALYdijimrQymH6NIFdq'),
(1012,'Tarek Ismail','Designer','UI/UX','tarek.ismail2571@gmail.com','$2b$12$XkJbyGfq8Mcclfr.cpVHYucZqoXAuAjh9pV0AuyQtt/RvucKx5UEa'),
(1013,'Mariam Kamal','Developer','Full-Stack','mariam.kamal3182@gmail.com','$2b$12$EsZkvOQ2U1fi4SfgaXu.T.5KErRITq.pJQDcPQq0Pmumy56LM.8ya'),
(1014,'Nada Fahmy','Developer','Front-End','nada.fahmy9785@gmail.com','$2b$12$yLKOyAvQLXMc5GFRhVPR/.iOMW46J1WyfyI1dSdUV01RQgNBagw0u'),
(1015,'Tarek Ismail','Scientist','Data','tarek.ismail7558@gmail.com','$2b$12$gcxPdbWjBIhsV//ruzMomuSOta50UclEFS8V4Ex9GFUM2VXBc80xa'),
(1016,'Tarek Ismail','Doctor','Neurology (Brain)','tarek.ismail8613@gmail.com','$2b$12$ybcovZHDUwGZtrv7lqJXuuLk9.Su0np4TrIJvzeqgUWZ9JepePPVi'),
(1017,'Mona Ali','Designer','UI/UX','mona.ali2995@gmail.com','$2b$12$0opkMII0lpS.8M.k7VaGw.KkEGo2H6Jj.jnEjbmsqzgMVESHt073C'),
(1018,'Khaled Naguib','CEO','Management','khaled.naguib2458@gmail.com','$2b$12$2PhjN10hoZ4f9Y/7UaM7YuoJSlw.shMosbxTwqIwC5BMTUzqlMAFS'),
(1019,'Youssef Gamal','CEO','Management','youssef.gamal9400@gmail.com','$2b$12$hL0ofx8XONwKsmE.l5EQT.nhSNpjqcSGfm0q2c7esYSWTCxBIRVYG'),
(1020,'Jane Doe','HR','HR','jane.doe6331@gmail.com','$2b$12$bfyheO2oYzvi/qK5t2ozZOAOm2.HBHHP77iEg6tZ2arLfHEVbm24a'),
(1021,'Ramy Amin','Cloud Engineer','Cloud','ramy.amin9290@gmail.com','$2b$12$CVS7/CpBpBPC3ZzyCAgiqOm1PBcEcmNT8U538I2MELPxCM.AIKbr6'),
(1022,'Ramy Amin','Scientist','Data','ramy.amin6070@gmail.com','$2b$12$MafDu6aVcld7BGPQc9ysy.gPXgUr/SNe94Lxxrrzm6MRIw239GIZ6'),
(1023,'Youssef Gamal','Engineer','Front-End','youssef.gamal8306@gmail.com','$2b$12$Po8r2BlloVbA0kqK8LBBcOehkK3apuqekp9x3HJi6hJTGavDASVgi'),
(1024,'Nada Fahmy','Nurse','Emergency Room Nursing','nada.fahmy598@gmail.com','$2b$12$TQpdIhxAxfSNK9ajpAkWSethLsxD23tAWkNIOCriAyicJOdHzMpwO'),
(1025,'Jessica White','Cloud Engineer','Cloud','jessica.white5866@gmail.com','$2b$12$XZ7YChmJITtcCLnjBQB3HeWiXsBYc5HBugBIeSnS3UGg4dUELLFCS'),
(1026,'Lara Khalil','HR','HR','lara.khalil8735@gmail.com','$2b$12$cQwxaoDy2j5Cj26t20jnNe08As4VvksX0MGOAA//SRq7DaO5YpTKC'),
(1027,'Hany Aziz','Intern','Front-End','hany.aziz9376@gmail.com','$2b$12$YHCw8HKFypCo2R0DphrlaeWYCQ7Mxo7oy0JiTNxP0hP/L6fp3h/N6'),
(1028,'Ramy Amin','Scientist','Data','ramy.amin5758@gmail.com','$2b$12$WOhKeRgFbsgCB.qCKiFwiuCtdSr4r8WQuGNsla.oDmntchpRM2dpy'),
(1029,'Laura Santiago','Surgeon','Brain Surgery','laura.santiago1253@gmail.com','$2b$12$zVM7NpviMdvJaYgdQjJlIuSdJ3dfgkpdCKPwYLhW7tzgvPh4RKI3m'),
(1030,'Youssef Gamal','DevOps Engineer','Automation','youssef.gamal1349@gmail.com','$2b$12$ezKB6bwjlHm4N0UE6APvmej2iR1XPRWCYSReljgQFs7BfaHC1NwNS'),
(1031,'Youssef Gamal','Cloud Engineer','Cloud','youssef.gamal5146@gmail.com','$2b$12$w7AJbHl44anDVUpRSxP7f.zTkG8HIzhII7nr2OIAGeH8HUjjMSKSi'),
(1032,'Hana Saad','Developer','Back-End','hana.saad8023@gmail.com','$2b$12$KVGG8Kbvxry2z5VM6dflpOSkmasr6aUhxmJG2KBq.XctybOXsAztu'),
(1033,'Michael Brown','DevOps Engineer','Automation','michael.brown2901@gmail.com','$2b$12$s8ZNnAeJwNMfI4uFpuhJ1uH5yOEtiziG.bEM1KxbdIY5/HDuTgWf6'),
(1034,'David Wilson','Nurse','Children''s Nursing','david.wilson3424@gmail.com','$2b$12$MjIRlFJDHrcuLhd80AMPM.guwH1usdRUbn9bHuSKVY/pr0AIHDN8y'),
(1035,'Khaled Naguib','Designer','UI/UX','khaled.naguib8739@gmail.com','$2b$12$c9.oyDD1a8rFp9i0Rnc.gOXnAUdGtk2b.LXCKDLsTmE2nsem5pmru'),
(1036,'Omar Abdallah','Engineer','Front-End','omar.abdallah2285@gmail.com','$2b$12$ded494IpSar5S4.FhtMvTu9xCYD.ozBiLK5f6fqBv4X0QRGHgX4Na'),
(1037,'Omar Abdallah','Engineer','Cloud','omar.abdallah430@gmail.com','$2b$12$JXt41.S2d9//D9usIwYJE.DKIzo.IVBkH7Gb7r8jy7XfyBUeLxUMa'),
(1038,'John Smith','DevOps Engineer','Automation','john.smith8487@gmail.com','$2b$12$pnV89PRTJDELFO0f21X3VeCsbGdrf0FuBHwZzmaFhYNuQC2nhAtd2'),
(1039,'Lara Khalil','Nurse','Intensive Care Nursing','lara.khalil9475@gmail.com','$2b$12$BwoHcvxxQy/aUFvEL37q9.jPIvVloVU93DpZHRmU4vcSpmFug/jjG'),
(1040,'Sara Kamel','CEO','Management','sara.kamel1221@gmail.com','$2b$12$DBaC9byL9DakFCDGhDowDewwVu0ROcAkR6RVc/MgCpvwfW9ywsb4.'),
(1041,'Hany Aziz','Scientist','Data','hany.aziz3767@gmail.com','$2b$12$lSUJLH8gcfwHBKnXNExDi.4rTlOsU9KrLyvDpDIktsSxyetCDzEHy'),
(1042,'Hany Aziz','Intern','Back-End','hany.aziz984@gmail.com','$2b$12$wcI7XAWofBqT2l7Pa5cc5.qOr3dhNzj//q6C7UGgffJs99WafwKp6'),
(1043,'Mona Ali','Developer','Front-End','mona.ali430@gmail.com','$2b$12$aKIEKm4oEmd3jKmr6Af8ueaj1FrgySaZCz2upmpcaJtlwtaeMtVGC'),
(1044,'Sara Kamel','Designer','UI/UX','sara.kamel216@gmail.com','$2b$12$eWXPhFJJqF3lytM009mpyOdKifjvZintKylNo5aYlc4UEcJ7mTzIW'),
(1045,'Amr Halim','Doctor','Neurology (Brain)','amr.halim8092@gmail.com','$2b$12$vy8YDjvI2RNFmYaDM9l6NOzDaZMDM2Jmn82bNzhskmp9wXirZvTjW'),
(1046,'Ramy Amin','Surgeon','Brain Surgery','ramy.amin570@gmail.com','$2b$12$PM3AibYQp0S11BV9CQSDE.fOEURhaERxJDaW0cVyTlPmfFarxkNee'),
(1047,'John Smith','Nurse','Intensive Care Nursing','john.smith4040@gmail.com','$2b$12$YuzAfhpLJgBlhjddfWfOs.idM/aZJyHCa5kp2VBVoVoOH/sikiJyK'),
(1048,'Lara Khalil','DevOps Engineer','Automation','lara.khalil7794@gmail.com','$2b$12$xc10pQeFYekahc3zbjqx/uKlBDFthm8q1EZmIlkruyxxQz.5Ect8W'),
(1049,'Fatma Hassan','Intern','Full-Stack','fatma.hassan4093@gmail.com','$2b$12$49Vq3.fJkwM4hcZASIpKfuh8EjPvi4Tj6py..SJHkIHvaumDNINSy'),
(1050,'John Smith','DevOps Engineer','Automation','john.smith2176@gmail.com','$2b$12$RZzPK.nmle.1Zay3YEKj4e90KbFr5QWTiMDXyxXjkAzAs8ZwA.kFG'),
(1051,'Youssef Gamal','DevOps Engineer','Automation','youssef.gamal9968@gmail.com','$2b$12$c010QX0W1CNDZeOrExNnhuBZRppc/pym3GzQrMO1I8bbuDR/atKv2'),
(1052,'Ziad Fouad','Cloud Engineer','Cloud','ziad.fouad6654@gmail.com','$2b$12$1v1hFtDggcnw9irN2FycT.H.iH5tJmOTSjRC220u3q/y7N356FfJu'),
(1053,'Mai Kamal','Engineer','Cloud','mai.kamal1374@gmail.com','$2b$12$4NAG9v51IGduRvktndLrce9KdXTG9UeqMDJb4OV9nogP1PKUeifxi'),
(1054,'Nada Fahmy','DevOps Engineer','Automation','nada.fahmy7371@gmail.com','$2b$12$.8Xil8bAOi0NbELIbR7UDuIo7ORvBOujr4VDS4xZ5spSyHFvwfKPS'),
(1055,'Jane Doe','Intern','Front-End','jane.doe391@gmail.com','$2b$12$xnjidpijhABr1mlSFA52l.FSG/Bo7YmjBHqVgZAFhf6yDT7c/o0UG'),
(1056,'Jessica White','Engineer','Front-End','jessica.white9993@gmail.com','$2b$12$EX4lHwwCfZdJmb2wr9zD6eIRONrEKiQDvcc7BTW1kp.AiiqWEOCA2'),
(1057,'Ramy Amin','Scientist','Data','ramy.amin3699@gmail.com','$2b$12$4YZ2tFSvatVfKZHMkOqVzOmYUS/O7mHX/bw8ZXaCFhlsmUdhjMJ/i'),
(1058,'Mona Ali','Intern','Front-End','mona.ali7128@gmail.com','$2b$12$zK15GRklS/ZNyWx.F.Ogqu97wO3tdtpKoEj9/ikLhv/ydlulPIFAS'),
(1059,'Michael Brown','Scientist','Data','michael.brown2283@gmail.com','$2b$12$ZxMbece8h7aEJt7x5CK49ewpHf.0ACUdiEV.2.eUOc91JTYXWRR2e'),
(1060,'Laura Santiago','DevOps Engineer','Automation','laura.santiago5203@gmail.com','$2b$12$QlqfQXZmXrePOq69lqKWwOkwC5.JF/oUu4SkAJLWRP9blGLtGdGt2'),
(1061,'Hana Saad','Surgeon','Orthopedic Surgery','hana.saad4853@gmail.com','$2b$12$IrfF822qtzyRm8i81700NuOk6ccKjrKzDZuwx8Bd38AoRNCT3Vtba'),
(1062,'Mariam Kamal','Scientist','Data','mariam.kamal7423@gmail.com','$2b$12$NsGoPy9A8qmFMirCI9qINOQwPy9eEMR/Cg4nMv5UOIEwp7VqRCBo6'),
(1063,'John Smith','Cloud Engineer','Cloud','john.smith6991@gmail.com','$2b$12$M82ReIZMJRdXlTmTeHK8uecvbtJDhTYS.pmE9cuZhJWbEu3GJd1uy'),
(1064,'Laura Santiago','CEO','Management','laura.santiago7910@gmail.com','$2b$12$76bCdFQss111pZJBVpeqiefSbowCTePSMlWu7nFYaeciv23bz9TnO'),
(1065,'Omar Abdallah','Doctor','Cardiology (Heart)','omar.abdallah5254@gmail.com','$2b$12$wJVwf96VSu8OECwlLn2apeekgoBtQB3D8BsQcAmsXCvWC3oGirjIm'),
(1066,'John Smith','Designer','UI/UX','john.smith5331@gmail.com','$2b$12$57PHkAtAeVy9gmkxQBfghOxBUPokSgSIdDnqHjgnmINJdkAnHaERm'),
(1067,'Michael Brown','Doctor','Pulmonology (Lungs)','michael.brown2398@gmail.com','$2b$12$eaiwrodX3apIEEHWPMM5XOBOdVtX3PgNvKboX0GFd58KC4MFDvqXm'),
(1068,'Ramy Amin','Nurse','Emergency Room Nursing','ramy.amin2899@gmail.com','$2b$12$2lAhT5pYoo.r5a08gIxHXer0sAtvVcOQEeMuq3B.iAKtp2T1YIXma'),
(1069,'Hana Saad','Nurse','Cancer Nursing','hana.saad443@gmail.com','$2b$12$eF/86X6e2cLEOnzHFqLmG.ptEhnBr0Oct2.JXmsK0WLKDY585dmaS'),
(1070,'Michael Brown','Designer','UI/UX','michael.brown8052@gmail.com','$2b$12$1f3IHn7ByTMfXry65hzSje92jJ5TMHcBNJYJcToKuI.3Oln5OhxgW'),
(1071,'Jane Doe','Cloud Engineer','Cloud','jane.doe9683@gmail.com','$2b$12$KQrgYXTUDGqL7o32JNTHWOkxg0kJ9RgYFman8fj.ztr3upvLBSg7y'),
(1072,'Nada Fahmy','Nurse','Cancer Nursing','nada.fahmy3427@gmail.com','$2b$12$ihfEY5E1/Zz1areJcA2Hme3wctiWZJAvkOWBzp4OV0i8pBy4pQzLu'),
(1073,'Hany Aziz','Designer','UI/UX','hany.aziz2173@gmail.com','$2b$12$lVQA/N3Iqt9pAec/r.0T/.yqZ7v3ymAV7tubxHhFx6DFwUbr3BQYC'),
(1074,'Mai Kamal','HR','HR','mai.kamal1299@gmail.com','$2b$12$JX4xdDEjwrtiRnhbsB.q9.x/DiQ49Es8VikPJgLZZwgveY3oQo3Wu'),
(1075,'Amr Halim','Doctor','Neurology (Brain)','amr.halim9063@gmail.com','$2b$12$X39J8HyZASAFhTsV8L7OEuRx9XXlukP.9PQQj1I7hUI3FqZtIVgXa'),
(1076,'Lara Khalil','DevOps Engineer','Automation','lara.khalil2453@gmail.com','$2b$12$pBzA2RswtPfo6ORVVecV.u5uajZSAHsOlOt8/nC/r8XlF0KC9oVjW'),
(1077,'Hany Aziz','Doctor','Dermatology (Skin)','hany.aziz6618@gmail.com','$2b$12$6vZDvLD8jYuuFZm5qdprpOGvPHNaNltRWYtvtTGOyeAmpYKg3Q9k.'),
(1078,'Sara Kamel','Developer','Full-Stack','sara.kamel3968@gmail.com','$2b$12$N8ImRl1/FyIoBF62z08fS.6LO/Yljdld80Xgxat/RSp5swheYi4O.'),
(1079,'Ziad Fouad','Engineer','Cloud','ziad.fouad3974@gmail.com','$2b$12$P40gjJ0ANvKMwe4ZO47.OuMtiuXMoVxsA4DEXNhAZeC9Kpv0KFUuy'),
(1080,'John Smith','Surgeon','Heart Surgery','john.smith2873@gmail.com','$2b$12$pQ1q/OHwrChdf/YLq7wx6.UF07povU2AJVzKYESQMo5tvJ.strRR2'),
(1081,'Hany Aziz','Doctor','Neurology (Brain)','hany.aziz3663@gmail.com','$2b$12$T2FsGYD1CLfUTTIN72mpQuNHMcf/amy09dnA76YdIzmEjgtBwhqNq'),
(1082,'Fatma Hassan','Designer','UI/UX','fatma.hassan5457@gmail.com','$2b$12$JLwNTQP5vsEYIq7yVQ9naeM94plMHFKZSDJO2Yt4DoYax0eatyEze'),
(1083,'John Smith','Surgeon','Brain Surgery','john.smith7304@gmail.com','$2b$12$IzGNvdrJGIhuvXsmGr2peewDdQ7U1XYX2e5oZaQ6z3L00ARwmjP7S'),
(1084,'Youssef Gamal','Cloud Engineer','Cloud','youssef.gamal9974@gmail.com','$2b$12$K14wyxd.y5KikAfJR6p/d.BMGyKg1seW3XVdJFwplbeOF2KQ5r1DO'),
(1085,'Ramy Amin','HR','HR','ramy.amin7472@gmail.com','$2b$12$cRrXY8YdkhSXEwOVp7iOaOjECHdbrShcjnrdltS5SBx/MOGm3.biS'),
(1086,'John Smith','Developer','Back-End','john.smith6411@gmail.com','$2b$12$pwyoSvEcvgpB50f5irOO9uEJugoQdrpjlF46IZboibzg9DTlxzYPW'),
(1087,'Fatma Hassan','CEO','Management','fatma.hassan1546@gmail.com','$2b$12$Z2OxHIv2NHEG6IgCThJcN./NiVVGwk9GA81ZKuZTcWeXt1SeY2sGK'),
(1088,'John Smith','Doctor','Pulmonology (Lungs)','john.smith4018@gmail.com','$2b$12$4BN6mrmYkxEd8BzzmCyD5e600LtnciKzi/uqaeUnx6A54xsaxGZz6'),
(1089,'Jane Doe','Surgeon','Plastic Surgery','jane.doe5797@gmail.com','$2b$12$br8vTNsOGtVk2Mnd2kf2w.yEbJjDG9H6aDroMCXtoQoA.m5gR.LWq'),
(1090,'Amr Halim','Doctor','Dermatology (Skin)','amr.halim5624@gmail.com','$2b$12$NdjN146Nr.1twRD3pt.0gOSl4x4FpDPkxk/w/7gxqAGJlasNI3OTm'),
(1091,'Lara Khalil','Doctor','Cardiology (Heart)','lara.khalil3754@gmail.com','$2b$12$bO0pBk8YN3hKpxv/xUTo1OfFQUeYcwLY8JnyBqdwGawRLMpdeUunC'),
(1092,'Ramy Amin','Cloud Engineer','Cloud','ramy.amin9421@gmail.com','$2b$12$yviV8koPHTLAYnJ4RjnKC.V3A.zG/60XfeizIbAdx/mB2i0MMyCnO'),
(1093,'Hana Saad','Nurse','Intensive Care Nursing','hana.saad8781@gmail.com','$2b$12$.xHtWuWugD95ro6B1Vnm1Ojj2JqOlzD1hG/AVjdN1XdbVaECZCAna'),
(1094,'Sara Kamel','Scientist','Data','sara.kamel6346@gmail.com','$2b$12$0guOK9O9m9./xMDvzcBviOeDHchUTzUYYNP3UmWo1NPsiEVLLu.XC'),
(1095,'Ramy Amin','Doctor','Dermatology (Skin)','ramy.amin692@gmail.com','$2b$12$pItm2Cv9.MpPAknXGVGnw.VgMAdi4AYcMmqu.yQW0xzpTAe1n8EHW'),
(1096,'Ziad Fouad','Developer','Front-End','ziad.fouad1451@gmail.com','$2b$12$Js.e6GL8gM8C7Un7PHcuyeliFCqBuWgCOKy79Ck0H6QNggxhp0A.a'),
(1097,'Ramy Amin','DevOps Engineer','Automation','ramy.amin354@gmail.com','$2b$12$I5VCdNUzc8Y545QqXbygJOovDFWyJx0U80toEAmcJNvLkuVryDrqG'),
(1098,'Ramy Amin','Intern','Full-Stack','ramy.amin6453@gmail.com','$2b$12$PIuo3ou/Jr4BMcSDN6cGtOozZVCUAJXQADD1z7V3dwoOtk0CH0Suq'),
(1099,'Mona Ali','Surgeon','Heart Surgery','mona.ali5148@gmail.com','$2b$12$T1ho7q9OLtjAguadPN5/AO1ZS7JYY9Kyb42nN.G.n7r6TIBKFqJN2'),
(1100,'Nada Fahmy','Nurse','Intensive Care Nursing','nada.fahmy2622@gmail.com','$2b$12$u8/0xhsKNprB08VQf80Bf.SY.HnE8.Y0xxEZm9N1Ejmo9opBIYTJK'),
(1101,'Ramy Amin','Intern','Back-End','ramy.amin2061@gmail.com','$2b$12$.PgQQkfXHufp.vR.n0S.Het.xhHBgOo7zm6Nvaq/vfTunErQku5y2'),
(1102,'Mariam Kamal','Doctor','Neurology (Brain)','mariam.kamal8159@gmail.com','$2b$12$RUqjEc8NAAjZv8b7YmpKR.20vgQTavMfpFb/c6JYwP0qDgAWVA.ki'),
(1103,'Omar Abdallah','Surgeon','Heart Surgery','omar.abdallah5453@gmail.com','$2b$12$NGgOH0TiXIX8rFZRP0IukOonf5ST.UrRyRqmQDLqZERuhEZiJWdGG'),
(1104,'Ramy Amin','Intern','Back-End','ramy.amin4786@gmail.com','$2b$12$fUhyVKtlByh83XT8jIucRuqhbJRWyfFoi2H/u/OgPPA7kwGQneJjG'),
(1105,'Nada Fahmy','Doctor','Cardiology (Heart)','nada.fahmy6429@gmail.com','$2b$12$WLAacSrF7cpfwLiD1lMjS.i.oRZq4eSCTYTcOOEhre1qtS9ZyMZM.'),
(1106,'Hana Saad','HR','HR','hana.saad4442@gmail.com','$2b$12$3WYLeSP6Smyb/.o38gVdJuDCrEIzQndBd7fk7RNMrIa0omqTN8qyu'),
(1107,'Youssef Gamal','Scientist','Data','youssef.gamal8341@gmail.com','$2b$12$6bIFF.UIfKC/EGxiAvUDCeScggS834WpOZkg6kWafYmtetQAdPHKS'),
(1108,'Youssef Gamal','Nurse','Children''s Nursing','youssef.gamal634@gmail.com','$2b$12$vUhvJxIq8hOjUFyz3ElwAum2kqnyC5Gp9fN0JuwrBIrUVwx7boJPK'),
(1109,'Hany Aziz','Cloud Engineer','Cloud','hany.aziz392@gmail.com','$2b$12$718dwu37rGY1uCooun9AjuTtkebn6caVH0KKogJCSncQGtXmLsmaq'),
(1110,'Amr Halim','Nurse','Emergency Room Nursing','amr.halim3433@gmail.com','$2b$12$5MNPadUmiBjcqlA5TNnqyu93w7aTlkT5Vt3E5oLX/cLEnwqcJpDIu'),
(1111,'Jane Doe','Developer','Full-Stack','jane.doe9444@gmail.com','$2b$12$FaCjVjn7VHO5cXDb6senfeJZLLmQLR9EqnnB.ThHaYsfV29A3CHOm'),
(1112,'Amr Halim','Engineer','Cloud','amr.halim7464@gmail.com','$2b$12$RTtj1nNd4dNMtxBEqIH2KeIuMiwGRqOcULtop.nB8OLHu5VpjDxHq'),
(1113,'Michael Brown','Designer','UI/UX','michael.brown1156@gmail.com','$2b$12$nrz.5i.UHRKTAplw6Narb.ZKdEFXMLvbg/PiZC/WeyE4mvz/57JSy'),
(1114,'Nada Fahmy','Designer','UI/UX','nada.fahmy8731@gmail.com','$2b$12$.AP92YuoYwcR65Go0anpP.2T48bPVlTAj5h6//MX7mPHudnHXOynm'),
(1115,'Amr Halim','CEO','Management','amr.halim2594@gmail.com','$2b$12$6sw9sbojnAHOJ0qsCHaIT.a3.QQIXHs1Y.gp6I2N3fcSArv89jW1K'),
(1116,'Hana Saad','Nurse','Children''s Nursing','hana.saad7756@gmail.com','$2b$12$/Ihwi6j6xGf3JvWMyPssYe6Ea80LwJpev4l3eIWE875gpl3Z3w5WK'),
(1117,'Mariam Kamal','CEO','Management','mariam.kamal7231@gmail.com','$2b$12$sgcWrSbScriM58ACVkAHDeoc5O0QaoAZZ0HFF2eiYsfVyz9bee83q'),
(1118,'Michael Brown','DevOps Engineer','Automation','michael.brown9544@gmail.com','$2b$12$wTANCpz2cSUTI/W65vIygehSYI7vNllCXF1VRcud/6v5p7dZTzqPK'),
(1119,'Laura Santiago','CEO','Management','laura.santiago6989@gmail.com','$2b$12$a/.JMIUPPRBBQtEfiQYXTu/FCCOmaJDGpYzytTH/eNj.2L8rMOE3u'),
(1120,'Michael Brown','Doctor','Oncology (Cancer)','michael.brown6672@gmail.com','$2b$12$SsoqB7rCVxMBwVy1eyDisuSqOYr01Ym8xKDtTA394HkxWYe.mPi66'),
(1121,'John Smith','Designer','UI/UX','john.smith4905@gmail.com','$2b$12$yDWxkElbAlk77fx/bRhGJ.ynM2Zni.pZiGIJuZTZio4GZs1LEiRM2'),
(1122,'Omar Abdallah','Developer','Back-End','omar.abdallah7216@gmail.com','$2b$12$sCVo5RyVrDvd1FZFuTXrc.Mtf7RvN/epiWTmm4TbcCbm786JHoiXK'),
(1123,'Jessica White','Cloud Engineer','Cloud','jessica.white9023@gmail.com','$2b$12$zmMdpSH.OJ4QJTUX4zai4uUpYlmzpVcJBAB1dZMGoDzS9LdQN7Dky'),
(1124,'Khaled Naguib','Doctor','Pulmonology (Lungs)','khaled.naguib954@gmail.com','$2b$12$VE3oob2R6cCzjrkENpIn.OJ3xn6Pms0r5QWFr.Y1FwG/4P/MDHkOC'),
(1125,'Lara Khalil','DevOps Engineer','Automation','lara.khalil7603@gmail.com','$2b$12$BXNolbEllYG5rfvqOWE92uzNq0LTmotl51eerLzi0Npc/XYcZfb6y'),
(1126,'Ramy Amin','Scientist','Data','ramy.amin6347@gmail.com','$2b$12$axb7NntlNvGMBs/NEgmKHeUOXrIgTNby2ePS2y4149vYYli7fVqZS'),
(1127,'Ziad Fouad','Nurse','Cancer Nursing','ziad.fouad803@gmail.com','$2b$12$/UmvS90Vgp6sJiMVncgQceqLLC4iddbYDLktFUjMOXkV7epLEFBAi'),
(1128,'Mariam Kamal','Designer','UI/UX','mariam.kamal6682@gmail.com','$2b$12$7iYbtJGIoDNBt5Ao50V2NObyMWLmC73Nep8iQKmCD6LXPUcjxKqNi'),
(1129,'Lara Khalil','Designer','UI/UX','lara.khalil6513@gmail.com','$2b$12$1AoxAZjTKhfgmdxq3Q7SS.TFWSzmXmCZSzl/DfJ4RdaTgB9HVLDqu'),
(1130,'Mariam Kamal','Designer','UI/UX','mariam.kamal2592@gmail.com','$2b$12$/48GzSAAtXa81atfyKg2xefqiJWHxB7JJeDeI6xnBNmeD3vCNgSIC'),
(1131,'Fatma Hassan','Developer','Full-Stack','fatma.hassan4757@gmail.com','$2b$12$9O70GslR.03SfppbwaN4GuH5bcszkT0luFqoEb4y0aRshKlukbAx2'),
(1132,'Hana Saad','Engineer','Full-Stack','hana.saad1827@gmail.com','$2b$12$/KoNyITSWMh5A2/fKSmLGOu18orcx0d3kp4XV5sf81mw8s7biTKLG'),
(1133,'Hany Aziz','Intern','Full-Stack','hany.aziz8689@gmail.com','$2b$12$i2xuae3N8WVMthd3A721hu4P2ju.m0cH7PfGU3lmErUmrZCeYYt2S'),
(1134,'Omar Abdallah','Doctor','Pulmonology (Lungs)','omar.abdallah2024@gmail.com','$2b$12$xpV9OHIJKyzCRKKp/snu..1VCPGsZvW7PSj8zgUK1odt931hAEnXa'),
(1135,'Ziad Fouad','CEO','Management','ziad.fouad2172@gmail.com','$2b$12$rU3yhsL40m.Glv5RsPQKK.gir28srplfGXeG.1.zC4GjC7FpathXG'),
(1136,'Michael Brown','DevOps Engineer','Automation','michael.brown149@gmail.com','$2b$12$huzJgkhHQXz8jyK57ERrFeOq1CE4ChWIG4DQW96.rZp3uCGV6Fx1K'),
(1137,'Amr Halim','DevOps Engineer','Automation','amr.halim7717@gmail.com','$2b$12$M7yJA4hMtUyL77UQDuwyDOsjzuMgZDut2rmFZCeKBeLIVIkAECHOC'),
(1138,'Ramy Amin','Developer','Full-Stack','ramy.amin3815@gmail.com','$2b$12$o/P71lzcTZlJsSYl1aduzONkApEAWxnNwgCR0AGKywI7H9124inJa'),
(1139,'Youssef Gamal','Developer','Full-Stack','youssef.gamal799@gmail.com','$2b$12$g/y/Jdfbrsj5G16uzMX7r.WV8YRmVZmoSB9TrxztQpbVT1hX38Uru'),
(1140,'Mariam Kamal','CEO','Management','mariam.kamal1557@gmail.com','$2b$12$YDFXe/6Icxm7EFBLt8d4Qe7C68Rlr.0NBOzVH741ptUt1p89tfMxC'),
(1141,'Hana Saad','Engineer','Cloud','hana.saad624@gmail.com','$2b$12$8jDucPnrMTe0w6qW7nVtZuU./sG.thTwGVyRch76OYIXN./tO4WGO'),
(1142,'Hany Aziz','Nurse','Children''s Nursing','hany.aziz2837@gmail.com','$2b$12$u93p2GWSvdfMl5.kJUI/tuR2QhisrABqiIsuau5rQ6InHxjdAiXNK'),
(1143,'Jessica White','DevOps Engineer','Automation','jessica.white1266@gmail.com','$2b$12$3/zi9CZkxuQU5.KvBlAQ8eUq3we4O7fOOag0rxC.N0IrKKkQODgny'),
(1144,'Jane Doe','Developer','Front-End','jane.doe5697@gmail.com','$2b$12$3DQCCuiv5SaLVsXUJE9OKuTA2h4IBw1NDQi1PJNT9f6VWZRwgvsWy'),
(1145,'Ziad Fouad','Designer','UI/UX','ziad.fouad806@gmail.com','$2b$12$zXvfDXTJMPnbFFg10TltD.QZpDGNyPtAg959Agipl3z7hiCJ6Wnw.'),
(1146,'Mai Kamal','DevOps Engineer','Automation','mai.kamal3070@gmail.com','$2b$12$2ke4E2T3YLRpGjDRSg6wXupZKYqdrYKW3bbnPxEu.PasAujXgYDhW'),
(1147,'Lara Khalil','Intern','Full-Stack','lara.khalil5993@gmail.com','$2b$12$rpZxhrB8EOuFdVVd/X9noO9NTEdWunSuwGLz2h7nZWGa6Ckp/5cOa'),
(1148,'Laura Santiago','Doctor','Pulmonology (Lungs)','laura.santiago2755@gmail.com','$2b$12$WORyISanGuo46Msph9HvMexqbQzDBB9hvOAQ0o11Azkxb4PD8Yl1a'),
(1149,'David Wilson','Cloud Engineer','Cloud','david.wilson9623@gmail.com','$2b$12$LpmDTJkzafAibKtF5lxpUeWNyCT3.laemtftcQ4YU7jNDWhRK5ffi'),
(1150,'Sara Kamel','Scientist','Data','sara.kamel2001@gmail.com','$2b$12$FOTbrfh8p8QzOo/yCrwXYepgcZC/X7IGkPyd3wYrshvcxDe.fYZwW'),
(1151,'Tarek Ismail','HR','HR','tarek.ismail5230@gmail.com','$2b$12$PQQhWM5lOx4Gx44iDELLSux/3aDFozf1o5Cki00CyNOSE2Zoz8Bjm'),
(1152,'Amr Halim','DevOps Engineer','Automation','amr.halim4982@gmail.com','$2b$12$3kUdLlBZUZj6kAKNwk2ekejwfuyloYxH8rbfl5cpg0m0J5Gwy26wO'),
(1153,'Sara Kamel','Nurse','Cancer Nursing','sara.kamel5572@gmail.com','$2b$12$PERAlvs/zt9H6KUZ97Sla.qZON68TxOC4WhIJ74aQ5ls8V6.GxLRS'),
(1154,'David Wilson','Engineer','Front-End','david.wilson367@gmail.com','$2b$12$iQUhwi4mYaKUdMbFDP7iouJs7GiNeDhKLAbgtpBvbhlzDjkHX/WvW'),
(1155,'Hany Aziz','Surgeon','Plastic Surgery','hany.aziz7377@gmail.com','$2b$12$1Fb7zRWCNQS8TXlIe/izy.CN0.ZEtsEMRM6oWYs1sFbgugZ0IR58e'),
(1156,'Hana Saad','Doctor','Pediatrics (Kids)','hana.saad1553@gmail.com','$2b$12$XDpweUlacSMd4fSpO5im4eqT4YT.JWBwqHUb7bweOvUvmH0eAoMSm'),
(1157,'Jessica White','Engineer','Front-End','jessica.white7283@gmail.com','$2b$12$SnMuWhmG5DImVaal8aSCduiMzflTIWfRIvC22cYUcQ24PdLKOXnUO'),
(1158,'Lara Khalil','Surgeon','Orthopedic Surgery','lara.khalil4673@gmail.com','$2b$12$tVjxWyaDsR559id39OC/8ObfL1p0x07eBsHTimEXqLuW3l41Htewe'),
(1159,'Mariam Kamal','DevOps Engineer','Automation','mariam.kamal8670@gmail.com','$2b$12$7E3ngFlCisV5/8HeS8It7.c6l59Eiq4Td24mzIixAMIvKBGqc6iia'),
(1160,'Michael Brown','CEO','Management','michael.brown1934@gmail.com','$2b$12$F1o6IVo2YIUVMH6BjJzRUOQDsaXqGncmBPQF.E7enFC0xkwTRq9XK'),
(1161,'Khaled Naguib','Developer','Full-Stack','khaled.naguib767@gmail.com','$2b$12$4xpembFmmkQIaf4Iw/KvyObRxtKUW5HwBQQ6W/jK9iGaJpsuAM4Mi'),
(1162,'Jane Doe','Doctor','Neurology (Brain)','jane.doe7144@gmail.com','$2b$12$wN59AHMduoEMMGkAJveJ0eoxK0Vmdo.96Y05Q/4wJeY/CkEIC4Ue6'),
(1163,'Amr Halim','Intern','Full-Stack','amr.halim4050@gmail.com','$2b$12$oltJ2.AP2T6Fju05FinT6ePpJAqUC0CxhppX1dNnPUbCAfN0IhUDa'),
(1164,'Hany Aziz','Engineer','Back-End','hany.aziz5541@gmail.com','$2b$12$cvRGVeLfJFMU1VHTs7d5k..jBpNUnFHST4LGfMA1uFquUVpiR3gcy'),
(1165,'Nada Fahmy','Designer','UI/UX','nada.fahmy1438@gmail.com','$2b$12$cSI6WlFJr8zhJYi6C7ZZIuMvO3JpiSZnLjfiKrGZETqY1rynUWm.q'),
(1166,'Youssef Gamal','Scientist','Data','youssef.gamal3499@gmail.com','$2b$12$x1TL6zafHHWzNLWzpUcHDOIIz/45PU1.AcN.51zTfqzxQfZ89wWse'),
(1167,'Laura Santiago','Intern','Front-End','laura.santiago1957@gmail.com','$2b$12$hRR7wMMDSvkpZhPfmAWGzupReW6f/VDblcO14vOYo5gYQw.EtbnVS'),
(1168,'Lara Khalil','Nurse','Intensive Care Nursing','lara.khalil3213@gmail.com','$2b$12$/8dm.n3t8sPgxk9BeA347.pBrKHEW7jGbZ1gYN9FVhLH/zYDPk5hK'),
(1169,'Ziad Fouad','HR','HR','ziad.fouad394@gmail.com','$2b$12$uIguW8UHs2e8jnknDJ6z.uYq.ZxQh.IGa0Kc4vpbvL72X44s35pwO'),
(1170,'Mariam Kamal','DevOps Engineer','Automation','mariam.kamal5384@gmail.com','$2b$12$cNkLKOxp75QJHY9.fYgaTu6bvK/N04qJn2pEbJbEVhTKf9lMgu16m'),
(1171,'Amr Halim','HR','HR','amr.halim2136@gmail.com','$2b$12$9jdiU3koAn009OlfW8ZyIeBABsQpPbGxnqtEBrz0LRJw9NLlm63ae'),
(1172,'Hana Saad','Nurse','Children''s Nursing','hana.saad4019@gmail.com','$2b$12$GM/1kXaZi/KKH3NfoVoc7.MkreceEy4HTPDmzthM3G.p9eg5WYLjy'),
(1173,'Mona Ali','Engineer','Back-End','mona.ali4959@gmail.com','$2b$12$2C6NzBcOoLK/mgpn9NLucunn4Fo3NPsRKuX4tsLbNl4axcCsoo39O'),
(1174,'Amr Halim','Scientist','Data','amr.halim6679@gmail.com','$2b$12$cPASPgSsoruM9NRdpo7PbO1G4/B5qGpYF6GQbfbkgqzl6QGloBaiq'),
(1175,'Khaled Naguib','Nurse','Intensive Care Nursing','khaled.naguib9831@gmail.com','$2b$12$klaJYeMSXXYrT3rtdMEhau6nUjQqq6Fbqikie1i.gK.dtC5HZ4ZU2'),
(1176,'Jessica White','Cloud Engineer','Cloud','jessica.white9845@gmail.com','$2b$12$JDPcK6PCRvPP8ibexVsmUu0fPfqSZBg5VhNC5XOmFm3E6hC5nXR7K'),
(1177,'John Smith','Scientist','Data','john.smith1539@gmail.com','$2b$12$Z61Qdm8yr0ZFFn2HF5CFPOUYhJl/roGptLMJ3axDGGqIxe63FQnd.'),
(1178,'Lara Khalil','DevOps Engineer','Automation','lara.khalil2025@gmail.com','$2b$12$0/eXoodaKERReiyrt2KybukU5OwA0Qo8cbdXh/qsTVBLa5oq3lDmO'),
(1179,'Ramy Amin','Surgeon','Brain Surgery','ramy.amin6735@gmail.com','$2b$12$YfwA6XqdETKODZzeC7T/FeFyxTc9WTDmmnPfrZXDyoAWLXiglbB2y'),
(1180,'Hany Aziz','Surgeon','ENT Surgery','hany.aziz2049@gmail.com','$2b$12$IMg0Ks4rIGP5.XvJs.aW9uQBU2Bua8KvgeaPKcTGWUKo91pBHn5U.'),
(1181,'Jessica White','Engineer','Front-End','jessica.white2275@gmail.com','$2b$12$rG3X.HUxRtUlhy53QHaKn.YVRWIkNq6PXH6saujfgWOw8R9a6vq/S'),
(1182,'Lara Khalil','Cloud Engineer','Cloud','lara.khalil3423@gmail.com','$2b$12$YlhilZzDx6NIQhX2yFbH.eud1C5.gQ/ux0O8SkM3Lg5va1iQqqHr2'),
(1183,'Youssef Gamal','Designer','UI/UX','youssef.gamal6915@gmail.com','$2b$12$DJiVyB3XiV4TjbfWXIFydePSV3P3qw3dC9OsDK4QQC6/Zwqu56K8u'),
(1184,'Tarek Ismail','HR','HR','tarek.ismail4959@gmail.com','$2b$12$fcIi17YHQzC9hcx5Cgg4leGOIMZbR1w/hlzMNl0oDU1vl3iJqEfKS'),
(1185,'Ramy Amin','Engineer','Full-Stack','ramy.amin1780@gmail.com','$2b$12$rheruhHWjH7lSzVE3q3yDeo29hAsdsvGiuYgbVoK8vvMEgElBv2l6'),
(1186,'Amr Halim','HR','HR','amr.halim4326@gmail.com','$2b$12$sCW22Lhl5Pn3zyT4ddQaye6cEGrYggkyLvUXG40FMaCl5j2Qdq62.'),
(1187,'Jessica White','Developer','Front-End','jessica.white4861@gmail.com','$2b$12$Dmi36lqEgj9uygoiqmanP.X0e5y6Z8xwmBcZiPErj.jPPFPx3kZU2'),
(1188,'Tarek Ismail','DevOps Engineer','Automation','tarek.ismail2223@gmail.com','$2b$12$rj.wXle5sxKdnVxiLsNq2eRLp6Gn4MoqU1BBminf6eeXd9EWGXtUm'),
(1189,'Mariam Kamal','Developer','Full-Stack','mariam.kamal6318@gmail.com','$2b$12$63JNXPaUgIcTH9bUtvK3tOkqSu82AgUcGw2MFYB76ggBF5EGPdHBq'),
(1190,'Jessica White','Surgeon','Heart Surgery','jessica.white5485@gmail.com','$2b$12$.6GdqVB3dPYAmKiWN/F1oOC7.gcyLmbGmoxFMsLxjqNUBkKcXBWCe'),
(1191,'Khaled Naguib','Intern','Full-Stack','khaled.naguib8049@gmail.com','$2b$12$bFyur8w9XnINkzB/HXyc.O1Fqz3.si5m9yTjnFRQK32leiw7ww70G'),
(1192,'Mai Kamal','Doctor','Dermatology (Skin)','mai.kamal8550@gmail.com','$2b$12$3OuYL84.JrOViM6iwYB7UOsJCpEt6TkGzeYKwnLEHFYskG9OdUoDm'),
(1193,'Khaled Naguib','CEO','Management','khaled.naguib5975@gmail.com','$2b$12$qxRgk8Mnyi82IooYHY.Q2OnGRNs6yrldkbmHyYQKwAIGABqtkH01u'),
(1194,'Mai Kamal','Intern','Back-End','mai.kamal6303@gmail.com','$2b$12$kueVx0HzwtAE7Vkksp9ExOJjt4vvmu2Dvpke6kB70GpmWOwIBHA72'),
(1195,'Jessica White','HR','HR','jessica.white6458@gmail.com','$2b$12$5HdoX7myZXKap8pnPiJa0ed.blPQMy2UHglodWN/KIYhMspaMwhuS'),
(1196,'Nada Fahmy','Nurse','Cancer Nursing','nada.fahmy8569@gmail.com','$2b$12$qBBBvTGgYR5bYZ8tq/byNeuP0qcAQ2X7hsRR9Gg8eyRXSug19qu3G'),
(1197,'Tarek Ismail','CEO','Management','tarek.ismail1671@gmail.com','$2b$12$WT08bsfMdXzwG8LLdn0uN.g7eGigr90LUsJX2fZi4EVMWqN6uf2fu'),
(1198,'John Smith','Engineer','Back-End','john.smith387@gmail.com','$2b$12$xsT11zjNpZ0hbDluAlrESOCgJiPyEITj1X.dDYr28724JrY7nZOsG'),
(1199,'Hany Aziz','Designer','UI/UX','hany.aziz7480@gmail.com','$2b$12$aTPCca0VzllUIkKuKfZidOnylRPmPWO3/z55dRXRp2gpmIHubeZr.'),
(1200,'Baraa Mohamed','Developer','Front-End','baraamohamed2311@gmail.com','$2b$12$xg6cHBT.woeF6SVUO5n.6Ob6TWwaDR2h80ydMPrWPdrPuzu4j40IW');






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
 (7,'Access Rooms'),
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





CREATE INDEX idx_emp_title ON employees(emp_title);
CREATE INDEX idx_emp_email ON employees(emp_email);
CREATE INDEX idx_pat_email ON patients(patient_email);