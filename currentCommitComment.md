Server/
Added New Update Full Data Functions
Changed stringifyFields to use aliases
Created buildJoinedUpdate function
Updated ControlUsers/* to match new parameters and build updating_string
Added Set of all perms at Tables/ 
Added Checking that requested_perms are valid and exists at Tables/ 
Removed old logic of update specific Data
Added latest_update column to update queries
Modified list of perms at Tables
Created AvailabilityMethods.js and imported it at other
Modified Updating methods at AvailabilityMethods.js and ConsultationMethods.js

Client/
fixed mismatch in the names of fields emplyee update pages  at server
Seperated conditions at UpdateUserForm to variable
Updated Inputs component to use defaulValues
Added Missing <li> for role_name in profile and employee/[id] pages
Fixed inCorrect conversion of emp_perms to Set when it's already a Set
Removed Localizing birth_date at patient/[id] and mypatient[id]
Separated Concerns at Inputs 

Db Init/
Added latest_update column
Modified Inserted perms to hospital_perms