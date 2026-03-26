FROM mysql:8.0

# Copy your backup.sql into init folder
COPY ./1_init.sql ./2_insertions.sql /docker-entrypoint-initdb.d/

EXPOSE 3306

