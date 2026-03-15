pipeline {
    agent {
        docker {
            // Use Docker-in-Docker with buildkit support
            image 'docker:24-dind'
            args  '--privileged -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
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

         stage('Setup buildx + QEMU') {
            steps {
                sh """
                    # Step 1: Register QEMU emulators for cross-arch builds
                    docker run --rm --privileged \
                        multiarch/qemu-user-static \
                        --reset -p yes

                    # Step 2: Install buildx if not present
                    mkdir -p ~/.docker/cli-plugins
                    curl -sSL https://github.com/docker/buildx/releases/download/v0.12.0/buildx-v0.12.0.linux-amd64 \
                        -o ~/.docker/cli-plugins/docker-buildx
                    chmod +x ~/.docker/cli-plugins/docker-buildx

                    # Step 3: Create a new builder with container driver
                    docker buildx create \
                        --name ci-builder \
                        --driver docker-container \
                        --driver-opt network=host \
                        --use

                    # Step 4: Boot the builder and verify platforms
                    docker buildx inspect ci-builder --bootstrap

                    # Should show: linux/amd64, linux/arm64, linux/arm/v7
                    docker buildx ls
                """
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
                                    --platform linux/amd64,linux/arm64 ^
                                    -t baraamohamed/gradproj:${svc.trim()}-${version} ^
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
                                        --platform linux/amd64,linux/arm64 \\
                                        -t baraamohamed/gradproj:${svc.trim()}-${version} \\
                                        -t baraamohamed/gradproj:${svc.trim()}-latest \\
                                        -f \$WORKSPACE/${conf.path}/${conf.file} \\
                                        \$WORKSPACE/${conf.path}   \\ 
                                        --push
                                    """
                            }
                            }
                        }
                    }
            }

            stage('Teardown Builder') {
                steps {
                    sh "docker buildx rm ci-builder || true"
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