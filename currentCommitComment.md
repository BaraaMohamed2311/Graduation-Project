Server/
Added Sync Methods
Added Order by table.id in get queries so synced data has same order as fetched data
updated SyncMethods and other updating methods to update u.version = u.version + 1
updated profile image API
Implemented update health status 
Fixed order of sql commands so filter using perms command "HAVING" comes before orderClause
Removed OrderBY table_name.id for sync since we are gonna use global versioning
Fixed filtering by role_name at /list/employees
Added jwtVerify to all routes

Client/
Updated saveToStorename methods in caching custom hooks to use putIndexDB instead of append. 
Implemented update health status 
Converted fetch to xhr to get onProgess for loading bar when uploading files 
Fixed patient profile page
Fixed getUserImage for all pages
Set avatar.jpg as default for all users images
Cached images of users
Fixed checkInput component to be the whole div instead of just input element
Restylining
changed getImage/updateImage to use user_id instead of user_email
Created ConfirmModal and used it on deleting
merged separate
Fixed input labeled wrapper issue at Inputs_Fields


Db Init/
Added version column to use as way to track latest_version instead of latest_update
Created global version table and removed latest_update and version from users table
Unified the usage of user_id as the only key in mongodb by applying so to Profile image module