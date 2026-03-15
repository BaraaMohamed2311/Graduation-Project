pipeline {
    agent any
    parameters {
          string(name: 'SERVICES', defaultValue: '', description: 'Used to build specific image only')
    }

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials' // Jenkins credential ID
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }


        stage('Build & Push Docker Images') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', env.DOCKERHUB_CREDENTIALS) {
                        // Fallback to empty string if null
                        echo "SERVICES: ${SERVICES}"
                        def servicesParam = SERVICES ?: ""
                        
                        // Split only if not empty
                        def services = servicesParam ? servicesParam.split(",") : []


                        def map = [
                            "ems-client": [path: "Websites/ems/client", file: "Dockerfile.frontend"],
                            "ems-server": [path: "Websites/ems/server", file: "Dockerfile.backend"],
                            "hospital-client": [path: "Websites/hospital/client", file: "Dockerfile.frontend"],
                            "hospital-server":[path: "Websites/hospital/server", file: "Dockerfile.backend"]
                        ]

                        for (svc in services) {
                             def conf = map[svc.trim()]
                             def workspace = env.WORKSPACE // location where repo is checked out
                             // Get version of each app frpm package.json
                             def version = sh(
                                    script: "jq -r '.version' %WORKSPACE%/${conf.path}/package.json",
                                    returnStdout: true // capture the output of the command for use in variable
                                ).trim()

                                echo "Version: ${version}"
                                echo "PATH TO IMAGE %WORKSPACE%/${conf.path}/${conf.file}"
                                bat """
                                    docker buildx build ^
                                    --platform linux/amd64,linux/arm64 ^
                                    -t baraamohamed/gradproj:${svc.trim()}-${VERSION} ^
                                    -t baraamohamed/gradproj:${svc.trim()}-latest ^
                                    -f %WORKSPACE%/${conf.path}/${conf.file} ^
                                    %WORKSPACE%/${conf.path} ^
                                    --push
                                """
                        }
                        }
                    }
                }
            }
        }
    

    post {
        always {
            echo 'Build finished.'
        }
        failure {
            echo 'Build failed.'
        }
    }
}