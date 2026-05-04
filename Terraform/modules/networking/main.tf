resource "aws_vpc" "main_tf" {
    provider = aws
    cidr_block = var.cidr_block
    
  tags = {
    Name = "main_tf"
  }
}


######### Network ACL Rules #########

resource "aws_network_acl" "main_acl_tf" {
  vpc_id = aws_vpc.main_tf.id
  subnet_ids =[aws_subnet.main_public_subnet_tf.id]
   
  # Allow all inbound traffic
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "-1" 
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }


# Allow all outbound traffic
egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "-1" 
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }


  tags = {
    Name = "main-acl"
  }
}


######### Route Table Rules #########
resource "aws_route_table" "main_RT_tf" {
  vpc_id = aws_vpc.main_tf.id
  
  route {
    cidr_block = var.cidr_block
    gateway_id =  "local"
  }
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw_main_tf.id
  }

  tags = {
    Name = "main_RT_tf"
  }
}

resource "aws_route_table_association" "main_RT_tf_association" {
  subnet_id      = aws_subnet.main_public_subnet_tf.id
  route_table_id = aws_route_table.main_RT_tf.id
}

######### Public Subnet #########

resource "aws_subnet" "main_public_subnet_tf" {
    vpc_id     = aws_vpc.main_tf.id
    cidr_block = var.cidr_block_public_subnet
    availability_zone = var.az
    
  tags = {
    Name = "main_public_subnet_ue1a_tf"
  }
}


######### Internet Gateway #########

resource "aws_internet_gateway" "gw_main_tf" {
  vpc_id = aws_vpc.main_tf.id

  tags = {
    Name = "gw_main_tf"
  }
}

####################################################

output "main_vpc_id" {
    description = "ID of the main VPC "
    value = aws_vpc.main_tf.id
}

output "main_public_subnet_id" {
    description = "ID of the main VPC's public subnet "
    value = aws_subnet.main_public_subnet_tf.id
}