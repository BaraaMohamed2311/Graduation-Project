# ==========================================
# Lambda Function triggered by sns topic on primary health alarm
# scales node group in secondary cluster from 0 to 1 to take over workload
# ==========================================

data "archive_file" "scale_up" {
  type        = "zip"
  source_file = "${path.module}/scripts/raw/scale_up_script.py"
  output_path = "${path.module}/scripts/archived/scale_up.zip"
}

data "archive_file" "scale_down" {
  type        = "zip"
  source_file = "${path.module}/scripts/raw/scale_down_script.py"
  output_path = "${path.module}/scripts/archived/scale_down.zip"
}



resource "aws_lambda_function" "failover_scaleup" {
  # provider = aws.primary

  function_name = "eks-failover-scaleup"
  role          = aws_iam_role.failover_scaleup_lambda_role.arn
  handler       = "scale_up_script.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30

  filename         = data.archive_file.scale_up.output_path
  source_code_hash = data.archive_file.scale_up.output_base64sha256

  environment {
    variables = {
      SECONDARY_CLUSTER_NAME    = var.secondary_cluster_name
      SECONDARY_NODE_GROUP_NAME = var.secondary_node_group_name
      SECONDARY_REGION          = var.secondary_region
      TARGET_DESIRED_SIZE       = "1"
    }
  }
}


resource "aws_lambda_function" "healthy_scaledown" {
  # provider = aws.primary

  function_name = "eks-failover-scaledown"
  role          = aws_iam_role.failover_scaledown_lambda_role.arn
  handler       = "scale_down_script.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30

  filename         = data.archive_file.scale_down.output_path
  source_code_hash = data.archive_file.scale_down.output_base64sha256

  environment {
    variables = {
      SECONDARY_CLUSTER_NAME    = var.secondary_cluster_name
      SECONDARY_NODE_GROUP_NAME = var.secondary_node_group_name
      SECONDARY_REGION          = var.secondary_region
      TARGET_DESIRED_SIZE       = "1"
    }
  }
}

# ==========================================
# Lambda IAM Role
# ==========================================

resource "aws_iam_role" "failover_scaleup_lambda_role" {
  # provider = aws.primary
  name     = "eks-failover-scaleup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role" "failover_scaledown_lambda_role" {
  # provider = aws.primary
  name     = "eks-failover-scaledown-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}
## Just for lambda to read required parameters from SSM Parameter to access Jenkins for scaling up the secondary cluster
# Get secret parameters from SSM Parameter Store for Jenkins credentials 
resource "aws_iam_role_policy" "jenkins_ssm_read" {
  name = "jenkins-ssm-param-read"
  role = aws_iam_role.failover_scaleup_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        # Note the double slash parameter// after parameter
        Resource = "arn:aws:ssm:us-west-2:${var.aws_account_id}:parameter/gradproj/jenkins/*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = "arn:aws:kms:us-west-2:${var.aws_account_id}:alias/aws/ssm"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_scaleup_eks_policy" {
  # provider = aws.primary
  name     = "lambda-eks-scaleup-policy"
  role     = aws_iam_role.failover_scaleup_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "eks:UpdateNodegroupConfig",
          "eks:DescribeNodegroup"
        ]
        # Scoped to only the secondary node group
        Resource = "arn:aws:eks:us-west-2:${var.aws_account_id}:nodegroup/${var.secondary_cluster_name}/${var.secondary_node_group_name}/*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_scaledown_eks_policy" {
  # provider = aws.primary
  name     = "lambda-eks-scaledown-policy"
  role     = aws_iam_role.failover_scaledown_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "eks:UpdateNodegroupConfig",
          "eks:DescribeNodegroup"
        ]
        # Scoped to only the secondary node group
        Resource = "arn:aws:eks:us-west-2:${var.aws_account_id}:nodegroup/${var.secondary_cluster_name}/${var.secondary_node_group_name}/*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

output "failover_scaleup_function_arn" {
  value = aws_lambda_function.failover_scaleup.arn
}

output "failover_scaleup_function_name" {
  value = aws_lambda_function.failover_scaleup.function_name
}

output "failover_scaledown_function_arn" {
  value = aws_lambda_function.healthy_scaledown.arn
}

output "failover_scaledown_function_name" {
  value = aws_lambda_function.healthy_scaledown.function_name
}