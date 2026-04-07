pipeline {
    agent any

    environment {
        MYSQL_ROOT_PASSWORD = 'root'
        MYSQL_DATABASE = 'test_db'
        MYSQL_CONTAINER_NAME = 'jenkins-test-mysql'
        MYSQL_PORT = '3307' // Use non-conflicting port
    }

    stages {
        stage('Start MySQL Container') {
            steps {
                script {
                    // Pull and start MySQL container
                    sh """
                    docker pull mysql:8
                    docker run -d --name ${MYSQL_CONTAINER_NAME} \\
                        -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \\
                        -e MYSQL_DATABASE=${MYSQL_DATABASE} \\
                        -p ${MYSQL_PORT}:3306 mysql:8
                    """
                    // Wait for MySQL to be ready
                    sh 'until docker exec ${MYSQL_CONTAINER_NAME} mysqladmin ping -h "localhost" --silent; do echo "Waiting for MySQL..."; sleep 2; done'
                }
            }
        }

        stage('Seed Database') {
            steps {
                script {
                    // Copy seed SQL file into container (adjust path as needed)
                    sh "docker cp db_seeds.sql ${MYSQL_CONTAINER_NAME}:/db_seeds.sql"
                    // Execute seed script
                    sh "docker exec -i ${MYSQL_CONTAINER_NAME} mysql -uroot -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < /db_seeds.sql"
                }
            }
        }

        stage('Run K6 Tests') {
            steps {
                // Assuming K6 test files are in the repo under ./k6-tests
                sh """
                docker run --rm -i loadimpact/k6 run /k6-tests/test.js
                """
            }
        }
    }

    post {
        always {
            // Clean up MySQL container
            sh "docker rm -f ${MYSQL_CONTAINER_NAME}"
        }
    }
}