node {


def version = "${env.BUILD_NUMBER}"
def images = [:]

stage('Clone repository') {
    checkout scm
}

stage('Build images') {
    echo 'Building Docker images...'

    images.ems_client = docker.build("baraamohamed/gradproj:ems-client-${version}", "../Websites/ems/client")
    images.ems_server = docker.build("baraamohamed/gradproj:ems-server-${version}", "../Websites/ems/server")
    images.hospital_client = docker.build("baraamohamed/gradproj:hospital-client-${version}", "../Websites/hospital/client")
    images.hospital_server = docker.build("baraamohamed/gradproj:hospital-server-${version}", "../Websites/hospital/server")
}

stage('Test images') {
    echo 'Running container tests...'

    sh "docker run --rm baraamohamed/gradproj:ems-client-${version} ./run-tests.sh"
    sh "docker run --rm baraamohamed/gradproj:ems-server-${version} ./run-tests.sh"
    sh "docker run --rm baraamohamed/gradproj:hospital-client-${version} ./run-tests.sh"
    sh "docker run --rm baraamohamed/gradproj:hospital-server-${version} ./run-tests.sh"
}

stage('Push images') {
    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {

        images.ems_client.push()
        images.ems_server.push()
        images.hospital_client.push()
        images.hospital_server.push()

        images.ems_client.push("latest")
        images.ems_server.push("latest")
        images.hospital_client.push("latest")
        images.hospital_server.push("latest")
    }
}


}
