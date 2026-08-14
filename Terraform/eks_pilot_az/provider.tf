
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.0"
    }
  }
}

# ==========================================================
# Primary Region Providers (us-east-1)
# ==========================================================
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "kubernetes" {
  alias                  = "primary_k8s"
  host                   = module.eks_primary.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_primary.ca_data)
  exec {
    api_version = "client.authentication.k8s.io/v1" # Updated to stable beta version
    args        = ["eks", "get-token", "--cluster-name", module.eks_primary.cluster_name]
    command     = "aws"
  }
}

provider "helm" {
  alias = "primary_helm"
  kubernetes = {
    host                   = module.eks_primary.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_primary.ca_data)
    exec = {
      api_version = "client.authentication.k8s.io/v1"
      args        = ["eks", "get-token", "--cluster-name", module.eks_primary.cluster_name]
      command     = "aws"
    }
  }

  repository_config_path = "${path.root}/.terraform/helm/repositories.yaml"
  repository_cache  = "${path.root}/.terraform/helm/cache"
}

# ==========================================================
# Secondary Region Providers (us-west-2)
# ==========================================================
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

provider "kubernetes" {
  alias                  = "secondary_k8s"
  host                   = module.eks_secondary.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_secondary.ca_data)
  exec {
    api_version = "client.authentication.k8s.io/v1"
    args        = ["eks", "get-token", "--cluster-name", module.eks_secondary.cluster_name]
    command     = "aws"
  }
}

provider "helm" {
  alias = "secondary_helm"
  kubernetes = {
    host                   = module.eks_secondary.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_secondary.ca_data)
    exec ={
      api_version = "client.authentication.k8s.io/v1"
      args        = ["eks", "get-token", "--cluster-name", module.eks_secondary.cluster_name]
      command     = "aws"
    }
  }
}