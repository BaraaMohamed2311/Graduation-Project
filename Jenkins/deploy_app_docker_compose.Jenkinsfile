pipeline {
    agent any

    parameters {
        string(name: 'IMAGES_VERSIONS', defaultValue: '', description: 'Used to deploy specific image only')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // prevents version being an empty string if image wasn't built which can cause docker-compose to set version to "latest" and deploy an unintended version
        stage("update images versions") {
            steps{
                script {
                def imagesMap = readJSON text: params.IMAGES_VERSIONS

                // Get currently running versions from the stack as fallback
                def getCurrentVersion = { serviceName ->
                    def result = sh(
                        script: "docker service inspect staging_stack_${serviceName} --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo ''",
                        returnStdout: true
                    ).trim()
                    // image format: baraamohamed/gradproj:ems_server-2.1.0
                    // extract version after the last dash
                    return result ? result.tokenize('-').last() : "1.0.0"
                }

                // Use built version if available, otherwise use currently running version
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

         stage("Init Swarm if needed"){
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            docker info --format '{{.Swarm.LocalNodeState}}' | grep -qw "active" \
                                || docker swarm init
                        '''
                    } else {
                        bat '''
                            docker info --format "{{.Swarm.LocalNodeState}}" | findstr "active" \
                                || docker swarm init
                        '''
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
                                echo $MYSQL_ROOT_PASSWORD | docker secret create MYSQL_ROOT_PASSWORD -
                                echo $MYSQL_PASSWORD | docker secret create MYSQL_PASSWORD -
                            '''
                        } else {
                            bat '''
                                echo %MYSQL_ROOT_PASSWORD% | docker secret create MYSQL_ROOT_PASSWORD -
                                echo %MYSQL_PASSWORD% | docker secret create MYSQL_PASSWORD -
                            '''
                        }
                    }
                }
            }
        }

        stage("deploy compose") {
            steps {
                // The directory of the compose file is different from the root of the repo, so we need to change the working directory before running docker-compose commands
                dir('Websites') {
                    script {
                        if (isUnix()) {
                            sh '''
                                EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION} \
                                EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION} \
                                HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION} \
                                HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION} \
                                docker-compose -f docker-compose.staging.yml pull
                                
                                docker stack deploy -c docker-compose.staging.yml staging_stack
                            '''
                        } else {
                            bat '''
                                set EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
                                set EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
                                set HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
                                set HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}

                                docker-compose -f docker-compose.staging.yml pull
                            
                                docker stack deploy -c docker-compose.staging.yml staging_stack
                            '''
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
                script {
                    if (isUnix()) {
                        sh '''
                            EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION} \
                            EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION} \
                            HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION} \
                            HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION} \
                            docker-compose -f docker-compose.prod.yml pull
                            
                            docker stack deploy -c docker-compose.prod.yml staging_stack
                        '''
                    } else {
                        bat '''
                            set EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
                            set EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
                            set HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
                            set HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}

                            docker-compose -f docker-compose.prod.yml pull
                        
                            docker stack deploy -c docker-compose.prod.yml staging_stack
                        '''
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