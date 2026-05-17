// ── Global Helper Functions ────────────────────────────────────────────────

// Maps full image name (without tag) → Kubernetes deployment name
def imageNameToDeployment = [
    "baraamohamed/gradproj:ems-server"      : "ems-server-deployment",
    "baraamohamed/gradproj:ems-client"      : "ems-client-deployment",
    "baraamohamed/gradproj:hospital-server" : "hospital-server-deployment",
    "baraamohamed/gradproj:hospital-client" : "hospital-client-deployment",
    "baraamohamed/gradproj:storage-server"  : "storage-server-deployment",
    "baraamohamed/gradproj:storage-client"  : "storage-client-deployment"
]

// Maps full image name → Jenkins env var name
def imageNameToENV = [
    "baraamohamed/gradproj:ems-server"      : "EMS_SERVER_VERSION",
    "baraamohamed/gradproj:ems-client"      : "EMS_CLIENT_VERSION",
    "baraamohamed/gradproj:hospital-server" : "HOSPITAL_SERVER_VERSION",
    "baraamohamed/gradproj:hospital-client" : "HOSPITAL_CLIENT_VERSION",
    "baraamohamed/gradproj:storage-server"  : "STORAGE_SERVER_VERSION",
    "baraamohamed/gradproj:storage-client"  : "STORAGE_CLIENT_VERSION"
]
// image 
def deploymentToContainerNames = [
                        'ems-client-deployment': 'ems-client',
                        'hospital-client-deployment': 'hospital-client',
                        'storage-client-deployment': 'storage-client',
                        'ems-server-deployment': 'ems-server',
                        'hospital-server-deployment': 'hospital-server',
                        'storage-server-deployment': 'storage-server'
                    ]

// Push resolved versions into Jenkins env vars so manifests and later stages can read them
def setEnvVersions(Map versions) {
    def envMapping = [
        EMS_SERVER_VERSION      : "baraamohamed/gradproj:ems-server",
        EMS_CLIENT_VERSION      : "baraamohamed/gradproj:ems-client",
        HOSPITAL_SERVER_VERSION : "baraamohamed/gradproj:hospital-server",
        HOSPITAL_CLIENT_VERSION : "baraamohamed/gradproj:hospital-client",
        STORAGE_SERVER_VERSION  : "baraamohamed/gradproj:storage-server",
        STORAGE_CLIENT_VERSION  : "baraamohamed/gradproj:storage-client"
    ]
    envMapping.each { envKey, imageKey ->
        env.setProperty(envKey, versions[imageKey] ?: '')
    }
}

// Returns Map of imageName → currently running tag for every deployment in the given namespace.
// Mirrors getCurrentRunningVersions() from the Swarm pipeline.
// kubectl get deployment <name> -n <ns> -o jsonpath='{.spec.template.spec.containers[0].image}'
// returns something like: baraamohamed/gradproj:ems-server-1.2.3
// We split on the last '-' to separate image-name from version tag.
def getCurrentRunningVersions(String namespace, Map<String, String> deploymentToContainerNames) {
    def currentVersions = [:]

    deploymentToContainerNames.each { deploymentName ->
        def image = sh(
            script: """
                kubectl get deployment ${deploymentName} -n ${namespace} \
                    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo ''
            """,
            returnStdout: true
        ).trim()

        if (!image) return

        // remove digest
        def tag = image.split('@')[0]

        // separate name from ems-server-1.0.0 → ems and server and 1.0.0
        def parts = tag.tokenize('-')
        // version is always last part
        def version = parts.last()
        // name is everything except version part joined with '-' again to support names with dashes like ems-server
        def imageName = parts.subList(0, parts.size() - 1).join('-')  // everything except last

        currentVersions[imageName] = version
    }

    return currentVersions
}

// Mirrors checkVersions() from the Swarm pipeline.
// Decides what should be updated vs newly created.
def checkVersions(Map imagesMapFromParam, Map currentRunningVersions) {
    def resolvedVersions = [:]
    def imagesToCreate   = [:]

    imagesMapFromParam.each { image, version ->
        def fromParam   = version
        def fromRunning = currentRunningVersions[image]

        echo "Checking ${image}: param=${fromParam ?: '(none)'}, running=${fromRunning ?: '(none)'}"

        if (fromParam && fromRunning) {
            resolvedVersions[image] = fromParam       // update to requested version
        } else if (fromParam && !fromRunning) {
            imagesToCreate[image] = fromParam          // deployment missing → create
        } else if (!fromParam && fromRunning) {
            resolvedVersions[image] = fromRunning      // keep current version, still track it
        }
        // !fromParam && !fromRunning → nothing to do
    }

    return [resolvedVersions: resolvedVersions, imagesToCreate: imagesToCreate]
}

// Mirrors upsertDeployments() from the Swarm pipeline.
// Updates existing deployments and creates missing ones via kubectl.
def upsertDeployments(
    String namespace,
    Map resolvedVersions,   // image → version  (deployment already exists)
    Map imagesToCreate,     // image → version  (deployment does not exist yet)
    Map imageNameToDeployment,
    Map deploymentToContainerNames
) {
    // ── Update existing deployments ──────────────────────────────────────────
    resolvedVersions.each { image, version ->
        def deploymentName = imageNameToDeployment[image]
        if (!deploymentName) {
            echo "No deployment mapping found for ${image}, skipping update"
            return
        }

        def exists = sh(
            script: "kubectl get deployment ${deploymentName} -n ${namespace} > /dev/null 2>&1 && echo yes || echo no",
            returnStdout: true
        ).trim()

        if (exists == 'yes' && deploymentToContainerNames[deploymentName]) {
            // ‘update deployment image and watch rollout status’ is the k8s equivalent of ‘docker service update --image’ + waiting for it to be running
            sh """
                kubectl set image deployment/${deploymentName} \
                    ${deploymentToContainerNames[deploymentName]}=${image}-${version} \
                    -n ${namespace}
                kubectl rollout status deployment/${deploymentName} -n ${namespace} --timeout=120s
            """
        } else {
            echo "Deployment ${deploymentName} not found in ${namespace}, skipping update"
        }
    }

    // ── Create missing deployments from manifests ────────────────────────────
    imagesToCreate.each { image, version ->
        def deploymentName = imageNameToDeployment[image]
        if (!deploymentName) {
            echo "No deployment mapping found for ${image}, skipping create"
            return
        }

        def exists = sh(
            script: "kubectl get deployment ${deploymentName} -n ${namespace} > /dev/null 2>&1 && echo yes || echo no",
            returnStdout: true
        ).trim()

        if (exists == 'no' && deploymentToContainerNames[deploymentName]) {
            sh """
                kubectl create deployment ${deploymentName} -n ${namespace} --image=${image}-${version}
            """
        } else {
            echo "Deployment ${deploymentName} already exists in ${namespace}, will update instead"
            sh """
                kubectl set image deployment/${deploymentName} ${deploymentToContainerNames[deploymentName]}=${image}-${version} -n ${namespace}
            """
        }
    }
}


// ── Global pipeline-level state ───────────────────────────────────────────
def resolvedVersions  = [:]
def imagesToCreate    = [:]

// ── Pipeline ──────────────────────────────────────────────────────────────
pipeline {

    agent any

    parameters {
        string(
            name: 'IMAGES_VERSIONS',
            defaultValue: '',
            description: 'JSON map of image → version e.g. {"baraamohamed/gradproj:ems-server":"1.2.3"}. Empty = full stack deploy. Partial = targeted update.'
        )
    }

    environment {
        MYSQL_DATABASE = 'ems_db'
        MYSQL_USER     = 'appuser'
        NODE_ENV       = 'production'
        STAGING_NS     = 'staging'
        PRODUCTION_NS  = 'production'
    }

    stages {

        // ── 1. Checkout ────────────────────────────────────────────────────
        stage('Checkout') {
            
                steps {
                    git branch: 'master',
                            url: 'https://github.com/BaraaMohamed2311/Graduation-Project.git'
                }
        }

        // ── 2. Validate Node ───────────────────────────────────────────────
        // Ensures the agent can reach the cluster and has kubectl + a valid context.
        // Mirrors "Init Swarm If Needed" — we can't init k8s, but we verify connectivity.
        stage('Check Valid Node') {
            steps {
                script {
                    sh '''
                        kubectl version --client
                        kubectl cluster-info
                        kubectl get nodes
                        kubectl config current-context
                        
                    '''
                }
            }
        }




        // ── 3. Resolve Versions & Stack State ─────────────────────────────

        stage('Get App Versions') {
            steps {
                script {
                    def imagesMapParam = params.IMAGES_VERSIONS?.trim() && params.IMAGES_VERSIONS != '{}'
                        ? readJSON(text: params.IMAGES_VERSIONS)
                        : [:]

                    // Does the staging / production namespace already have running deployments?
                    env.STAGING_EXISTS = (sh(
                        script: "kubectl get namespace ${env.STAGING_NS}",
                        returnStatus: true
                    ) == 0) ? 'yes' : 'no'

                    env.PRODUCTION_EXISTS = sh(
                        script: "kubectl get namespace ${env.PRODUCTION_NS}",
                        returnStatus: true
                    ) == 0 ? 'yes' : 'no'
                    

                    

                    def currentRunning = getCurrentRunningVersions(env.PRODUCTION_NS, deploymentToContainerNames)
                    echo "Current running versions in ${env.PRODUCTION_NS}: ${currentRunning}"

                    def result = checkVersions(imagesMapParam, currentRunning)
                    resolvedVersions = result.resolvedVersions
                    imagesToCreate   = result.imagesToCreate

                    setEnvVersions(resolvedVersions + imagesToCreate)

                    echo """
                        ── Namespace State ──────────────────────────────────
                        STAGING_EXISTS:          ${env.STAGING_EXISTS}
                        PRODUCTION_EXISTS:       ${env.PRODUCTION_EXISTS}
                        ── Resolved Versions ────────────────────────────────
                        EMS_SERVER_VERSION:      ${env.EMS_SERVER_VERSION}
                        EMS_CLIENT_VERSION:      ${env.EMS_CLIENT_VERSION}
                        HOSPITAL_SERVER_VERSION: ${env.HOSPITAL_SERVER_VERSION}
                        HOSPITAL_CLIENT_VERSION: ${env.HOSPITAL_CLIENT_VERSION}
                        STORAGE_SERVER_VERSION:  ${env.STORAGE_SERVER_VERSION}
                        STORAGE_CLIENT_VERSION:  ${env.STORAGE_CLIENT_VERSION}
                        ── Deployment Path ──────────────────────────────────
                        IMAGES_VERSIONS param:   ${params.IMAGES_VERSIONS ?: '(empty)'}
                        Deployments to update:   ${resolvedVersions.keySet().join(', ') ?: 'None'}
                        Deployments to create:   ${imagesToCreate.keySet().join(', ') ?: 'None'}
                    """
                }
            }
        }

        // ── 4. Create namespace Required by secrets, configmaps deployments ** AFTER CHECKING ITS EXISTENCE AND STORING RESULT IN THE ENV VAR **────────────────────────────────────────
        
        stage('Create Staging namespace if not exists') {
            when {
                expression {
                    return env.STAGING_EXISTS == 'no'
                }
            }
            steps {
                dir('Kubernetes/remote/') {
                    sh """
                        kubectl create namespace ${env.STAGING_NS} --dry-run=client -o yaml | kubectl apply -f -
                    """ 
                }
                
            }
        }


        // ── 5.   Secrets ────────────────────────────────────────
        // secret files at jenkins credentials store → Kubernetes secrets (if not already created)
        // example all servers env files: EMS_PRODUCTION_ENV, HOSPITAL_PRODUCTION_ENV, STORAGE_PRODUCTION_ENV
        // do this for both staging and production since they share the same secrets 
        stage('Check ConfigMaps and Secrets in Staging') {
            steps {
                withCredentials([
                    file  (credentialsId: 'EMS_PRODUCTION_ENV',      variable: 'EMS_PRODUCTION_ENV'),
                    file  (credentialsId: 'HOSPITAL_PRODUCTION_ENV', variable: 'HOSPITAL_PRODUCTION_ENV'),
                    file  (credentialsId: 'STORAGE_PRODUCTION_ENV',  variable: 'STORAGE_PRODUCTION_ENV'),
                    string(credentialsId: 'MYSQL_ROOT_PASSWORD',     variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'MYSQL_PASSWORD',          variable: 'MYSQL_PASSWORD')
                ]) {
                    // command creates secret as file of env variables instead of creating individual key-value pairs files
                    sh '''
                        
                        kubectl -n staging create secret generic prod-ems-server-config \
                            --from-file=prod_ems_server_config="$EMS_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl -n staging create secret generic prod-hospital-server-config \
                            --from-file=prod_hospital_server_config="$HOSPITAL_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl -n staging create secret generic prod-storage-server-config \
                            --from-file=prod_storage_server_config="$STORAGE_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        // ── 6. ConfigMaps.yml & Secrets.yml ────────────────────────────────────────
        
        stage('Apply infrastructure ConfigMaps and Secrets') {
            steps {
                dir('Kubernetes/remote/') {
                    // explictly call file names and avoid to use -R or --recursive otherwise it will try to apply all files in the directory including the deployment files which will cause issues if we have images to create and we are applying deployment files that reference those images before creating them
                    sh """
                        kubectl apply -n staging -f configmaps.yml
                        kubectl apply -n staging  -f secrets.yml
                    """ 
                }
                
            }
        }

        // ── 6a. Staging: First-Time Full Deploy (no namespace deployments AND no param) ──
        // Scenario: Namespace not exists + no images provided → Ask user for versions and full stack deploy (first time deploy)
        // Scenario: Namespace not exists + images provided → Ask only for missing versions and full stack deploy 
        // Scenario: Namespace exists update or create services based on provided versions in param
        // Scenario: Namespace is exists but no images provided in param -> Do nothing to avoid breaking or experiencing downtime for all services
        stage('Full Deploy to Staging — First Time') {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    echo "No images provided in param: ${noImagesProvided} , STAGING_EXISTS: ${env.STAGING_EXISTS}"
                    return env.STAGING_EXISTS == 'no' && noImagesProvided
                }
            }
            steps {
                script {
                    // Ask for each missing version individually (same UX as Swarm pipeline)
                    def missing = [:]
                    // detect missing env vars
                    imageNameToENV.each { _, envVar ->
                        if (!env.getProperty(envVar)?.trim()) {
                            missing[envVar] = ''
                        }
                    }

                    // create one list of inputs for all missing versions, instead of asking one by one, to speed up the process for the user
                    def inputs = input(
                        message: "Provide image versions for full deploy",
                        parameters: missing.keySet().collect { key ->
                            string(
                                name: key,
                                defaultValue: '',
                                description: "Enter version for ${key}"
                            )
                        }
                    )
                    // set env vars for all missing versions
                    missing.keySet().each { key ->
                        env.setProperty(key, inputs[key])
                    }
                
                
                    dir('Kubernetes/remote/staging') {
                        script {
                            // create deployments for all provided versions (both from param and user input) — same as first-time full deploy
                            sh """
                                for f in \$(find . -type f \\( -name '*.yml' -o -name '*.yaml' \\)); do
                                envsubst < "\$f" | kubectl apply -n ${STAGING_NS} -f -
                                done
                                """
                        }
                    }
                }
                
            }
        }

        // ── 6b. Staging: Partial Param Deploy, Namespace Empty ─────────────
        // Scenario: Stack not running + some images provided or none is provided → Ask only for missing versions and full stack deploy
        stage('Full Deploy to Staging — Partial Param') {
            when {
                expression {
                     def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                     echo "No images provided in param: ${noImagesProvided} , STAGING_EXISTS: ${env.STAGING_EXISTS}"
                    return env.STAGING_EXISTS == 'no' && !noImagesProvided
                }
            }
            steps {

                // Ask for missing versions
                script {
                        // ask for missing versions that weren't provided in the param nor currently running 
                        def missing = [:]
                        // detect missing env vars
                        imageNameToENV.each { _, envVar ->
                            if (!env.getProperty(envVar)?.trim()) {
                                missing[envVar] = ''
                            }
                        }

                        if (missing) {
                            def inputs = input(
                                message: "Provide missing image versions",
                                parameters: missing.keySet().collect { key ->
                                    string(
                                        name: key,
                                        defaultValue: '',
                                        description: "Enter version for ${key}"
                                    )
                                }
                            )

                            missing.keySet().each { key ->
                                env.setProperty(key, inputs[key])
                            }
                        }
                }

                dir('Kubernetes/remote/staging') {
                        script {
                            // create deployments for all provided versions (both from param and user input) — same as first-time full deploy
                            sh """
                                for f in \$(find . -type f \\( -name '*.yml' -o -name '*.yaml' \\)); do
                                envsubst < "\$f" | kubectl apply -n ${env.STAGING_NS} -f -
                                done
                                """
                        }
                    }
            }
        }

        // ── 6c. Staging: Targeted Update/Create (namespace running AND param given) ──
        // Mirrors: "Targeted Update/Deployment: Staging"
        stage('Targeted Update — Staging') {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    echo "No images provided in param: ${noImagesProvided} , STAGING_EXISTS: ${env.STAGING_EXISTS}"
                    return env.STAGING_EXISTS == 'yes' && !noImagesProvided
                }
            }
            steps {
                script {
                    upsertDeployments(env.STAGING_NS, resolvedVersions, imagesToCreate, imageNameToDeployment , deploymentToContainerNames)
                }
            }
        }

        // ── 7. Run K6 Tests on Staging ────────────────────────────────────
        // Mirrors: "Approve to Run Tests on Staging" + triggering the test job.
        // Runs K6 directly via kubectl Job so tests execute inside the cluster,
        // with access to internal ClusterIP services (no Ingress required).
        stage('Run K6 Tests') {
            steps {
                script {
                    def approve = input(
                        id: 'approveTests',
                        message: 'Approve to run K6 tests on staging?',
                        parameters: [booleanParam(defaultValue: true, description: '', name: 'Yes')]
                    )

                    if (approve) {
                        // Option A: trigger an existing Jenkins job (matches Swarm pipeline exactly)
                        build job: 'test_staging'
                    }
                }
            }
        }

        // ── 8. Teardown Staging ────────────────────────────────────────────
        // Mirrors: "Done with Staging - Approve to Delete Staging"
        // Deletes all workloads in the staging namespace (keeps the namespace itself).
        stage('Approve to Delete Staging') {
            steps {
                script {
                    def approve = input(
                        id: 'approveStagingDelete',
                        message: 'Staging tests passed — approve to tear down staging?',
                        parameters: [booleanParam(defaultValue: true, description: '', name: 'Yes')]
                    )
                    if (approve) {
                        // delete namespace and resources
                        // it's necessary to delete the namespace itself not just the resources, because CD script relies on it.
                        sh "kubectl delete namespace ${env.STAGING_NS}"
                        
                    }
                }
            }
        }

        // ── 9. Gate: Human Approval for Production ────────────────────────
        // Mirrors: "Approval to Deploy Production"
        stage('Approve Production Deployment') {
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: 'Staging looks good — deploy to production?', ok: 'Deploy to Production'
                }
            }
        }

        stage('Create Production namespace if not exists') {
            when {
                expression {
                    return env.PRODUCTION_EXISTS == 'no'
                }
            }
            steps {
                dir('Kubernetes/remote/') {
                    sh """
                        kubectl create namespace ${env.PRODUCTION_NS} --dry-run=client -o yaml | kubectl apply -f -
                    """ 
                }
                
            }
        }

        stage('Check ConfigMaps and Secrets in production') {
            steps {
                withCredentials([
                    file  (credentialsId: 'EMS_PRODUCTION_ENV',      variable: 'EMS_PRODUCTION_ENV'),
                    file  (credentialsId: 'HOSPITAL_PRODUCTION_ENV', variable: 'HOSPITAL_PRODUCTION_ENV'),
                    file  (credentialsId: 'STORAGE_PRODUCTION_ENV',  variable: 'STORAGE_PRODUCTION_ENV'),
                    string(credentialsId: 'MYSQL_ROOT_PASSWORD',     variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'MYSQL_PASSWORD',          variable: 'MYSQL_PASSWORD')
                ]) {
                    // command creates secret as file of env variables instead of creating individual key-value pairs files
                    sh '''
                        kubectl -n production create secret generic prod-ems-server-config \
                            --from-file=prod_ems_server_config="$EMS_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl -n production create secret generic prod-hospital-server-config \
                            --from-file=prod_hospital_server_config="$HOSPITAL_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl -n production create secret generic prod-storage-server-config \
                            --from-file=prod_storage_server_config="$STORAGE_PRODUCTION_ENV" \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Apply infrastructure ConfigMaps and Secrets in production') {
            steps {
                dir('Kubernetes/remote/') {
                    // explictly call file names and avoid to use -R or --recursive otherwise it will try to apply all files in the directory including the deployment files which will cause issues if we have images to create and we are applying deployment files that reference those images before creating them
                    sh """
                        kubectl apply -n production -f configmaps.yml
                        kubectl apply -n production  -f secrets.yml
                    """ 
                }
                
            }
        }

        // ── 10a. Production: Full Deploy (namespace empty) ─────────────────
        // Mirrors: "Deploy Stack to Production" (stack not running)
        // Reuses the same env vars set during staging resolution.
        stage('Deploy Production — Full') {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    echo "No images provided in param: ${noImagesProvided} , PRODUCTION_EXISTS: ${env.PRODUCTION_EXISTS}"
                    return env.PRODUCTION_EXISTS == 'no' && noImagesProvided
                }
            }
            steps {
            
                    dir('Kubernetes/remote/production') {
                            // create deployments for all provided versions (both from param and user input) — same as first-time full deploy
                            sh """
                                for f in \$(find . -type f \\( -name '*.yml' -o -name '*.yaml' \\)); do
                                envsubst < "\$f" | kubectl apply -n ${env.PRODUCTION_NS} -f -
                                done
                                """
                        
                    }
            }
        }

        // ── 10b. Production: Targeted Update (namespace has running deployments) ──
        // Mirrors: "Targeted Update: Production"
        stage('Targeted Update — Production') {
            when {
                expression {
                    def noImagesProvided = !params.IMAGES_VERSIONS?.trim() || params.IMAGES_VERSIONS == '{}'
                    echo "No images provided in param: ${noImagesProvided} , PRODUCTION_EXISTS: ${env.PRODUCTION_EXISTS}"
                    return env.PRODUCTION_EXISTS == 'yes' && !noImagesProvided
                }
            }
            steps {
                script {
                    upsertDeployments(env.PRODUCTION_NS, resolvedVersions, imagesToCreate, imageNameToDeployment, deploymentToContainerNames)
                }
            }
        }

    } // end stages

    post {
        failure { echo 'Pipeline failed — production was NOT updated' }
        success { echo 'Successfully deployed to production' }
    }
}