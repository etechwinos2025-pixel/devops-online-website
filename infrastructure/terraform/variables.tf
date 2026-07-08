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
