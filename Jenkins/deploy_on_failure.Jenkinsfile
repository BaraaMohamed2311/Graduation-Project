pipeline {
    agent any

    parameters {
        string(name: 'CLUSTER_NAME', defaultValue: 'pilot-eks-secondary', description: 'EKS cluster to target')
    }

    environment {
        AWS_REGION  = 'us-west-2'
        KUBECONFIG  = "${WORKSPACE}/.kube/config"
    }

    stages {

        stage('Ensure tools') {
            steps {
                sh '''
                    set -eu
                    ARCH=$(uname -m)
                    if [ "$ARCH" = "x86_64" ]; then
                        KARCH="amd64"; AWSARCH="x86_64"
                    else
                        KARCH="arm64"; AWSARCH="aarch64"
                    fi

                    if ! command -v kubectl &> /dev/null; then
                        curl -fLO "https://dl.k8s.io/release/$(curl -fL -s https://dl.k8s.io/release/stable.txt)/bin/linux/${KARCH}/kubectl"
                        chmod +x kubectl
                        mkdir -p "$WORKSPACE/bin"
                        mv kubectl "$WORKSPACE/bin/kubectl"
                    fi

                    if ! command -v aws &> /dev/null; then
                        rm -rf aws awscliv2.zip
                        curl -fL "https://awscli.amazonaws.com/awscli-exe-linux-${AWSARCH}.zip" -o "awscliv2.zip"
                        unzip -q -o awscliv2.zip
                        mkdir -p "$WORKSPACE/aws-cli"
                        ./aws/install -i "$WORKSPACE/aws-cli" -b "$WORKSPACE/bin" -u
                    fi
                '''
            }
        }

        stage('Generate kubeconfig, verify access') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'jenkins-aws-creds']
                ]) {
                    sh '''
                        set -eu
                        export PATH="$WORKSPACE/bin:$PATH"
                        mkdir -p "$(dirname "$KUBECONFIG")"

                        aws eks update-kubeconfig \
                          --name "${CLUSTER_NAME}" \
                          --region "${AWS_REGION}" \
                          --kubeconfig "$KUBECONFIG"
                    '''
                    sh '''
                        set -eu
                        export PATH="$WORKSPACE/bin:$PATH"
                        kubectl get nodes
                        kubectl get pods -A
                    '''
                }
            }
        }

        stage('Clone Repo') {
            steps {
                git branch: 'master', url: 'https://github.com/BaraaMohamed2311/Graduation-Project.git'
            }
        }
        // Deploys everthing includding ingress rule that we will update in the next stage to point to use new ingress rule ip
        stage('Apply manifests / scale actions') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'jenkins-aws-creds']
                ]) {
                    dir('Kubernetes/remote/cloud/production') {
                        sh '''
                            set -eu
                            export PATH="$WORKSPACE/bin:$PATH"
                            kubectl create namespace production || true
                            kubectl apply -f . -R
                        '''
                    }
                }
            }
        }

        stage('Update Ingress Rule') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'jenkins-aws-creds']
                ]) {
                    dir('Kubernetes/remote/cloud/production') {
                        sh '''
                        set -eu
                        export PATH="$WORKSPACE/bin:$PATH"
                            for i in $(seq 1 30); do
                                ALB_RULEADDRESS=$(kubectl get ingress access-ingress -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

                                if [ -n "$ALB_RULEADDRESS" ]; then
                                    echo "Got ALB hostname: $ALB_RULEADDRESS"
                                    break
                                fi

                                echo "ALB rule address is empty, retrying in 10 seconds... ($i/30)"
                                sleep 10
                            done


                            if [ -z "$ALB_RULEADDRESS" ]; then
                                echo "ALB rule address is still empty after 30 attempts, exiting with error."
                                exit 1
                            fi
                            
                            IP_ADDRESS=""
                            for i in $(seq 1 15); do
                                IP_ADDRESS=$(dig +short "$ALB_RULEADDRESS" @8.8.8.8 | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$' | head -n 1)

                                if [ -z "$IP_ADDRESS" ]; then
                                    IP_ADDRESS=$(dig +short "$ALB_RULEADDRESS" | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$' | head -n 1)
                                fi

                                if [ -n "$IP_ADDRESS" ]; then
                                    echo "Resolved IP address: $IP_ADDRESS"
                                    break
                                fi

                                echo "DNS resolution empty, retrying in 5 seconds... ($i/15)"
                                sleep 5
                            done

                            if [ -z "$IP_ADDRESS" ]; then
                                echo "Failed to resolve $ALB_RULEADDRESS to an IP after retries"
                                exit 1
                            fi
                            echo "Resolved IP address: $IP_ADDRESS and updating ingress.yml"
                            sed -i -E "s/([a-zA-Z]+)\\.[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+\\.nip\\.io/\\1.${IP_ADDRESS}.nip.io/g" ingress.yml
                            kubectl apply -f ingress.yml 
                        '''
                    }
                }
        }
    }
    }

    post {
        always {
            sh 'rm -rf "$WORKSPACE/.kube" || true'
        }
        failure {
            echo "Post-scale kubectl apply failed for cluster ${params.CLUSTER_NAME}"
        }
    }
}