
########################### Compute Variables ##################################


variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string 
  default = "ami-091138d0f0d41ff90"
}

variable "instance_type" {
  description = "the EC2 instance type"
  type        = string 
  default = "c7i-flex.large"
}

########################### Networking Variables ##################################

variable "cidr_block" {
  description = "vpc cidr_block"
  type        = string 
  default = "10.0.0.0/16"
}

variable "cidr_block_public_subnet" {
  description = "cidr_block_public_subnet"
  type        = string 
  default = "10.0.10.0/24"
}



########################### Common Variables ##################################

variable "region" {
  description = "AWS Deployment region.."
  type        = string 
  default = "us-east-1"
}

variable "az" {
  description = "AWS Deployment region.."
  type        = string 
  default = "us-east-1a"
}