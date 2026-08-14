/**/
variable "primary_vpc_id" {
  type = string
}

variable "secondary_vpc_id" {
  type = string
}

variable "primary_alb_dns" {
  type = string
}

variable "secondary_alb_dns" {
  type = string
}

variable "secondary_cluster_name" {
  type = string
}

variable "secondary_node_group_name" {
  type = string
}

variable "secondary_region" {
  type = string
}

