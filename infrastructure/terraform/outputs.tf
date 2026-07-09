output "site_bucket_name" {
  value = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "website_urls" {
  value = [for alias in local.aliases : "https://${alias}"]
}

output "route53_zone_id" {
  value = local.route53_zone_id
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.site.arn
}

output "deploy_command" {
  value = "aws s3 sync site/ s3://${aws_s3_bucket.site.id}/ --delete && aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.site.id} --paths '/*'"
}

output "registration_api_url" {
  description = "Same-origin URL for registration form submissions"
  value = var.enable_registration_api ? "https://${local.registration_api_host}/api/register" : ""
}

output "google_sheets_secret_arn" {
  description = "Store Google service account JSON in this secret"
  value       = var.enable_registration_api ? aws_secretsmanager_secret.google_sheets[0].arn : ""
}

output "google_sheets_secret_name" {
  value = var.enable_registration_api ? aws_secretsmanager_secret.google_sheets[0].name : ""
}
