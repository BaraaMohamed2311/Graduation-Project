pipeline {
    agent any
    parameters {
          string(name: 'SERVICES', defaultValue: '', description: 'Used to build specific image only')
    }

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials' // Jenkins credential ID
        VERSION = '1-0-0' 
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


                        def images = [
                            "ems-client": [path: "Websites\\ems\\client",      file: "Dockerfile.frontend"],
                            "ems-server": [path: "Websites\\ems\\server",      file: "Dockerfile.backend"],
                            "hospital-client": [path: "Websites\\hospital\\client", file: "Dockerfile.frontend"],
                            "hospital-server":[path: "Websites\\hospital\\server", file: "Dockerfile.backend"]
                        ]

                        for (svc in services) {
                             def conf = map[svc]

                                bat """
                                    docker buildx build ^
                                    --platform linux/amd64,linux/arm64 ^
                                    -t baraamohamed/gradproj:${svc}-${VERSION} ^
                                    -f ${conf.file} ^
                                    ${conf.path} ^
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