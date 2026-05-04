resource "aws_launch_template" "control_plane_template_tf" {
  name = "control_plane_template_tf"
  image_id = var.ami_id
  instance_type = var.instance_type
  monitoring {
    enabled = true
  }

  network_interfaces {
    associate_public_ip_address = true 
    subnet_id = var.main_public_subnet_id
    security_groups = ["${var.control_plane_sg_tf}"] 
  }

  placement {
    availability_zone = var.az
  }


  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "control_plane_template_tf"
    }
  }

  user_data = filebase64("${path.module}/kubeadm_init.sh")
}
#####################################################################

output "control_plane_template_id" {
    description = "ID of the main VPC "
    value = aws_launch_template.control_plane_template_tf.id
}

