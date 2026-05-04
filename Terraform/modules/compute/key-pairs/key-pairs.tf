# Key Pair 1: devAccess
resource "tls_private_key" "control_plane_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "control_plane_key_pair" {
  key_name   = "control_plane_key"
  public_key = tls_private_key.control_plane_key.public_key_openssh 
}

resource "local_file" "control_plane_key_file" {
  content  = tls_private_key.control_plane_key.private_key_pem
  filename = "control_plane_key_file.pem"
}

# Outputs
output "control_plane_key" {
  value = aws_key_pair.control_plane_key_pair  
  sensitive = true  # Mark as sensitive to hide private key
}

