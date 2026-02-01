Server/
Replace regular update query with UPSERT to insert if id do not exist in 
Fixed User.getUserEmailByID
Status Code:
- Catched error status 500 (internal server err)
- email failed 502 (bad gateway)
- any not found or undefined 404 
- update failed 409 (conflict)
- any roles or perm related authorization 403
- jwt/ login related authentication 401

Fixed all update full data functions to upsert specific tables except users table
Changed updateAvailability function
Fixed queries strutcure in all title classes to get user data even he wasn't inserted into specific-fields tables
Updated getALL queries to have all specific columns by default to improve queries performance, instead of LEFT JOINS and CASE
Updated buildJoinedUpdate to use entityType to help in aliasing fields
Added AuditLogs and called it when necessary
Removed unnecessary snippets from CompanyFactory and CompanyMethods and Utils/methods
Modifies in files api routes and Mongodb modules





Client/
Created update availability component
Created a layout for editing components
Now we can update all desired fields of employee even specific ones
Restyling for better UI/UX



Db Init/
Structuring new init and insert .sql files 

Docker
Modified Netweorks and added containers
