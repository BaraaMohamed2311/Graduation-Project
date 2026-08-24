module network {
    source = "./modules/networking"

}

module cluster {
  source = "./modules/cluster"
  private_subnet_ids = module.network.private_subnet_ids
  cluster_security_group_id = module.security-groups.cluster_security_group_id
  
}

module security-groups {
    source = "./modules/security-groups"
    vpc_id = module.network.vpc_id
}
