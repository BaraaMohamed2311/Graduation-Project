WEBSITES
-----------
Created storage app website
Updated parsedUpdatesToObjects and parseUpdatingStringByTable to use prioritized mapping for fields
Added meds.js route
Added table to list meds
Updated logic of Modify Patients Data to detect floor_number, room_number, isAssignedToRoom at client patient pages
Added Cronjobs


PIPELINE
------------
Added logic in github action for storage microservices
Added logic in jenkins script for storage microservices 
UPDATED with new secrets for storage

DB
------------

ADDED MYSQL tables for mapping patients and meds


DOCKER
---------------------------
UPDATE all the compose and stack files for new storage service

NGINX
---------------------------------
To reverse proxy to storage services

