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
                            [name: "ems-client", path: "Websites/ems/client",file:"Dockerfile.frontend"],
                            [name: "ems-server", path: "Websites/ems/server",file:"Dockerfile.backend"],
                            [name: "hospital-client", path: "Websites/hospital/client",file:"Dockerfile.frontend"],
                            [name: "hospital-server", path: "Websites/hospital/server",file:"Dockerfile.backend"]
                        ]

                        for (img in images) {
                     
                            bat """
                                echo Listing current directory
                                dir
                                echo ${img.path}/${img.file}
                                docker buildx create --use || true
                                docker buildx build \
                                  --platform linux/amd64,linux/arm64 \
                                  -t baraamohamed/gradproj:${img.name}-${VERSION} \
                                  -f ${img.file}\
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