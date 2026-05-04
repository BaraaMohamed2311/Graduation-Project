variable "cidr_block" {
  description = "vpc cidr_block"
  type        = string 
}

variable "cidr_block_public_subnet" {
  description = "cidr_block_public_subnet"
  type        = string 
  default = "10.0.10.0/24"
}

variable "region" {
  description = "AWS Deployment region.."
  type        = string 

}

variable "az" {
  description = "AWS Deployment region.."
  type        = string 

}

