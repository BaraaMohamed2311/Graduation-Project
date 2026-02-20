pipeline {
    agent any

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
                        def images = [
                            [name: "ems-client", path: "Websites/ems/client"],
                            [name: "ems-server", path: "Websites/ems/server"],
                            [name: "hospital-client", path: "Websites/hospital/client"],
                            [name: "hospital-server", path: "Websites/hospital/server"]
                        ]

                        for (img in images) {
                            bat """
                                docker buildx create --use || true
                                docker buildx build \
                                  --platform linux/amd64,linux/arm64 \
                                  -t baraamohamed/gradproj:${img.name}-${VERSION} \
                                  ${img.path} \
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