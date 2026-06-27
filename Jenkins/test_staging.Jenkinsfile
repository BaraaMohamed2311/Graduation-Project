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
                dir("K6/staging_test/scripts") {
                    script {
                        // Ensure results dir exists before any k6 run tries to write to it
                        sh 'mkdir -p results'

                        def files = findFiles(glob: '*.js')

                        files.each { file ->
                            def name = file.name.replace('.js', '')

                            sh """
                                echo "Running ${file.path}"
                                docker run --rm \\
                                    -v \$(pwd):/scripts \\
                                    -w /scripts \\
                                    --user \$(id -u):\$(id -g) \\
                                    grafana/k6 run ${file.name} \\
                                        --summary-export=/scripts/results/${name}-summary.json
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'K6/staging_test/scripts/results/**/*.json',
                             allowEmptyArchive: true
        }
    }
}