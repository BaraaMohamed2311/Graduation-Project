FROM mysql:8.0

# Copy your backup.sql into init folder
COPY ./init/ /docker-entrypoint-initdb.d/

EXPOSE 3306

