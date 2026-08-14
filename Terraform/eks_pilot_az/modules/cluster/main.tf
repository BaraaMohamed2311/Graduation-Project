resource "aws_eks_cluster" "cluster" {
  name     = var.cluster_name
  version  = "1.33"
  role_arn = aws_iam_role.cluster_role.arn

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.pilot_cluster_security_group-tf.id]
  }

  enabled_cluster_log_types = [
    "api", "audit", "authenticator", "controllerManager", "scheduler"
  ]

  depends_on = [aws_iam_role_policy_attachment.cluster_policy, time_sleep.wait_for_eni_deletion]
}

resource "aws_iam_role" "cluster_role" {
  # Unique name per region
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  role       = aws_iam_role.cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.cluster.name
  node_group_name = "${var.cluster_name}-nodes"
  node_role_arn   = aws_iam_role.nodes_role.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    min_size = 0
    max_size = 2
    # KEY: Secondary region boots with 0 nodes (pilot light)
    desired_size = var.is_primary ? 1 : 0
  }

  capacity_type  = "SPOT"
  instance_types = ["c7i-flex.large"]

  labels = {
    Environment = var.is_primary ? "primary" : "secondary"
  }

  tags = {
    Environment = var.is_primary ? "primary" : "secondary"
    Terraform   = "true"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    "Name" = "${var.cluster_name}-worker-node"
  }

  depends_on = [
    aws_iam_role_policy_attachment.nodes_worker_policy,
    aws_iam_role_policy_attachment.nodes_cni_policy,
    aws_iam_role_policy_attachment.nodes_registry_policy,
  ]
}

resource "aws_iam_role" "nodes_role" {
  name = "${var.cluster_name}-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

###################################################
## Security group for the worker nodes
###################################################
resource "time_sleep" "wait_for_eni_deletion" {
  # This triggers the delay when the cluster ID is being destroyed
  destroy_duration = "2m"
  
  # Crucial: This links the timer to the incoming cluster dependency
  depends_on       = [aws_security_group.pilot_cluster_security_group-tf]
}
# Security group for the cluster
resource "aws_security_group" "pilot_cluster_security_group-tf" {
  name_prefix = "eks-cluster-"
  vpc_id      = var.vpc_id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  

  
  tags = {
    Name = "pilot_cluster_security_group-tf"
  }
}

## Test SSM connectivity to the nodes
resource "aws_iam_role_policy_attachment" "nodes_ssm_policy" {
  role       = aws_iam_role.nodes_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}


###################################################
## Extra IAM policies for the worker nodes
###################################################
resource "aws_iam_role_policy_attachment" "nodes_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.nodes_role.name
}

resource "aws_iam_role_policy_attachment" "nodes_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.nodes_role.name
}

resource "aws_iam_role_policy_attachment" "nodes_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.nodes_role.name
}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks_oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}



output "cluster_name"          { value = aws_eks_cluster.cluster.name }
output "cluster_endpoint"      { value = aws_eks_cluster.cluster.endpoint }
output "node_group_name"       { value = aws_eks_node_group.nodes.node_group_name }
output "node_role_arn"         { value = aws_iam_role.nodes_role.arn }
output "oidc_provider_arn"     { value = aws_iam_openid_connect_provider.eks_oidc.arn }
output "ca_data"               { value = aws_eks_cluster.cluster.certificate_authority[0].data }
output "cluster_sg_id"         { value = aws_eks_cluster.cluster.vpc_config[0].cluster_security_group_id }
