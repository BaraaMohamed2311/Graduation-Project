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
                script {
                    // Assuming K6 test files are in the repo under ./K6
                    def files = findFiles(glob: 'K6/staging_test/scripts/*.js')
                    files.each { file ->
                        sh "echo ${file.path}"
                    }
                }
            }
        }
    }

}