def exportEnvVarsUnix() {
    return """
        export EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
        export EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
        export HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
        export HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}
        export STORAGE_SERVER_VERSION=${env.STORAGE_SERVER_VERSION}
        export STORAGE_CLIENT_VERSION=${env.STORAGE_CLIENT_VERSION}
        export NODE_ENV=${env.NODE_ENV}
        export MYSQL_DATABASE=${env.MYSQL_DATABASE}
        export MYSQL_USER=${env.MYSQL_USER}
    """
}

def exportEnvVarsWindows() {
    return """
        set EMS_SERVER_VERSION=${env.EMS_SERVER_VERSION}
        set EMS_CLIENT_VERSION=${env.EMS_CLIENT_VERSION}
        set HOSPITAL_SERVER_VERSION=${env.HOSPITAL_SERVER_VERSION}
        set HOSPITAL_CLIENT_VERSION=${env.HOSPITAL_CLIENT_VERSION}
        set STORAGE_SERVER_VERSION=${env.STORAGE_SERVER_VERSION}
        set STORAGE_CLIENT_VERSION=${env.STORAGE_CLIENT_VERSION}
        set NODE_ENV=${env.NODE_ENV}
        set MYSQL_DATABASE=${env.MYSQL_DATABASE}
        set MYSQL_USER=${env.MYSQL_USER}
    """
}

def updateServices(String stackPrefix, Map imagesMap) {
    def serviceMap = [
        "ems-server"      : "ems_server",
        "ems-client"      : "ems_client",
        "hospital-server" : "hospital_server",
        "hospital-client" : "hospital_client",
        "storage-server"  : "storage_server",
        "storage-client"  : "storage_client",
    ]

    imagesMap.each { imageName, version ->
        def serviceSuffix = serviceMap[imageName]
        if (!serviceSuffix) {
            echo "WARNING: Unknown image '${imageName}', skipping"
            return
        }
        def fullService = "${stackPrefix}_${serviceSuffix}"
        def newImage = "baraamohamed/gradproj:${imageName}-${version}"
        echo "Updating ${fullService} → ${newImage}"
        sh "docker service update --image ${newImage} --with-registry-auth ${fullService}"
    }
}

def stackDeploy(String composeFile, String stackName, String resolvedFile) {
    sh """
        ${exportEnvVarsUnix()}
        docker compose -f ${composeFile} pull
        envsubst < ${composeFile} > ${resolvedFile}
        docker stack deploy -c ${resolvedFile} ${stackName}
        rm ${resolvedFile}
    """
}

pipeline {
    agent any

    parameters {
        string(name: 'IMAGES_VERSIONS', defaultValue: '', description: 'JSON map of image → version. Empty = full stack deploy (infra change). Partial = targeted service update.')
    }

    environment {
        MYSQL_DATABASE = 'ems_db'
        MYSQL_USER     = 'appuser'
        NODE_ENV       = 'production'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage("Resolve Versions & Stack State") {
            steps {
                script {
                    def imagesMap = params.IMAGES_VERSIONS?.trim() ? readJSON(text: params.IMAGES_VERSIONS) : [:]
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'

                    // ── Stack existence ──────────────────────────────────────
                    // We check stack existence first because if stack doesn't exist, we know for sure it's a full deploy and all versions will be resolved to either provided or 'latest' → no need to inspect services at all
                    env.STAGING_STACK_EXISTS = sh(
                        script: "docker stack ls --format '{{.Name}}' | grep -qw staging_stack && echo yes || echo no",
                        returnStdout: true
                    ).trim()

                    env.PRODUCTION_STACK_EXISTS = sh(
                        script: "docker stack ls --format '{{.Name}}' | grep -qw production_stack && echo yes || echo no",
                        returnStdout: true
                    ).trim()

                    // ── Version resolution ───────────────────────────────────
                    // Priority: provided in param → currently running on staging → 'latest'
                    // When stack doesn't exist, inspect returns '' so fallback hits 'latest' automatically
                    def getCurrentVersion = { serviceName ->
                        def image = sh(
                            script: "docker service inspect staging_stack_${serviceName} --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo ''",
                            returnStdout: true
                        ).trim()
                        if (!image) return 'latest'
                        image = image.split('@')[0]
                        def parts = image.tokenize(':')
                        if (parts.size() < 2) return 'latest'
                        return parts[1].tokenize('-').last()
                    }

                    env.EMS_SERVER_VERSION      = imagesMap["ems-server"]      ?: getCurrentVersion("ems_server")
                    env.EMS_CLIENT_VERSION      = imagesMap["ems-client"]      ?: getCurrentVersion("ems_client")
                    env.HOSPITAL_SERVER_VERSION = imagesMap["hospital-server"] ?: getCurrentVersion("hospital_server")
                    env.HOSPITAL_CLIENT_VERSION = imagesMap["hospital-client"] ?: getCurrentVersion("hospital_client")
                    env.STORAGE_SERVER_VERSION  = imagesMap["storage-server"]  ?: getCurrentVersion("storage_server")
                    env.STORAGE_CLIENT_VERSION  = imagesMap["storage-client"]  ?: getCurrentVersion("storage_client")

                    echo """
                        ── Stack State ──────────────────────────────
                        STAGING_STACK_EXISTS:    ${env.STAGING_STACK_EXISTS}
                        PRODUCTION_STACK_EXISTS: ${env.PRODUCTION_STACK_EXISTS}
                        ── Resolved Versions ────────────────────────
                        EMS_SERVER_VERSION:      ${env.EMS_SERVER_VERSION}
                        EMS_CLIENT_VERSION:      ${env.EMS_CLIENT_VERSION}
                        HOSPITAL_SERVER_VERSION: ${env.HOSPITAL_SERVER_VERSION}
                        HOSPITAL_CLIENT_VERSION: ${env.HOSPITAL_CLIENT_VERSION}
                        STORAGE_SERVER_VERSION:  ${env.STORAGE_SERVER_VERSION}
                        STORAGE_CLIENT_VERSION:  ${env.STORAGE_CLIENT_VERSION}
                        ── Deployment Path ──────────────────────────
                        IMAGES_VERSIONS param:   ${params.IMAGES_VERSIONS ?: '(empty)'}
                    """
                }
            }
        }

        stage("Init Swarm If Needed") {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker info --format '{{.Swarm.LocalNodeState}}' | grep -qw active || docker swarm init"
                    } else {
                        bat 'docker info --format "{{.Swarm.LocalNodeState}}" | findstr "active" || docker swarm init'
                    }
                }
            }
        }

        stage("Setup Swarm Secrets") {
            steps {
                withCredentials([
                    file(credentialsId: 'EMS_PRODUCTION_ENV',        variable: 'EMS_PRODUCTION_ENV'),
                    file(credentialsId: 'HOSPITAL_PRODUCTION_ENV',   variable: 'HOSPITAL_PRODUCTION_ENV'),
                    file(credentialsId: 'STORAGE_PRODUCTION_ENV',    variable: 'STORAGE_PRODUCTION_ENV'),
                    string(credentialsId: 'MYSQL_ROOT_PASSWORD',     variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'MYSQL_PASSWORD',          variable: 'MYSQL_PASSWORD')
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                docker secret inspect MYSQL_ROOT_PASSWORD         > /dev/null 2>&1 || echo "$MYSQL_ROOT_PASSWORD"     | docker secret create MYSQL_ROOT_PASSWORD -
                                docker secret inspect MYSQL_PASSWORD              > /dev/null 2>&1 || echo "$MYSQL_PASSWORD"          | docker secret create MYSQL_PASSWORD -
                                docker secret inspect prod_ems_server_config      > /dev/null 2>&1 || docker secret create prod_ems_server_config      "$EMS_PRODUCTION_ENV"
                                docker secret inspect prod_hospital_server_config > /dev/null 2>&1 || docker secret create prod_hospital_server_config "$HOSPITAL_PRODUCTION_ENV"
                                docker secret inspect prod_storage_server_config  > /dev/null 2>&1 || docker secret create prod_storage_server_config  "$STORAGE_PRODUCTION_ENV"
                            '''
                        }
                    }
                }
            }
        }

        // ── STAGING ────────────────────────────────────────────────────────────
        // Scenario: stack running + no images → full stack deploy as it assume change was in stack configuration
        // Scenario: stack not running → full stack deploy (fresh or first time)
        stage("Deploy Stack to Staging") {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    // Run when: stack not running (any scenario without images)
                    //        OR: stack running but no images provided (infra-only change)
                    return env.STAGING_STACK_EXISTS == 'no' || noImagesProvided
                }
            }
            steps {
                dir('Websites') {
                    script {
                        if (isUnix()) {
                            sh """
                                ${exportEnvVarsUnix()}
                                docker compose -f docker-compose.staging.yml pull
                                envsubst < docker-compose.staging.yml > /tmp/resolved-staging.yml
                                docker stack deploy -c /tmp/resolved-staging.yml staging_stack
                                rm /tmp/resolved-staging.yml
                            """
                        } else {
                            bat """
                                ${exportEnvVarsWindows()}
                                docker compose -f docker-compose.staging.yml pull
                                docker compose -f docker-compose.staging.yml config > resolved-staging.yml
                                docker stack deploy -c resolved-staging.yml staging_stack
                                del resolved-staging.yml
                            """
                        }
                    }
                }
            }
        }

        // Scenario: stack running + specific images provided → targeted service update only
        stage("Targeted Update: Staging") {
            when {
                expression {
                    def imagesProvided = params.IMAGES_VERSIONS?.trim() && params.IMAGES_VERSIONS != '{}'
                    return env.STAGING_STACK_EXISTS == 'yes' && imagesProvided
                }
            }
            steps {
                script {
                    updateServices("staging_stack", readJSON(text: params.IMAGES_VERSIONS))
                }
            }
        }

        stage('Approve to Run Tests on Staging') {
            steps {
                script {
                    def userInput = input(
                        id: 'approveTests',
                        message: "Approve to run tests on staging?",
                        parameters: [booleanParam(defaultValue: true, description: '', name: 'Yes')]
                    )
                    if (userInput) {
                        build job: 'test_staging'
                    }
                }
            }
        }

        stage('Done with Staging - Approve to Delete Staging') {
            steps {
                script {
                    def userInput = input(
                        id: 'approveStagingDelete',
                        message: "Approve to delete staging?",
                        parameters: [booleanParam(defaultValue: true, description: '', name: 'Yes')]
                    )
                    if (userInput) {
                        sh "docker stack rm staging_stack || true"
                    }
                }
            }
        }

        stage("Approval to Deploy Production") {
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: "Staging looks good?", ok: "Deploy to Production"
                }
            }
        }

        // ── PRODUCTION ─────────────────────────────────────────────────────────
        //
        // Same logic mirrors staging exactly
        stage("Deploy Stack to Production") {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    return env.PRODUCTION_STACK_EXISTS == 'no' || noImagesProvided
                }
            }
            steps {
                dir('Websites') {
                    script {
                        if (isUnix()) {
                            sh """
                                ${exportEnvVarsUnix()}
                                docker compose -f docker-compose.prod.yml pull
                                envsubst < docker-compose.prod.yml > /tmp/resolved-prod.yml
                                docker stack deploy -c /tmp/resolved-prod.yml production_stack
                                rm /tmp/resolved-prod.yml
                            """
                        } else {
                            bat """
                                ${exportEnvVarsWindows()}
                                docker compose -f docker-compose.prod.yml pull
                                docker compose -f docker-compose.prod.yml config > resolved-prod.yml
                                docker stack deploy -c resolved-prod.yml production_stack
                                del resolved-prod.yml
                            """
                        }
                    }
                }
            }
        }

        stage("Targeted Update: Production") {
            when {
                expression {
                    def imagesProvided = params.IMAGES_VERSIONS?.trim() && params.IMAGES_VERSIONS != '{}'
                    return env.PRODUCTION_STACK_EXISTS == 'yes' && imagesProvided
                }
            }
            steps {
                script {
                    updateServices("production_stack", readJSON(text: params.IMAGES_VERSIONS))
                }
            }
        }
    }

    post {
        failure { echo "Pipeline failed — production was NOT updated" }
        success { echo "Successfully deployed to production" }
    }
}