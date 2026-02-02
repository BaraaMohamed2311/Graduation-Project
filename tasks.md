Fix perms display at profile in hospital

=========================================
1) Update EMS queries to use users table for authentication
2) Update functions that query using email to get corresponding table
3) Consultions table must reference user_id instead of user_id
4) When user is registered at EMS or hospital they must be inserted to users and there specific table

=========================================
*) let sqlTransaction use params


=========================================
Remove unnecessary props from searchoptions like filteredResults


hany.aziz3663@gmail.com
 hany.aziz2049@gmail.com


----------------------------------
booking and files must be more secure

