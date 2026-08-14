# ==========================================
# Route53 Health Checks (no hosted zone needed)
# These are standalone objects that feed CloudWatch
# ==========================================

# resource_path     = "/" proves only that the website server is up, not that the application is healthy and doesn't know if db is running or not
# for a better health check create a health endpoint in the application that checks the db connection and returns 200 if healthy, 500 if not



resource "aws_route53_health_check" "ems" {

  fqdn              = "ems.100.55.144.231.nip.io"
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags = { Name = "ems-health-check" }
}

resource "aws_route53_health_check" "hospital" {

  fqdn              = "hospital.100.55.144.231.nip.io"
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags = { Name = "hospital-health-check" }
}

resource "aws_route53_health_check" "storage" {

  fqdn              = "storage.100.55.144.231.nip.io"
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags = { Name = "storage-health-check" }
}

resource "aws_route53_health_check" "primary_calculated" {

  type                      = "CALCULATED"
  child_health_threshold    = 3   # require all 3 children healthy; set to 1 for "any one healthy"
  child_healthchecks        = [
    aws_route53_health_check.ems.id,
    aws_route53_health_check.hospital.id,
    aws_route53_health_check.storage.id,
  ]
  tags = { Name = "primary-overall-health" }
}


output "primary_calculated_health_check_id" {
  value = aws_route53_health_check.primary_calculated.id
}



