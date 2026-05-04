variable "region" {
  description = "AWS Deployment region.."
  type        = string 

}

variable "az" {
  description = "AWS Deployment region.."
  type        = string 

}
###################################################
variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string 
}

variable "instance_type" {
  description = "the EC2 instance type"
  type        = string 
}

###################################################
variable "cidr_block" {
  description = "the EC2 instance type"
  type        = string 
}


variable "main_public_subnet_id" {
  description = "vpc vpc_id from output"
  type        = string 
}

###################################################

variable "control_plane_sg_tf" {
  description = "control_plane SG"
  type        = string 
}





