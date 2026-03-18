pipeline{
    agent any
    parameters {
        string(name: 'IMAGES_VERSIONS', defaultValue: '', description: 'Used to deploy specific image only')
    }

    stages{
        stage("update images versions"){
            def imagesMap = readJSON text: jsonImages
    
            env.EMS_SERVER_VERSION      = imagesMap["ems-server"]      ?: imagesMap["EMS_SERVER"]      ?: ""
            env.EMS_CLIENT_VERSION      = imagesMap["ems-client"]      ?: imagesMap["EMS_CLIENT"]      ?: ""
            env.HOSPITAL_SERVER_VERSION = imagesMap["hospital-server"] ?: imagesMap["HOSPITAL_SERVER"] ?: ""
            env.HOSPITAL_CLIENT_VERSION = imagesMap["hospital-client"] ?: imagesMap["HOSPITAL_CLIENT"] ?: ""


        }

        stage("Setup Swarm Secrets"){
           withCredentials([string(credentialsId: 'MYSQL_ROOT_PASSWORD', variable: 'MYSQL_ROOT_PASSWORD'),
                        string(credentialsId: 'MYSQL_PASSWORD', variable: 'MYSQL_PASSWORD')]) {
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
        stage("deploy compose"){
            steps{
                script{
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
        // delay execution of next stage until user approval
        stage("Approval to Deploy Production") {
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: "Staging looks good?", 
                        ok: "Deploy to Production",
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