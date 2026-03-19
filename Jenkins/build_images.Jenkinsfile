def successfulImages = [:] // global groovy variable to store successfully built images and their versions for later use in deployment
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
                        // Server folder in ems and server folder in hospital are named differently, so we need to handle that
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
                            echo "Building ${svcName}"
                            echo "pkg path: ${env.WORKSPACE}\\${conf.path}\\package.json"
                            def pkgRaw = readFile(file: "${env.WORKSPACE}/${conf.path}/package.json").replaceAll(/^\uFEFF/, '')  // strip BOM if present

                            def pkg = readJSON text: pkgRaw
                            def version = pkg.version

                            echo "version app ${version}"
                            // --network=host to use for tools needed during build that require internet access
                            try {
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
                                // store successful build
                                successfulImages[svc.trim()] = version
                            } catch (err) {
                                echo "Failed to build ${svcName}: ${err}"
                                continue
                            }

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
                        // stop pipeline if no services specified, to avoid building all images by default which is time consuming and not always needed
                        // also avoids timing out the production message if the build is triggered without parameters by mistake
                        if (services.isEmpty()) {
                            error "No services specified. Set the SERVICES parameter (e.g. ems-client,ems-server)"
                        }

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
                            
                            echo "Building ${svcName}"
                            echo "pkg path: ${env.WORKSPACE}\\${conf.path}\\package.json"
                            def pkgRaw = readFile(file: "${env.WORKSPACE}/${conf.path}/package.json").replaceAll(/^\uFEFF/, '')  // strip BOM if present

                            def pkg = readJSON text: pkgRaw
                            def version = pkg.version
                            echo "version app ${version}"
                            
                            // --network=host to use for tools needed during build that require internet access
                            try {
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
                                // store successful build
                                successfulImages[svc.trim()] = version
                            } catch (err) {
                                echo "Failed to build ${svcName}: ${err}"
                                continue
                            }
                        }

                        bat 'docker logout'
                    }
                }
            }
        }

        stage('Deploy to Production') {
                input {
                    message "Deploy to production?"
                    ok "Deploy"
                }

                steps {
                    script {
                        
                        def jsonImages = writeJSON returnText: true, json: successfulImages

                        build job: 'deploy-swarm-production',
                            parameters: [
                                string(
                                    name: 'IMAGES_VERSIONS',
                                    value: jsonImages
                                )
                            ]
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
