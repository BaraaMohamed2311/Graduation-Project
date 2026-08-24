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


###################
## OUTPUTS

output "cluster_security_group_id" {
  value = aws_security_group.pilot_cluster_security_group-tf.id
  description = "Security group ID for the EKS cluster control plane"
}