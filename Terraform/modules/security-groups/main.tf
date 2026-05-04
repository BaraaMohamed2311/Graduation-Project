########### Bastion Security Group ###########

resource "aws_security_group" "control_plane_sg_tf" {
 name        = "control_plane_sg_tf"
 description = "Allow HTTP/SSH to web server"
 vpc_id      =  var.main_vpc_id # attached to main vpc
}

resource "aws_security_group_rule" "allow_http_control_plane" {
 type              = "ingress"
 description       = "HTTP ingress for all ranges"
 from_port         = 80
 to_port           = 80
 protocol          = "tcp"
 cidr_blocks       = ["0.0.0.0/0"] # allow http from anywhere for the bastion host
 security_group_id = aws_security_group.control_plane_sg_tf.id
}

resource "aws_security_group_rule" "allow_SSH_control_plane" {
 type              = "ingress"
 description       = "allow SSH only from current subnet"
 from_port         = 22
 to_port           = 22
 protocol          = "tcp"
 cidr_blocks       = ["0.0.0.0/0"] # allow SSH from anywhere for the bastion host
 security_group_id = aws_security_group.control_plane_sg_tf.id
}


# Egress rule (allow all outbound traffic)
resource "aws_security_group_rule" "allow_all_egress_control_plane" {
  type              = "egress"
  description       = "Allow all outbound traffic"
  from_port         = 0    # All ports
  to_port           = 0    # All ports
  protocol          = "-1" # All protocols 
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.control_plane_sg_tf.id
}




######################################################################

output "control_plane_sg_tf" {
    description = "ID App & Bastion Security Group"
    value = aws_security_group.control_plane_sg_tf.id
}


