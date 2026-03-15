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

    // Setup Docker Buildx for multi-arch builds
        stage('Setup Buildx') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            docker buildx create --name multiarch --driver docker-container --use || true
                            docker buildx inspect multiarch --bootstrap
                        '''
                    } else {
                        bat '''
                            docker buildx create --name multiarch --driver docker-container --use || exit /b 0
                            docker buildx inspect multiarch --bootstrap
                        '''
                    }
                }
            }
        }



        // Windows build and push to Docker Hub
        stage('Windows Build & Push') {
            when {
                expression { !isUnix() }
            }
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
                             def pkg_file = readJSON file: "${workspace}/${conf.path}/package.json"
                             def version = pkg_file.version

                                echo "APP /${conf.path} | Version: ${version}"
                                echo "PATH TO IMAGE %WORKSPACE%/${conf.path}/${conf.file}"
                                // windows bat  uses ^ for line continuation, and %WORKSPACE% for env variable access
                                bat """
                                    docker buildx build ^
                                        --builder multiarch ^
                                        --platform linux/amd64,linux/arm64 ^
                                        -t baraamohamed/gradproj:${svc.trim()}-${version} ^
                                        -t baraamohamed/gradproj:${svc.trim()}-latest ^
                                        -f %WORKSPACE%\\${conf.path}\\${conf.file} ^
                                        %WORKSPACE%\\${conf.path} ^
                                        --push
                                    """
                        }
                        }
                    }
                }
            }

            // Linux build and push to Docker Hub
            stage('Linux Build & Push') {
                when {
                    expression { isUnix() }
                }
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
                                def pkg_file = readJSON file: "${workspace}/${conf.path}/package.json"
                                def version = pkg_file.version

                                    echo "APP /${conf.path} | Version: ${version}"
                                    echo "PATH TO IMAGE $WORKSPACE/${conf.path}/${conf.file}"
                                    // linux uses sh \ for line continuation, and $WORKSPACE for env variable access
                                    sh """
                                        docker buildx build \\
                                            --builder multiarch \\
                                            --platform linux/amd64,linux/arm64 \\
                                            -t baraamohamed/gradproj:${svc.trim()}-${version} \\
                                            -t baraamohamed/gradproj:${svc.trim()}-latest \\
                                            -f \$WORKSPACE/${conf.path}/${conf.file} \\
                                            \$WORKSPACE/${conf.path} \\
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