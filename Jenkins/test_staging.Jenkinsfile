pipeline {
    agent any

    

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run K6 Tests') {
            
                steps {
                    // so pwd refers to that path and we can mount it to docker
                    dir("K6/staging_test/scripts") {
                        script {
                            def files = findFiles(glob: '*.js')

                            sh "mkdir -p results"

                            files.each { file ->
                                def name = file.name.replace('.js','')

                                sh """
                                echo Running ${file.path}

                                docker run --rm \
                                -v \$(pwd):/scripts \
                                -w /scripts \
                                grafana/k6 run ${file.path} \
                                    --summary-export=/scripts/results/${name}-summary.json \
                                """
                            }
                        }
                    }
                }
            }
    }

}