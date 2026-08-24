# The EKS cluster
resource "aws_eks_cluster" "pilot_eks_cluster-tf" {
  name     = "pilot-eks-cluster-tf"
  version  = "1.33"
  role_arn = aws_iam_role.cluster_iam_role-tf.arn

  vpc_config {
    subnet_ids              = concat(var.private_subnet_ids)
    endpoint_private_access = true   # Allow access from within VPC
    endpoint_public_access  = true   # Allow access from internet (restrict in production)
    security_group_ids      = [var.cluster_security_group_id]  
  }

  # Enable control plane logging
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy-tf,
]

}

# ==========================================
# Required IAM Role for the EKS Cluster Control Plane
# ==========================================
# IAM role for eks

resource "aws_iam_role" "cluster_iam_role-tf" {
  name = "cluster_iam_role-tf"
  tags = {
    tag-key = "eks-cluster-demo"
  }

  assume_role_policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "eks.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
POLICY
}

# eks policy attachment

resource "aws_iam_role_policy_attachment" "cluster_policy-tf" {
  role       = aws_iam_role.cluster_iam_role-tf.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}



# ==========================================
# 2. NATIVE EKS MANAGED NODE GROUP
# ==========================================
resource "aws_eks_node_group" "pilot_nodes-tf" {
  cluster_name    = aws_eks_cluster.pilot_eks_cluster-tf.name
  node_group_name = "separate-eks-mng"
  node_role_arn   = aws_iam_role.eks_nodes_role-tf.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    min_size     = 1
    max_size     = 2
    desired_size = 1
  }

  # Cost Optimization: AWS natively manages this spot pool allocation
  capacity_type  = "SPOT"
  instance_types = ["c7i-flex.large"] 

  labels = {
    Environment = "test"
  }

  tags = {
    Environment = "dev"
    Terraform   = "true"
    # CRITICAL: This exact formatting forces AWS to stamp a Name onto the EC2 instances
    "kubernetes.io/cluster/${aws_eks_cluster.pilot_eks_cluster-tf.name}" = "owned"
    "Name" = "pilot-eks-worker-node"
  }

  

  # CRITICAL: Nodes will fail to join the cluster if they boot up before policies are attached
  depends_on = [
    aws_iam_role_policy_attachment.nodes_worker_policy-tf,
    aws_iam_role_policy_attachment.nodes_cni_policy-tf,
    aws_iam_role_policy_attachment.nodes_registry_policy-tf,
  ]
}

# ==========================================
# 3. REQUIRED IAM ROLE FOR THE WORKER NODES
# ==========================================
resource "aws_iam_role" "eks_nodes_role-tf" {
  name = "pilot-eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Grants worker nodes permission to check in with the EKS cluster control plane
resource "aws_iam_role_policy_attachment" "nodes_worker_policy-tf" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes_role-tf.name
}

# Allows the AWS VPC CNI plugin to manage network interfaces and IPs on the nodes
resource "aws_iam_role_policy_attachment" "nodes_cni_policy-tf" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes_role-tf.name
}

# Allows the nodes to pull container images directly from Amazon ECR
resource "aws_iam_role_policy_attachment" "nodes_registry_policy-tf" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes_role-tf.name
}

### OIDC Provider for EKS Cluster Authentication
# Fetch the TLS certificate data from the EKS OIDC issuer URL
data "tls_certificate" "eks" {
  url = aws_eks_cluster.pilot_eks_cluster-tf.identity[0].oidc[0].issuer
}

# Create the IAM OIDC Provider
resource "aws_iam_openid_connect_provider" "eks_oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.pilot_eks_cluster-tf.identity[0].oidc[0].issuer
}

############
# OUTPUTS
#############
output "cluster_name" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.name
} 

output "cluster_endpoint" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.endpoint
}

output "cluster_security_group_id" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.vpc_config[0].cluster_security_group_id
}

output "node_group_name" {
  value = aws_eks_node_group.pilot_nodes-tf.node_group_name
}

output "node_role_arn" {
  value = aws_iam_role.eks_nodes_role-tf.arn
}

output "node_group_role_name" {
  value = aws_iam_role.eks_nodes_role-tf.name
}

output "eks_cluster_certificate_authority_data" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.certificate_authority[0].data
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.endpoint
}

output "eks_cluster_id" {
  value = aws_eks_cluster.pilot_eks_cluster-tf.id
}

output "aws_iam_openid_connect_provider_arn" {
  value = aws_iam_openid_connect_provider.eks_oidc.arn
}

