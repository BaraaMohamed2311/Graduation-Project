// Global helper functions

// exports to exist on deployment shell, not pipeline env, so we can use them in docker stack deploy commands
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
// Set Jenkins env to versions 
def setEnvVersions(versions){

    def envMapping = [
        EMS_SERVER_VERSION      : 'ems-server',
        EMS_CLIENT_VERSION      : 'ems-client',
        HOSPITAL_SERVER_VERSION : 'hospital-server',
        HOSPITAL_CLIENT_VERSION : 'hospital-client',
        STORAGE_SERVER_VERSION  : 'storage-server',
        STORAGE_CLIENT_VERSION  : 'storage-client'
    ]

    envMapping.each { envKey, imageKey ->
    // sets env object in Jenkinsfile context to the version if exist in versions map or empty string if not found (to avoid nulls)
        env[envKey] = versions[imageKey] ?: ''
    }

} 

// Deployment logic functions
def updateServices(String stackPrefix, Map resolvedVersions , Map servicesToCreate, Map imageNameToServiceName) {

        // check if service exists before trying to update
        resolvedVersions.each { image, version ->
                def serviceSuffix = imageNameToServiceName[image]
                if (!serviceSuffix) {
                    echo "No service mapping found for image ${image}, skipping update for this image"
                    return
                }
            sh """
                docker service inspect ${stackPrefix}_${serviceSuffix} > /dev/null 2>&1 && \
                docker service update --image ${image}-${version} ${stackPrefix}_${serviceSuffix}

            """
        }
        
        // service is known but not running, then deploy it as new with the provided version
        servicesToCreate.each { image, version ->
                def serviceSuffix = imageNameToServiceName[image]
                if (!serviceSuffix) {
                    echo "No service mapping found for image ${image}, skipping deploy for this image"
                    return
                }
                // --label com.docker.stack.namespace= is needed to make sure the service is part of the stack 
            sh """
                docker service inspect ${stackPrefix}_${serviceSuffix} > /dev/null 2>&1 || \
                docker service create --name ${stackPrefix}_${serviceSuffix} --label com.docker.stack.namespace=${stackPrefix} ${image}-${version}
            """
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
// uses helper function getCurrentVersion to just get current running version
def checkVersions(Map imagesMapFromParam, String stackPrefix, Map currentRunningVersion) {
    
    def resolvedVersions  = [:]  // image → resolved version (param or service)
    def servicesToCreate  = [:]   // images with no version from either source
    // Param is the source of truth so we loop on it
    imagesMapFromParam.each { image, version ->
        def fromParam   = version
        def fromService = currentRunningVersion[image]
        // add version to resolvedVersions if found at both parameter and current running service
        // this includes the case where they are the same (targeted update) or different (full stack deploy with param override) but param takes precedence in both cases
        // we redeploy if they are the same since it was explicitly provided in the param which means we want to ensure that version is running even if it was already running (e.g. redeploying same version with new stack config)
        if (fromParam && fromService) {
            resolvedVersions[image] = version  // param takes precedence
        }
        // if  only param exist then we will deploy service with the provided version
        else if (fromParam && !fromService) {
            servicesToCreate[image] = version
        }
    }

    return [resolvedVersions: resolvedVersions, servicesToCreate: servicesToCreate]
}
// uses services to get current image version of each mapped as imageName -> version
def getCurrentRunningVersions(String stackPrefix, List services) {
    
    def currentVersions = [:]
    services.each { serviceSuffix -> 
        def image = sh(
        script: "docker service inspect ${stackPrefix}_${serviceSuffix} --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo ''",
        returnStdout: true
        ).trim()
        if (!image) return null
        image = image.split('@')[0]
        def parts = image.tokenize(':')
        if (parts.size() < 2) return null
        currentVersions[image] = parts[1].tokenize('-').last()
    }
    return currentVersions
    
}
// -------------------------------------------------------
// Global Variables
def resolvedVersions = [:]  // image → resolved version (param or service)  
def servicesToCreate =  [:]   // images -> version of service not running and will be deployed as new if provided in param
def imageNameToServiceName = [  // to map image name to service name for update command
    "ems-server"      : "ems_server",
    "ems-client"      : "ems_client",
    "hospital-server" : "hospital_server",
    "hospital-client" : "hospital_client",
    "storage-server"  : "storage_server",
    "storage-client"  : "storage_client"
]

// -------------------------------------------------------
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



    stage("Check Versions and Stack State") {
            steps {
                script {
                    // read image versoion map from param if provided
                    def imagesMapParam = params.IMAGES_VERSIONS?.trim() ? readJSON(text: params.IMAGES_VERSIONS) : [:]


                    // ── Check Stack existence And Store as env ──────────────────────────────────────
                    //  list all stacks, grep -q quite check do not return anything -w word match, echo yeso and return to env, trim to remove newlines
                    env.STAGING_STACK_EXISTS = sh(
                        script: "docker stack ls --format '{{.Name}}' | grep -qw staging_stack && echo yes || echo no",
                        returnStdout: true
                    ).trim()

                    env.PRODUCTION_STACK_EXISTS = sh(
                        script: "docker stack ls --format '{{.Name}}' | grep -qw production_stack && echo yes || echo no",
                        returnStdout: true
                    ).trim()


                    // ── Check what we have vs what's missing ───────────────────────
                    def services = [
                            "ems_server",
                            "ems_client",
                            "hospital_server",
                            "hospital_client",
                            "storage_server" ,
                            "storage_client" ,
                        ]

                        def currentRunningVersions = getCurrentRunningVersions("staging_stack", services)
                        def result = checkVersions(imagesMapParam, "staging_stack", currentRunningVersions)

                        resolvedVersions = result.resolvedVersions   
                        servicesToCreate = result.servicesToCreate

                        // Set Jenkins env vars for versions to be used in stack deploy (for both full stack and targeted updates)
                        setEnvVersions(resolvedVersions + servicesToCreate)  // merge maps to set all versions in env, resolvedVersions take precedence over servicesToCreate if any overlap (should not happen as they are mutually exclusive by logic)

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
        stage("Targeted Update/Deployment: Staging") {
            when {
                expression {
                    def imagesProvided = params.IMAGES_VERSIONS?.trim() && params.IMAGES_VERSIONS != '{}'
                    return env.STAGING_STACK_EXISTS == 'yes' && imagesProvided
                }
            }
            steps {
                script {
                    updateServices("staging_stack", resolvedVersions, servicesToCreate,imageNameToServiceName)
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
                    updateServices("production_stack", resolvedVersions, servicesToCreate,imageNameToServiceName)
                }
            }
        }
    }

    post {
        failure { echo "Pipeline failed — production was NOT updated" }
        success { echo "Successfully deployed to production" }
    }
