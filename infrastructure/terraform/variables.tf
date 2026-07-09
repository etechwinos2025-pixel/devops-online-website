variable "aws_region" {
  description = "Primary AWS region for S3 origin"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Resource name prefix"
  type        = string
  default     = "devops-online-website"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "domain_name" {
  description = "Primary hostname"
  type        = string
  default     = "training.excelcloudsolutions.com"
}

variable "alternate_domain_names" {
  description = "Additional hostnames on the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone (with trailing dot)"
  type        = string
  default     = "excelcloudsolutions.com."
}

variable "route53_zone_id" {
  description = "Optional existing zone ID; if empty, looked up by route53_zone_name"
  type        = string
  default     = ""
}

variable "create_route53_zone" {
  description = "Create a new public hosted zone"
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_registration_api" {
  description = "Deploy API + Lambda for registration form (SES email + Google Sheets)"
  type        = bool
  default     = true
}

variable "registration_notify_email" {
  description = "Email address that receives registration notifications"
  type        = string
  default     = "training@excelcloudsolutions.com"
}

variable "ses_from_email" {
  description = "Verified SES sender address"
  type        = string
  default     = "noreply@excelcloudsolutions.com"
}

variable "google_sheet_id" {
  description = "Google Sheet ID for registration log (leave empty until configured)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_sheets_secret_name" {
  type    = string
  default = "devops-online-website/google-sheets"
}
