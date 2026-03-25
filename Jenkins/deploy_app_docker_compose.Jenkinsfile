def exportEnvVarsUnix() {
    return """
        export EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
        export EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
        export HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
        export HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}
        export NODE_ENV=${env.NODE_ENV}
        export MYSQL_DATABASE=${env.MYSQL_DATABASE}
        export MYSQL_USER=${env.MYSQL_USER}
    """
}

def exportEnvVarsWindows() {
    return """
        set EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
        set EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
        set HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
        set HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}
        set NODE_ENV=${env.NODE_ENV}
        set MYSQL_DATABASE=${env.MYSQL_DATABASE}
        set MYSQL_USER=${env.MYSQL_USER}
    """
}

pipeline {
    agent any

    parameters {
        string(name: 'IMAGES_VERSIONS', defaultValue: '', description: 'Used to deploy specific image only')
    }

    environment {
        MYSQL_DATABASE = 'ems_db'
        MYSQL_USER = 'appuser'
        NODE_ENV = 'production'
        HOSPITAL_CLIENT_VERSION = '1.0.0'
        HOSPITAL_SERVER_VERSION = '1.0.0'
        EMS_CLIENT_VERSION = '1.0.0'
        EMS_SERVER_VERSION = '1.0.0'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage("Update Images Versions") {
            steps {
                script {
                    def imagesMap = readJSON text: params.IMAGES_VERSIONS

                    def getCurrentVersion = { serviceName ->
                        def result = sh(
                            script: "docker service inspect staging_stack_${serviceName} --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo ''",
                            returnStdout: true
                        ).trim()
                        return result ? result.tokenize('-').last() : "1.0.0"
                    }

                    env.EMS_SERVER_VERSION      = imagesMap["ems-server"]      ?: getCurrentVersion("ems_server")
                    env.EMS_CLIENT_VERSION      = imagesMap["ems-client"]      ?: getCurrentVersion("ems_client")
                    env.HOSPITAL_SERVER_VERSION = imagesMap["hospital-server"] ?: getCurrentVersion("hospital_server")
                    env.HOSPITAL_CLIENT_VERSION = imagesMap["hospital-client"] ?: getCurrentVersion("hospital_client")

                    echo "EMS_SERVER_VERSION: ${env.EMS_SERVER_VERSION}"
                    echo "EMS_CLIENT_VERSION: ${env.EMS_CLIENT_VERSION}"
                    echo "HOSPITAL_SERVER_VERSION: ${env.HOSPITAL_SERVER_VERSION}"
                    echo "HOSPITAL_CLIENT_VERSION: ${env.HOSPITAL_CLIENT_VERSION}"
                }
            }
        }

        stage("Init Swarm If Needed") {
            steps {
                script {
                    if (isUnix()) {
                        sh """
                            docker info --format '{{.Swarm.LocalNodeState}}' | grep -qw "active" \
                                || docker swarm init
                        """
                    } else {
                        bat """
                            docker info --format "{{.Swarm.LocalNodeState}}" | findstr "active" ^
                                || docker swarm init
                        """
                    }
                }
            }
        }

        stage("Setup Swarm Secrets") {
            steps {
                withCredentials([
                    string(credentialsId: 'MYSQL_ROOT_PASSWORD', variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'MYSQL_PASSWORD', variable: 'MYSQL_PASSWORD')
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                docker secret inspect MYSQL_ROOT_PASSWORD > /dev/null 2>&1 \
                                    || echo $MYSQL_ROOT_PASSWORD | docker secret create MYSQL_ROOT_PASSWORD -

                                docker secret inspect MYSQL_PASSWORD > /dev/null 2>&1 \
                                    || echo $MYSQL_PASSWORD | docker secret create MYSQL_PASSWORD -
                            '''
                        } else {
                            bat '''
                                docker secret inspect MYSQL_ROOT_PASSWORD > nul 2>&1 ^
                                    || echo %MYSQL_ROOT_PASSWORD% | docker secret create MYSQL_ROOT_PASSWORD -

                                docker secret inspect MYSQL_PASSWORD > nul 2>&1 ^
                                    || echo %MYSQL_PASSWORD% | docker secret create MYSQL_PASSWORD -
                            '''
                        }
                    }
                }
            }
        }

        stage("Deploy Stack to Staging") {
            steps {
                dir('Websites') {
                    script {
                        if (isUnix()) {
                            sh """
                                ${exportEnvVarsUnix()}
                                docker compose -f docker-compose.staging.yml pull
                                docker compose -f docker-compose.staging.yml config > /tmp/resolved-staging.yml
                                docker stack deploy -c /tmp/resolved-staging.yml staging_stack
                                rm /tmp/resolved-staging.yml
                            """
                        } else {
                            bat """
                                ${exportEnvVarsWindows()}
                                docker compose -f docker-compose.staging.yml pull
                                docker compose -f docker-compose.staging.yml config > resolved-staging.yml
                                docker stack deploy -c resolved-staging.yml staging_stack
                                del resolved-staging.yml
                            """
                        }
                    }
                }
            }
        }

        stage("Approval to Deploy Production") {
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: "Staging looks good?",
                          ok: "Deploy to Production"
                }
            }
        }

        stage("Deploy to Production") {
            steps {
                dir('Websites') {
                    script {
                        if (isUnix()) {
                            sh """
                                ${exportEnvVarsUnix()}
                                docker compose -f docker-compose.prod.yml pull
                                docker compose -f docker-compose.prod.yml config > /tmp/resolved-prod.yml
                                docker stack deploy -c /tmp/resolved-prod.yml production_stack
                                rm /tmp/resolved-prod.yml
                            """
                        } else {
                            bat """
                                ${exportEnvVarsWindows()}
                                docker compose -f docker-compose.prod.yml pull
                                docker compose -f docker-compose.prod.yml config > resolved-prod.yml
                                docker stack deploy -c resolved-prod.yml production_stack
                                del resolved-prod.yml
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed — production was NOT updated"
        }
        success {
            echo "Successfully deployed to production"
        }
    }
}