resource "aws_cloudwatch_metric_alarm" "primary_unhealthy" {

  alarm_name          = "primary-alb-unhealthy"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = var.primary_calculated_health_check_id
  }

  alarm_actions = [var.failover_alerts_scaleup_topic_arn]
  ok_actions    = [var.failover_alerts_scaledown_topic_arn] 
  # deliberately no ok_actions — see below

  alarm_description = "Fires when primary ALB health check goes unhealthy"
}

output "primary_unhealthy_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.primary_unhealthy.arn
}