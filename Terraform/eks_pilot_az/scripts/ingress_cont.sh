# 1. Update local kubectl context to point to the new cluster
Write-Host "Updating kubeconfig..."
aws eks update-kubeconfig --region us-east-1 --name pilot-eks-cluster-tf

# 2. Setup the IAM Service account (Overriding any old ones)
Write-Host "Setting up IAM Service Account..."
eksctl create iamserviceaccount `
  --cluster=pilot-eks-cluster-tf `
  --namespace=kube-system `
  --name=aws-load-balancer-controller `
  --attach-policy-arn="arn:aws:iam::$((aws sts get-caller-identity --query 'Account' --output text)):policy/AWSLoadBalancerControllerIAMPolicy" `
  --override-existing-serviceaccounts `
  --region us-east-1 `
  --approve

# 3. Install Cert-Manager (Required for Load Balancer TLS)
Write-Host "Installing Cert-Manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 4. Wait for Cert-Manager to be ready before moving to Helm
Write-Host "Waiting for Cert-Manager pods to come online..."
kubectl wait --namespace cert-manager --for=condition=ready pod --selector=app.kubernetes.io/instance=cert-manager --timeout=90s

# 5. Deploy AWS Load Balancer Controller via Helm
Write-Host "Deploying AWS Load Balancer Controller..."
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller `
  -n kube-system `
  --set clusterName=pilot-eks-cluster-tf `
  --set serviceAccount.create=false `
  --set serviceAccount.name=aws-load-balancer-controller `
  --set region=us-east-1 `
  --set vpcId=vpc-059ac0b907ed6a3de

Write-Host "🚀 Setup complete! Checking pods..."
kubectl get pods -n kube-system