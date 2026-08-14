
locals {
  primary_region   = "us-east-1"
  secondary_region = "us-west-2"
}
# To get aws current account id
data "aws_caller_identity" "current" {}


# ──── ── ── ── ── ── Primary Infrastructure (VPC, subnets, etc.) ── ── ── ── ──
# ── Primary cluster (us-east-1, always-on) ─────────────────────────────────
module "eks_primary" {
  source = "./modules/cluster"

  providers = { aws = aws.primary }
  vpc_id                   = module.primary_network.vpc_id
  cluster_name              = "pilot-eks-primary"
  private_subnet_ids        = module.primary_network.private_subnet_ids
  is_primary                = true
}

# ── ingress controller ────────────────────────────────────────────────
module "lb_primary" {
  source = "./modules/lb"

  providers = { aws = aws.primary, kubernetes = kubernetes.primary_k8s, helm = helm.primary_helm }
  release_name = "aws-primary-lb-controller"
  vpc_id    = module.primary_network.vpc_id
  region   = local.primary_region
  eks_name  = module.eks_primary.cluster_name
  env_name  = "pilot"
  oidc_provider_arn = module.eks_primary.oidc_provider_arn
}



module "primary_network" {
    source    = "./modules/networking"
    providers = { aws = aws.primary }

    vpc_name       = "eks-pilot-vpc-primary"
    cidr_block     = "10.0.0.0/16"
    private_subnet = ["10.0.1.0/24","10.0.2.0/24"]
    public_subnet  = ["10.0.3.0/24","10.0.4.0/24"]
    azs            = ["us-east-1a","us-east-1b"]
}


# ──── ── ── ── ── ── Secondary Infrastructure (VPC, subnets, etc.) ── ── ── ── ──
# ── Secondary cluster (us-west-2, pilot-light nodes=0) ─────────────────────
module "eks_secondary" {
  source = "./modules/cluster"

  providers = { aws = aws.secondary }

  vpc_id                    = module.secondary_network.vpc_id
  cluster_name              = "pilot-eks-secondary"
  private_subnet_ids        = module.secondary_network.private_subnet_ids
  is_primary                = false   # ← boots with 0 nodes
}

# ── ingress controller ────────────────────────────────────────────────
module "lb_secondary" {
  source = "./modules/lb"

  providers = { aws = aws.secondary, kubernetes = kubernetes.secondary_k8s, helm = helm.secondary_helm }

  release_name = "aws-secondary-lb-controller"
  vpc_id    = module.secondary_network.vpc_id
  region   = local.secondary_region
  eks_name  = module.eks_secondary.cluster_name
  env_name  = "pilot"
  oidc_provider_arn = module.eks_secondary.oidc_provider_arn
}




module "secondary_network" {
    source    = "./modules/networking"
    providers = { aws = aws.secondary }

    vpc_name       = "eks-pilot-vpc-secondary"
    cidr_block     = "10.1.0.0/16"
    private_subnet = ["10.1.1.0/24","10.1.2.0/24"]
    public_subnet  = ["10.1.3.0/24","10.1.4.0/24"]
    azs            = ["us-west-2a","us-west-2b"]
}

# ──── ── ── ── ── ── Global Infrastructure (VPC, subnets, etc.) ── ── ── ── ──

# ── Routing and failover ───────────────────────────────────────────────
module "routing" {
  source = "./modules/routing"
  primary_vpc_id = module.primary_network.vpc_id
  secondary_vpc_id = module.secondary_network.vpc_id
  providers = { aws.primary = aws.primary, aws.secondary = aws.secondary }

  primary_alb_dns   = module.lb_primary.alb_dns_name
  secondary_alb_dns = module.lb_secondary.alb_dns_name

  secondary_cluster_name    = module.eks_secondary.cluster_name
  secondary_node_group_name = module.eks_secondary.node_group_name
  secondary_region          = local.secondary_region

}


# ──── ── ── ── ── ── Single Region Infra (secondary)── ── ── ── ──
# ── Lambda function for failover scaling ───────────────────────────────
module "lambda" {
  source = "./modules/lambda"

  providers = { aws = aws.secondary }

  secondary_cluster_name    = module.eks_secondary.cluster_name
  secondary_node_group_name = module.eks_secondary.node_group_name
  secondary_region          = local.secondary_region
  aws_account_id            = data.aws_caller_identity.current.account_id

}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  providers = { aws = aws.primary }

  primary_calculated_health_check_id = module.routing.primary_calculated_health_check_id
  failover_alerts_scaleup_topic_arn = module.SNS.failover_alerts_scaleup_topic_arn
  failover_alerts_scaledown_topic_arn = module.SNS.failover_alerts_scaledown_topic_arn
}

# - SNS topic for failover alerts
module "SNS" {
  source = "./modules/SNS"

  providers = { aws = aws.primary , aws.lambda_region = aws.secondary }

  cw_metric_alarm_arn = module.cloudwatch.primary_unhealthy_alarm_arn
  failover_scaleup_function_arn  = module.lambda.failover_scaleup_function_arn
  failover_scaleup_function_name = module.lambda.failover_scaleup_function_name
  failover_scaledown_function_arn  = module.lambda.failover_scaledown_function_arn
  failover_scaledown_function_name = module.lambda.failover_scaledown_function_name
}