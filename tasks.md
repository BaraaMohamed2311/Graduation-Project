خلي في المستشفي تقدر تمسح المرضي بس لو معاك البيرمشن لكن الموظفين مينفعش غير من ems
الادمن في المستشفي يقدر يربط مريض بأوضة ويقدر يغير بياناته 
السوبر يقدر يغير رولز وبيرمشنز المستشفي لليوزر ويعمل زي الادمن
في حالة ان اليوزر عايز يعدل الداتا بتاعته لازم يتعرف هو تبع انهي جدول من التايتل بتاعه وتجيب الداتا منه وتسيبه يعدلها
في اللوجين والريجستر والفروجيت باسوورد وكدا لازم تعرف اليوزر مريض ولا عامل عشان تختار الجدول المناسب
في البروفايل محتاج الداتا من ems ومن المستشفي
الريجستر كا مريض بس هنا 
الريكويستات اللي هتلعب عالوينجين مريض وموظف لازم تبقا بتتشيك بالايميل عشان الid ممكن يكون موجود فقي الجدولين بس طبعا اليوزر مختلف
FIX AVAILABILITY  HOW DATA IS RECEIEVED AND UPDATED

creaste the delete user for each
check delete perm function at admin and super cuz it seems like there is a missing logic


ADD JWTVERIFY for necessary routes 

WHEN REGISTER NEW HOSPITAL EMPLOYEE AT EMS IT SHOULD BE ADDED TO ALL RELEVANT TABLES AT HOSPITAL LIKE HOSPITAL_EMP_ID

RENAME USER.GETEMAIL FUNCTION AND MODIFY WHERE IT"S USED

// Employee Core at list change other client side has 
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