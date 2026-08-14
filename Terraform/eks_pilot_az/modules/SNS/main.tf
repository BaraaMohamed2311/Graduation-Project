
# ==========================================
# SNS Topic for failover alerts
# ==========================================


resource "aws_sns_topic" "failover_scaleup_alerts" {
  # provider = aws.primary
  name     = "eks-failover-scaleup-alerts"
}

resource "aws_sns_topic_policy" "failover_scaleup_alerts_policy" {
  arn = aws_sns_topic.failover_scaleup_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudWatchPublish"
      Effect    = "Allow"
      Principal = { Service = "cloudwatch.amazonaws.com" }
      Action    = "sns:Publish"
      Resource  = aws_sns_topic.failover_scaleup_alerts.arn
      Condition = {
        ArnLike = {
          "aws:SourceArn" = var.cw_metric_alarm_arn
        }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "scaleup_lambda_sub" {
  provider      = aws.lambda_region
  topic_arn = aws_sns_topic.failover_scaleup_alerts.arn
  protocol  = "lambda"
  endpoint  = var.failover_scaleup_function_arn
}

resource "aws_lambda_permission" "scaleup_allow_sns" {
  provider      = aws.lambda_region
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.failover_scaleup_function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.failover_scaleup_alerts.arn
}


# ==========================================
# SNS Topic for failover alerts
# ==========================================
resource "aws_sns_topic" "failover_scaledown_alerts" {
  # provider = aws.primary
  name     = "eks-failover-scaledown-alerts"
}

resource "aws_sns_topic_policy" "failover_scaledown_alerts_policy" {
  arn = aws_sns_topic.failover_scaledown_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudWatchPublish"
      Effect    = "Allow"
      Principal = { Service = "cloudwatch.amazonaws.com" }
      Action    = "sns:Publish"
      Resource  = aws_sns_topic.failover_scaledown_alerts.arn
      Condition = {
        ArnLike = {
          "aws:SourceArn" = var.cw_metric_alarm_arn
        }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "scaledown_lambda_sub" {
  provider      = aws.lambda_region
  topic_arn = aws_sns_topic.failover_scaledown_alerts.arn
  protocol  = "lambda"
  endpoint  = var.failover_scaledown_function_arn
}

resource "aws_lambda_permission" "scaledown_allow_sns" {
  provider      = aws.lambda_region
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.failover_scaledown_function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.failover_scaledown_alerts.arn
}


output "failover_alerts_scaleup_topic_arn" {
  value = aws_sns_topic.failover_scaleup_alerts.arn
}

output "failover_alerts_scaledown_topic_arn" {
  value = aws_sns_topic.failover_scaledown_alerts.arn
}

