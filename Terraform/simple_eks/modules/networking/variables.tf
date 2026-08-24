
## VPC and Subnet configuration for EKS cluster
variable vpc_name {
  description = "The name of the VPC"
  type        = string
  default     = "eks-pilot-vpc"
}

variable "cidr_block" {
    default = "10.0.0.0/16"
}

## Subnet CIDR blocks
variable "private_subnet" {
    type = list(string)
    default = ["10.0.1.0/24","10.0.2.0/24"]
    description = "private subnet"
}

variable "public_subnet" {
    type = list(string)
    default = ["10.0.3.0/24","10.0.4.0/24"]
    description = "Public subnet"
}


## Azs
variable "azs" {
    type = list(string)
    description = "Availability Zones"
    default = [ "us-east-1a", "us-east-1b", "us-east-1c" ] 
}
