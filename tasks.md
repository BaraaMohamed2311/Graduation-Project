
السوبر يقدر يغير رولز وبيرمشنز المستشفي لليوزر ويعمل زي الادمن

الريجستر كا مريض بس هنا 
الريكويستات اللي هتلعب عالوينجين مريض وموظف لازم تبقا بتتشيك بالايميل عشان الid ممكن يكون موجود فقي الجدولين بس طبعا اليوزر مختلف


creaste the delete user for each
check delete perm function at admin and super cuz it seems like there is a missing logic


ADD JWTVERIFY for necessary routes 


RENAME USER.GETEMAIL FUNCTION AND MODIFY WHERE IT"S USED

// client side musn't allow from the begining any fields from employees table to be updated


Update other patient only updates patient data, but room data user must be navigated to room page and use rooms api


CHECK front end updated cached users on deleted as expected

WHEN PATIENT_ID NOT FOUND IT ERROR
'Cannot add or update a child row: a foreign key constraint fails (`ems_db`.`rooms`, CONSTRAINT `rooms_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON 
DELETE SET NULL)',
  sql: '\n' +
    '                UPDATE rooms\n' +
    '                SET \n' +
    '                    isOccupied = TRUE,\n' +
    '                    patient_id = 22\n' +
    "                WHERE room_id = '10';\n" +
    '            ;'
}

Changes to reflect to previous ems
- rename function at perms to be  executeRemoveOther instead of executeRemoveOtherPerm
- move the queries inside the executeRemoveOther and pass the id as parameter
- let Modify Perms at list.js use the User.getPerms function instead of executleSQLQueries()



// Booking
patient can update status to Cancelled only if it was Scheduled with him
employee can update any Consultation data , can get any data about Consultation

Check isVaildEmployeeTitleForAppointments and doctor and surgeon methods


ADD PERM Logic TO 

/room:id/empty 

/room:id/assign


ADD Title CHeck at uploading files to check user is patient



Replace THese lines : 
// --2. See if user exists at one of the tables
        const query_emp = `SELECT EXISTS(SELECT * FROM employees WHERE emp_email =?) AS data_exists`
        const userIsEmployee = await isExist(query_emp,[user_email]);
        // search for user inside patients table
        const query_pat = `SELECT EXISTS(SELECT * FROM patients WHERE patient_email =?) AS data_exists`
        const userIsPatient = await isExist(query_pat,[user_email]);


        with a function that execute first query and if not found then it goes to next query, for better performance



// Create a function that deletes indexDB after an hour

=========================================
1) Update EMS queries to use users table for authentication
2) Update functions that query using email to get corresponding table
3) Consultions table must reference user_id instead of patient_id
4) When user is registered at EMS or hospital they must be inserted to users and there specific table