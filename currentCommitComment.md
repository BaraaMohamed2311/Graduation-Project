Server/
Fixed booking with same employee twice's condition at /book-consultation
updated methods at \hospital\server\Utils\methods of Get[Title]FullData to return result[0]
Created Api for consultation-details page
prevented updating completed consultations
throw error at connect mongodb
files api routes for FilesList component at patient/[id] and mypatient/[id]

Client/
Updated UpdateUserForm and Form_FIelds to be more generic and render all select options
fixed render patient profile ( check if emp_title exists before using toLowerCase)
Created consultation-details
Added direct function to convert to 12hrs format at timeHelpers
Added Health State Component 
Used PatientFiles Component in profile and updated its style
prevented updating completed consultations
Fixed patient_email => user_email at patient/[id] and mypatient/[id]
FilesList functionable and recieves external handlers and state

Db Init/
A script to create documents to insert them manually to mongodb for healthStates