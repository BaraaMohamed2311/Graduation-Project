# ==========================================
# AWS Load Balancer Controller
resource "helm_release" "lb" {
  name       = var.release_name
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = "1.17.1"
  namespace  = "kube-system"
  wait          = false   # don't block on pods becoming Ready
  timeout       = 300
  cleanup_on_fail  = true
  depends_on = [kubernetes_service_account.lb_controller]
  
  set = [{
    name  = "region"
    value = var.region
  }

  ,  {
    name  = "vpcId"
    value = var.vpc_id
  }

  ,  {
    name  = "image.repository"
    value = "602401143452.dkr.ecr.${var.region}.amazonaws.com/amazon/aws-load-balancer-controller"
  }

  ,  {
    name  = "serviceAccount.create"
    value = "false"
  }

  , {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }
  , {
    name  = "clusterName"
    value = var.eks_name
  }]
}

# ==========================================
# IAM Role for Load Balancer Controller
module "lb_role" {
  source    = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts"

  name = "${var.env_name}_eks_lb"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}
# ==========================================
# actual ServiceAccount object inside the cluster
# the identity that gets attached to pods so they can authenticate as "I am the LB controller."

resource "kubernetes_service_account" "lb_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    labels = {
      "app.kubernetes.io/name"      = "aws-load-balancer-controller"
      "app.kubernetes.io/component" = "controller"
    }
    annotations = {
      "eks.amazonaws.com/role-arn" = module.lb_role.arn
    }
  }
}


output "alb_dns_name" {
  value = helm_release.lb.name
}