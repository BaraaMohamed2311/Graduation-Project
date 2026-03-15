pipeline {
    agent any

    parameters {
        string(name: 'SERVICES', defaultValue: '', description: 'Used to build specific image only')
    }

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Buildx') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            docker buildx create \
                                --name multiarch \
                                --driver docker-container \
                                --use || true
                            docker buildx inspect multiarch --bootstrap
                        '''
                    } else {
                        bat '''
                            docker buildx create ^
                                --name multiarch ^
                                --driver docker-container ^
                                --use || exit /b 0
                            docker buildx inspect multiarch --bootstrap
                        '''
                    }
                }
            }
        }

        stage('Linux Build & Push') {
            when {
                expression { isUnix() }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        // Login manually — no temp config isolation
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                        def servicesParam = (params.SERVICES ?: "").trim()
                        def services = servicesParam ? servicesParam.split(",") : []

                        def map = [
                            "ems-client"     : [path: "Websites/ems/client",     file: "Dockerfile.frontend"],
                            "ems-server"     : [path: "Websites/ems/server",     file: "Dockerfile.backend"],
                            "hospital-client": [path: "Websites/hospital/client",file: "Dockerfile.frontend"],
                            "hospital-server": [path: "Websites/hospital/server",file: "Dockerfile.backend"]
                        ]

                        for (svc in services) {
                            def svcName = svc.trim()
                            def conf    = map[svcName]

                            if (!conf) {
                                error "Unknown service: '${svcName}'. Valid: ${map.keySet()}"
                            }

                            def pkg  = readJSON file: "${env.WORKSPACE}/${conf.path}/package.json"
                            def version = pkg.version

                            echo "Building ${svcName} v${version}"
                            // --network=host to use for tools needed during build that require internet access
                            sh """
                                docker buildx build \\
                                    --builder multiarch \\
                                    --platform linux/amd64,linux/arm64 \\
                                    --network=host \\
                                    -t baraamohamed/gradproj:${svcName}-${version} \\
                                    -t baraamohamed/gradproj:${svcName}-latest \\
                                    -f \$WORKSPACE/${conf.path}/${conf.file} \\
                                    \$WORKSPACE/${conf.path} \\
                                    --push
                            """

                            echo "Pushed baraamohamed/gradproj:${svcName}-${version}"
                        }

                        // Always logout after push
                        sh 'docker logout'
                    }
                }
            }
        }

        stage('Windows Build & Push') {
            when {
                expression { !isUnix() }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'

                        def servicesParam = (params.SERVICES ?: "").trim()
                        def services = servicesParam ? servicesParam.split(",") : []

                        def map = [
                            "ems-client"     : [path: "Websites/ems/client",     file: "Dockerfile.frontend"],
                            "ems-server"     : [path: "Websites/ems/server",     file: "Dockerfile.backend"],
                            "hospital-client": [path: "Websites/hospital/client",file: "Dockerfile.frontend"],
                            "hospital-server": [path: "Websites/hospital/server",file: "Dockerfile.backend"]
                        ]

                        for (svc in services) {
                            def svcName = svc.trim()
                            def conf    = map[svcName]

                            if (!conf) {
                                error "Unknown service: '${svcName}'"
                            }

                            def pkg     = readJSON file: "${env.WORKSPACE}\\${conf.path}\\package.json"
                            def version = pkg.version

                            echo "Building ${svcName} v${version}"
                            // --network=host to use for tools needed during build that require internet access
                            bat """
                                docker buildx build ^
                                    --builder multiarch ^
                                    --platform linux/amd64,linux/arm64 ^
                                    --network=host ^
                                    -t baraamohamed/gradproj:${svcName}-${version} ^
                                    -t baraamohamed/gradproj:${svcName}-latest ^
                                    -f %WORKSPACE%\\${conf.path}\\${conf.file} ^
                                    %WORKSPACE%\\${conf.path} ^
                                    --push
                            """
                        }

                        bat 'docker logout'
                    }
                }
            }
        }
    }

    post {
        always {
            // Clean up builder and logout
            sh 'docker buildx rm multiarch || true'
            echo 'Build finished.'
        }
        failure {
            echo 'Build failed.'
        }
    }
}
