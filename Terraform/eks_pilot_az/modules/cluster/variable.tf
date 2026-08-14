variable "private_subnet_ids" {
  type = list(string)
}



variable "cluster_name" {
  type = string
}

variable "is_primary" {
  type = bool
}

variable "vpc_id" {
  type = string
}

