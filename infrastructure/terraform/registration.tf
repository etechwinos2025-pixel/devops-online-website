resource "null_resource" "build_register_lambda" {
  count = var.enable_registration_api ? 1 : 0

  triggers = {
    handler = filemd5("${path.module}/../../api/handler/lambda_function.py")
    reqs    = filemd5("${path.module}/../../api/handler/requirements.txt")
  }

  provisioner "local-exec" {
    command = "chmod +x ${path.module}/../../scripts/build-lambda.sh && ${path.module}/../../scripts/build-lambda.sh"
  }
}

data "archive_file" "register_lambda" {
  count = var.enable_registration_api ? 1 : 0

  depends_on = [null_resource.build_register_lambda]

  type        = "zip"
  source_dir  = "${path.module}/../../api/handler/build"
  output_path = "${path.module}/register_lambda.zip"
}

resource "aws_secretsmanager_secret" "google_sheets" {
  count = var.enable_registration_api ? 1 : 0

  name        = var.google_sheets_secret_name
  description = "Google service account JSON for DevOps training registration sheet"
}

resource "aws_iam_role" "register_lambda" {
  count = var.enable_registration_api ? 1 : 0

  name = "${var.project_name}-register-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "register_lambda" {
  count = var.enable_registration_api ? 1 : 0

  name = "${var.project_name}-register-lambda"
  role = aws_iam_role.register_lambda[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.google_sheets[0].arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "register" {
  count = var.enable_registration_api ? 1 : 0

  function_name = "${var.project_name}-register"
  role          = aws_iam_role.register_lambda[0].arn
  handler       = "lambda_function.handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.register_lambda[0].output_path
  source_code_hash = data.archive_file.register_lambda[0].output_base64sha256

  environment {
    variables = {
      NOTIFY_EMAIL      = var.registration_notify_email
      FROM_EMAIL        = var.ses_from_email
      SITE_URL          = "https://${local.registration_api_host}"
      CONTACT_PHONE     = "(330) 391-3130"
      GOOGLE_SHEET_ID   = var.google_sheet_id
      GOOGLE_SECRET_ARN = aws_secretsmanager_secret.google_sheets[0].arn
      SHEET_RANGE       = "A:G"
    }
  }
}

resource "aws_apigatewayv2_api" "register" {
  count = var.enable_registration_api ? 1 : 0

  name          = "${var.project_name}-register"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [for alias in local.aliases : "https://${alias}"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "register" {
  count = var.enable_registration_api ? 1 : 0

  api_id                 = aws_apigatewayv2_api.register[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.register[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "register_post" {
  count = var.enable_registration_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.register[0].id
  route_key = "POST /register"
  target    = "integrations/${aws_apigatewayv2_integration.register[0].id}"
}

resource "aws_apigatewayv2_route" "register_options" {
  count = var.enable_registration_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.register[0].id
  route_key = "OPTIONS /register"
  target    = "integrations/${aws_apigatewayv2_integration.register[0].id}"
}

resource "aws_apigatewayv2_stage" "register" {
  count = var.enable_registration_api ? 1 : 0

  api_id      = aws_apigatewayv2_api.register[0].id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "register_api" {
  count = var.enable_registration_api ? 1 : 0

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.register[0].execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "register_post_api" {
  count = var.enable_registration_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.register[0].id
  route_key = "POST /api/register"
  target    = "integrations/${aws_apigatewayv2_integration.register[0].id}"
}

resource "aws_apigatewayv2_route" "register_options_api" {
  count = var.enable_registration_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.register[0].id
  route_key = "OPTIONS /api/register"
  target    = "integrations/${aws_apigatewayv2_integration.register[0].id}"
}

resource "aws_ses_domain_identity" "site" {
  count  = var.enable_registration_api ? 1 : 0
  domain = trimsuffix(var.route53_zone_name, ".")
}

resource "aws_route53_record" "ses_verification" {
  count = var.enable_registration_api ? 1 : 0

  zone_id = local.route53_zone_id
  name    = "_amazonses.${trimsuffix(var.route53_zone_name, ".")}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.site[0].verification_token]
}

resource "aws_ses_domain_identity_verification" "site" {
  count  = var.enable_registration_api ? 1 : 0
  domain = aws_ses_domain_identity.site[0].id

  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_ses_domain_dkim" "site" {
  count  = var.enable_registration_api ? 1 : 0
  domain = aws_ses_domain_identity.site[0].domain
}

resource "aws_route53_record" "ses_dkim" {
  count = var.enable_registration_api ? 3 : 0

  zone_id = local.route53_zone_id
  name    = "${aws_ses_domain_dkim.site[0].dkim_tokens[count.index]}._domainkey"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.site[0].dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_email_identity" "notify" {
  count  = var.enable_registration_api ? 1 : 0
  email  = var.registration_notify_email
}
