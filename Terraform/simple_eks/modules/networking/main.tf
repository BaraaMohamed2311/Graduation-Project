### BPV
### Count function may be used to create multiple resources based on the number of items in a list variable. In this case, we are creating multiple subnets based on the number of CIDR blocks provided in the private_subnet variable.
resource "aws_vpc" "main-tf" {
  cidr_block       = var.cidr_block
  instance_tenancy = "default"

  tags = {
    Name = var.vpc_name
  }
}
## Subnets
resource "aws_subnet" "public_subnet-tf" {
  count = length(var.public_subnet)
  vpc_id            = aws_vpc.main-tf.id
  cidr_block        = var.public_subnet[count.index]
  availability_zone = var.azs[count.index]

  tags = {
    Name = "Public-Subnet ${count.index + 1}",
    "kubernetes.io/role/elb" = "1"

  }
}

resource "aws_subnet" "private_subnet-tf" {
  count = length(var.private_subnet)
  vpc_id            = aws_vpc.main-tf.id
  cidr_block        = var.private_subnet[count.index]
  availability_zone = var.azs[count.index]
  
  tags = {
  
    "Name" = "Private-Subnet ${count.index + 1}",
    "kubernetes.io/role/internal-elb" = "1"

  }
}

## Internet Gateway
resource "aws_internet_gateway" "gw-tf" {
  vpc_id = aws_vpc.main-tf.id

  tags = {
    Name = "main"
  }
}

### VPC routing

## Public route table
resource "aws_route_table" "public_route_table-tf" {
  vpc_id = aws_vpc.main-tf.id

  tags = {
    Name = "public_route_table-tf"
  }
}

## direct all outbound traffic from public subnet to internet gateway
resource "aws_route" "public_route-tf" {
  route_table_id            = aws_route_table.public_route_table-tf.id
  destination_cidr_block    = "0.0.0.0/0"
  gateway_id                = aws_internet_gateway.gw-tf.id
}

resource "aws_route_table_association" "public_subnet" {
  count = length(aws_subnet.public_subnet-tf)
  subnet_id      = aws_subnet.public_subnet-tf[count.index].id
  route_table_id = aws_route_table.public_route_table-tf.id
}

## Private route table
resource "aws_route_table" "private_route_table-tf" {
  count  = length(aws_subnet.private_subnet-tf)
  vpc_id = aws_vpc.main-tf.id
  tags = {
    Name = "private_route_table-tf-${count.index + 1}"
  }
}
### Link the private subnets to the private route table
resource "aws_route_table_association" "private_subnet_association" {
  count = length(aws_subnet.private_subnet-tf)
  subnet_id      = aws_subnet.private_subnet-tf[count.index].id
  route_table_id = aws_route_table.private_route_table-tf[count.index].id
}
### NAT Gateway
## link all outbound traffic from private subnets to the NAT Gateway for internet access
resource "aws_nat_gateway" "nat_gateway-tf" {
  count = length(aws_subnet.public_subnet-tf)
  allocation_id = aws_eip.my_eip[count.index].id
  subnet_id     = aws_subnet.public_subnet-tf[count.index].id

  tags = {
    Name = "nat_gateway-tf-${count.index + 1}"
  }
}

##Create an Elastic IP for EACH NAT Gateway
resource "aws_eip" "my_eip" {
  count  = length(aws_subnet.public_subnet-tf)
  vpc    = true
}
## Route for private subnet to access internet via NAT Gateway
resource "aws_route" "nat_gateway_route" {
  count                  = length(aws_subnet.private_subnet-tf)
  route_table_id         = aws_route_table.private_route_table-tf[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  # since NAT Gateway lives at public subnets
  # number of public subnets doesn't have to e the same as private subnets
  # since count represents the number of private subnets, we check if if there are enough NAT Gateways for each private subnet, if not we use the first NAT Gateway for all remaining private subnets
  nat_gateway_id         =  length(aws_nat_gateway.nat_gateway-tf) > count.index ? aws_nat_gateway.nat_gateway-tf[count.index].id : aws_nat_gateway.nat_gateway-tf[0].id
  depends_on             = [ aws_eip.my_eip ]
}


#######################
## OUTPUTS
output "vpc_id" {
  value = aws_vpc.main-tf.id
}

output "public_subnet_ids" {
  value = aws_subnet.public_subnet-tf[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private_subnet-tf[*].id
}