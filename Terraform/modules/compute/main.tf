resource "aws_instance" "control_plane_tf" {
  
  key_name = "${module.keyPairs_mod.control_plane_key.id}"

  # Reference the launch template
  launch_template {
    id      = module.Template_mod.control_plane_template_id
    version = "$Latest"
  }
  tags = {
    Name = "control_plane_tf"
  }
}


module "keyPairs_mod" {
  source = "./key-pairs"
}

module "Template_mod" {
  source = "./templates"
  az = var.az
  cidr_block = var.cidr_block
  ami_id = var.ami_id
  instance_type = var.instance_type
  main_public_subnet_id = var.main_public_subnet_id 
  control_plane_sg_tf = var.control_plane_sg_tf
  
}

