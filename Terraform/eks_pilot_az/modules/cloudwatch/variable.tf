variable "primary_calculated_health_check_id" {
  description = "The ID of the primary Route53 health check"
  type        = string
}

variable "failover_alerts_scaleup_topic_arn" {
  description = "The ARN of the SNS topic to send failover alerts to"
  type        = string
}


variable "failover_alerts_scaledown_topic_arn" {
  description = "The ARN of the SNS topic to send failover alerts to"
  type        = string
}