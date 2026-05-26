// ── Global Helper Functions ────────────────────────────────────────────────

// Shared pipeline vars
def resolvedVersions = [:]
def imagesToCreate = [:]

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

// Maps image → Helm release
def imageNameToHelmRelease = [
    "baraamohamed/gradproj:ems-server"      : "ems",
    "baraamohamed/gradproj:ems-client"      : "ems",
    "baraamohamed/gradproj:hospital-server" : "hospital",
    "baraamohamed/gradproj:hospital-client" : "hospital",
    "baraamohamed/gradproj:storage-server"  : "storage",
    "baraamohamed/gradproj:storage-client"  : "storage"
]

// Maps image → Helm values path
def imageNameToHelmValuePath = [
    "baraamohamed/gradproj:ems-server"      : "images.ems.images.ems_server_image",
    "baraamohamed/gradproj:ems-client"      : "images.ems.images.ems_client_image",
    "baraamohamed/gradproj:hospital-server" : "images.hospital.images.hospital_server_image",
    "baraamohamed/gradproj:hospital-client" : "images.hospital.images.hospital_client_image",
    "baraamohamed/gradproj:storage-server"  : "images.storage.images.storage_server_image",
    "baraamohamed/gradproj:storage-client"  : "images.storage.images.storage_client_image"
]

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

def checkVersions(Map fromImageParam, Map fromCurrentRunning) {

    def resolvedVersions = [:]
    def imagesToCreate = [:]

    fromImageParam.each { imageName, version ->

        def fromParam   = version
        def fromRunning = fromCurrentRunning[imageName]



        if (fromParam && fromRunning) {
            resolvedVersions[imageName] = fromParam
        }
        else if (fromParam && !fromRunning) {
            imagesToCreate[imageName] = fromParam
        }
        else if (!fromParam && fromRunning) {
            resolvedVersions[imageName] = fromRunning
        }
    }

    return [resolvedVersions, imagesToCreate]
}

def getCurrentRunningVersions(List deployments, String namespace) {

    def currentVersions = [:]

    deployments.each { deploymentName ->

        def image = sh(
            script: "kubectl get deployment ${deploymentName} -n ${namespace} -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true",
            returnStdout: true
        ).trim()

        if (!image) {
            echo "Deployment ${deploymentName} not found in ${namespace}, skipping"
            return  // skip this deployment, don't error
        }

        def lastDashIndex = image.lastIndexOf('-')
        def imageName = image.substring(0, lastDashIndex)
        def version   = image.substring(lastDashIndex + 1)

        currentVersions[imageName] = version
    }

    return currentVersions
}

def upsertDeploymentsHelm(
    String namespace,
    Map resolvedVersions,
    Map imagesToCreate,
    Map imageNameToHelmRelease,
    Map imageNameToHelmValuePath
) {

    def allImages = resolvedVersions + imagesToCreate

    allImages.each { image, version ->

        def releaseName = (namespace == "staging") ? "app-staging" :
                  (namespace == "production") ? "app-prod" :
                  imageNameToHelmRelease[image]
        def valuePath   = imageNameToHelmValuePath[image]

        if (!releaseName || !valuePath) {
            echo "No Helm mapping found for ${image}"
            return
        }

        def fullImageTag = "${image}-${version}"

        def releaseExists = sh(
            script: "helm status ${releaseName} -n ${namespace} > /dev/null 2>&1 && echo yes || echo no",
            returnStdout: true
        ).trim()

        if (releaseExists == 'yes') {

            sh """
                helm upgrade --install ${releaseName} ./Helm/app-chart/ \
                    --namespace ${namespace} \
                    --reuse-values \
                    --set ${valuePath}=${fullImageTag} \
                    --atomic \
                    --timeout 10m \
                    --description "Jenkins build #${env.BUILD_NUMBER}: update to ${version}"
            """

        } else {
            def valuesFile = (namespace == "staging") ? "staging-values.yml" :
                  (namespace == "production") ? "prod-values.yml" :
                  "values.yml"
            sh """
                helm install ${releaseName} ./Helm/app-chart/ \
                    --namespace ${namespace} \
                    --set ${valuePath}=${fullImageTag} \
                    -f ./Helm/app-chart/${valuesFile} \
                    --atomic \
                    --timeout 10m \
                    --description "Jenkins build #${env.BUILD_NUMBER}: initial install ${version}"
            """
        }
    }
}

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

        stage('Clone Repo') {
            steps {
                git branch: 'master', url: 'https://github.com/BaraaMohamed2311/Graduation-Project.git'
            }
        }

        stage('Check Helm') {
            steps {
                sh 'helm version'
            }
        }
                // ──  Resolve Versions ────────────────────────────────────────────────────────────────────────
        stage('Check Versions and Namespaces') {

            steps {

                script {

                    def imagesVersionsMap = params.IMAGES_VERSIONS?.trim()
                        ? readJSON(text: params.IMAGES_VERSIONS)
                        : [:]

                    echo "Received image versions: ${imagesVersionsMap}"

                    def currentRunningVersions = getCurrentRunningVersions(
                        imageNameToDeployment.values() as List,
                        env.PRODUCTION_NS
                    )

                    (resolvedVersions, imagesToCreate) =
                        checkVersions(imagesVersionsMap, currentRunningVersions)

                    setEnvVersions(resolvedVersions + imagesToCreate)

                    env.STAGING_EXISTS = sh(
                        script: "kubectl get namespace ${env.STAGING_NS} > /dev/null 2>&1 && echo yes || echo no",
                        returnStdout: true
                    ).trim()

                    env.PRODUCTION_EXISTS = sh(
                        script: "kubectl get namespace ${env.PRODUCTION_NS} > /dev/null 2>&1 && echo yes || echo no",
                        returnStdout: true
                    ).trim()

                    echo """
                    STAGING_EXISTS: ${env.STAGING_EXISTS}
                    PRODUCTION_EXISTS: ${env.PRODUCTION_EXISTS}

                    resolvedVersions: ${resolvedVersions}
                    imagesToCreate: ${imagesToCreate}
                    """
                }
            }
        }

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

        // ──  create Secrets and ConfigMaps ────────────────────────────────────────────────────────────────────────
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

                dir('Helm/') {

                    sh """

                        if ! helm status config-core -n ${env.STAGING_NS} > /dev/null 2>&1; then
                            helm install config-core ./config-chart \
                                --namespace ${env.STAGING_NS} \
                                --atomic \
                                --timeout 10m
                        else
                            echo "config-core already exists"
                        fi


                        if ! helm status secrets-core -n ${env.STAGING_NS} > /dev/null 2>&1; then
                            helm install secrets-core ./secrets-chart \
                                --namespace ${env.STAGING_NS} \
                                --atomic \
                                --timeout 10m
                        else
                            echo "secrets-core already exists"
                        fi

                    """
                }
            }
        }
            // ──  Deploy Staging  ────────────────────────────────────────────────────────────────────────
        stage('Staging Full Deploy') {

            when {
                expression {
                    return env.STAGING_EXISTS == 'no' 
                }
            }

            steps {

                script {

                    def missing = [:]

                    imageNameToENV.each { _, envVar ->
                        if (!env.getProperty(envVar)?.trim()) {
                            missing[envVar] = ''
                        }
                    }

                    if (missing) {

                        def inputs = input(
                            message: 'Provide image versions',
                            parameters: missing.keySet().collect { key ->
                                string(
                                    name: key,
                                    defaultValue: '',
                                    description: "Version for ${key}"
                                )
                            }
                        )

                        missing.keySet().each { key ->
                            env.setProperty(key, inputs[key])
                        }
                    }
                }

                dir('Helm/') {

                    script {
                        // we have to set the ports to make sure they dont conflict with production
                        def setArgs = [
                            "images.ems.images.ems_server_image=baraamohamed/gradproj:ems-server-${env.EMS_SERVER_VERSION}",
                            "images.ems.images.ems_client_image=baraamohamed/gradproj:ems-client-${env.EMS_CLIENT_VERSION}",
                            "images.hospital.images.hospital_server_image=baraamohamed/gradproj:hospital-server-${env.HOSPITAL_SERVER_VERSION}",
                            "images.hospital.images.hospital_client_image=baraamohamed/gradproj:hospital-client-${env.HOSPITAL_CLIENT_VERSION}",
                            "images.storage.images.storage_server_image=baraamohamed/gradproj:storage-server-${env.STORAGE_SERVER_VERSION}",
                            "images.storage.images.storage_client_image=baraamohamed/gradproj:storage-client-${env.STORAGE_CLIENT_VERSION}",
                        ].join(' \\\n --set ')

                        sh """
                            helm install app-staging ./app-chart \
                                --namespace ${env.STAGING_NS} \
                                --set ${setArgs} \
                                -f ./app-chart/staging-values.yaml \
                                --atomic \
                                --timeout 10m
                        """
                    }
                }
            }
        }

        stage('Staging Targeted Upsert') {

            when {
                expression {
                    def noImagesProvided =
                        !params.IMAGES_VERSIONS?.trim() ||
                        params.IMAGES_VERSIONS == '{}'

                    return env.STAGING_EXISTS == 'yes' && !noImagesProvided
                }
            }

            steps {

                script {

                    upsertDeploymentsHelm(
                        env.STAGING_NS,
                        resolvedVersions,
                        imagesToCreate,
                        imageNameToHelmRelease,
                        imageNameToHelmValuePath
                    )
                }
            }
        }
                // ──  Run Tests on Staging ────────────────────────────────────────────────────────────────────────
        stage('Run Tests on Staging') {

            steps {

                script {

                    def approve = input(
                        id: 'approveTests',
                        message: 'Approve running K6 tests?',
                        parameters: [
                            booleanParam(
                                defaultValue: true,
                                name: 'Yes'
                            )
                        ]
                    )

                    if (approve) {
                        build job: 'test_staging'
                    }
                }
            }
        }
        // ──  Delete Staging ────────────────────────────────────────────────────────────────────────
        stage('Delete Staging') {

            steps {

                script {

                    def approve = input(
                        id: 'approveStagingDelete',
                        message: 'Delete staging?',
                        parameters: [
                            booleanParam(
                                defaultValue: true,
                                name: 'Yes'
                            )
                        ]
                    )

                    if (approve) {
                        sh 'helm uninstall app-staging -n staging --keep-history'
                    }
                }
            }
        }
        // ──  Manual Approval ────────────────────────────────────────────────────────────────────────
        stage('Approve Production Deployment') {

            steps {

                timeout(time: 24, unit: 'HOURS') {

                    input(
                        message: 'Deploy to production?',
                        ok: 'Deploy'
                    )
                }
            }
        }
        // ──  create Production  Namespace ────────────────────────────────────────────────────────────────────────
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
        // ──  create Secrets and ConfigMaps ────────────────────────────────────────────────────────────────────────
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

        stage('Apply infrastructure ConfigMaps and Secrets (Production)') {

                steps {

                    dir('Helm/') {

                        sh """

                            if ! helm status config-core -n ${env.PRODUCTION_NS} > /dev/null 2>&1; then
                                helm install config-core ./config-chart \
                                    --namespace ${env.PRODUCTION_NS} \
                                    --atomic \
                                    --timeout 10m
                            else
                                echo "config-core already exists in production"
                            fi


                            if ! helm status secrets-core -n ${env.PRODUCTION_NS} > /dev/null 2>&1; then
                                helm install secrets-core ./secrets-chart \
                                    --namespace ${env.PRODUCTION_NS} \
                                    --atomic \
                                    --timeout 10m
                            else
                                echo "secrets-core already exists in production"
                            fi

                        """
                    }
                }
            }

        // ──  Full Production Deployment ────────────────────────────────────────────────────────────────────────
        stage('Production Full Deploy') {

            when {
                expression {
                    return env.PRODUCTION_EXISTS == 'no' 
                }
            }

            steps {
                script {

                    def missing = [:]

                    imageNameToENV.each { _, envVar ->
                        if (!env.getProperty(envVar)?.trim()) {
                            missing[envVar] = ''
                        }
                    }

                    if (missing) {

                        def inputs = input(
                            message: 'Provide image versions',
                            parameters: missing.keySet().collect { key ->
                                string(
                                    name: key,
                                    defaultValue: '',
                                    description: "Version for ${key}"
                                )
                            }
                        )

                        missing.keySet().each { key ->
                            env.setProperty(key, inputs[key])
                        }
                    }
                }
                dir('Helm') {

                    script {

                        def setArgs = [
                            "images.ems.images.ems_server_image=baraamohamed/gradproj:ems-server-${env.EMS_SERVER_VERSION}",
                            "images.ems.images.ems_client_image=baraamohamed/gradproj:ems-client-${env.EMS_CLIENT_VERSION}",
                            "images.hospital.images.hospital_server_image=baraamohamed/gradproj:hospital-server-${env.HOSPITAL_SERVER_VERSION}",
                            "images.hospital.images.hospital_client_image=baraamohamed/gradproj:hospital-client-${env.HOSPITAL_CLIENT_VERSION}",
                            "images.storage.images.storage_server_image=baraamohamed/gradproj:storage-server-${env.STORAGE_SERVER_VERSION}",
                            "images.storage.images.storage_client_image=baraamohamed/gradproj:storage-client-${env.STORAGE_CLIENT_VERSION}",
                        ].join(' \\\n --set ')

                        sh """
                            helm install app-prod ./app-chart \
                                --namespace ${env.PRODUCTION_NS} \
                                --set ${setArgs} \
                                -f ./app-chart/prod-values.yaml \
                                --atomic \
                                --timeout 10m
                        """
                    }
                }
            }
        }

        stage('Production Targeted Upsert') {

            when {
                expression {

                    def noImagesProvided =
                        !params.IMAGES_VERSIONS?.trim() ||
                        params.IMAGES_VERSIONS == '{}'

                    return env.PRODUCTION_EXISTS == 'yes' && !noImagesProvided
                }
            }

            steps {

                script {

                    upsertDeploymentsHelm(
                        env.PRODUCTION_NS,
                        resolvedVersions,
                        imagesToCreate,
                        imageNameToHelmRelease,
                        imageNameToHelmValuePath
                    )
                }
            }
        }
    }

    post {

        failure {
            echo 'Pipeline failed — production was NOT updated'
        }

        success {
            echo 'Successfully deployed to production'
        }
    }
}