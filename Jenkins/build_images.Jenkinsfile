node {


def version = "${env.BUILD_NUMBER}"
def images = [:]

stage('Clone repository') {
    checkout scm
}

stages {
        stage('Build & Push Docker Images') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', env.DOCKERHUB_CREDENTIALS) {

                        def images = [
                            [name: "ems-client", path: "../Websites/ems/client"],
                            [name: "ems-server", path: "../Websites/ems/server"],
                            [name: "hospital-client", path: "../Websites/hospital/client"],
                            [name: "hospital-server", path: "../Websites/hospital/server"]
                        ]

                        for (img in images) {
                            sh """
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


}
