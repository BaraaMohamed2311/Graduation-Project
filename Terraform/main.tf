
module "SG" {
    source = "./modules/security-groups"  
    cidr_block = var.cidr_block
    main_vpc_id= module.vpc.main_vpc_id  
}

module "vpc" {
    source = "./modules/networking"  
    cidr_block = var.cidr_block
    az = var.az
    region = var.region
    cidr_block_public_subnet = var.cidr_block_public_subnet
}

module "compute" {
    source = "./modules/compute"
    region = var.region
    az = var.az
    ami_id = var.ami_id
    instance_type = var.instance_type
    cidr_block = var.cidr_block
    main_public_subnet_id = module.vpc.main_public_subnet_id
    control_plane_sg_tf = module.SG.control_plane_sg_tf

}




