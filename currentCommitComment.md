WEBSITES
-----------
Fixed Register ems page rendering empty select element
Fixed Filtering by role_name at both hospital and ems
Fixed pickroleicon function and added vg images used to hospital website
Changed connect_ems_db to kill connection after idleTimeout: 60000,  60 sec to reconnect again instead of assuming that it still open (cuz mysql db kills connection after 8 hrs by default)


DB
------------
Modified roles enum

Jenkins
------------
ReOrdered stages to start with initing swarm
Rewritten the logic of most of the functions so workflow is :
    If stack not exist : full deploy
    If stack exist:
        Version is not passed in param: ignore it
        Version passed but service not running : Create it
        Version passed and running service: update it


Docker
------------
Updated limits of storage to be average of other services
Added Cpu limits
Reduced some replicas
