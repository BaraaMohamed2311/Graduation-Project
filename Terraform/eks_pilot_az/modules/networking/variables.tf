
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
    description = "private subnet"
}

variable "public_subnet" {
    type = list(string)
    description = "Public subnet"
}


## Azs
variable "azs" {
    type = list(string)
    description = "Availability Zones"
}
