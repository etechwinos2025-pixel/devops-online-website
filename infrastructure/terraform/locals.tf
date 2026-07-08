locals {
  site_bucket_name = "${var.project_name}-site-${data.aws_caller_identity.current.account_id}"
  aliases          = distinct(concat([var.domain_name], var.alternate_domain_names))
}

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "primary" {
  count = var.create_route53_zone ? 0 : 1

  name         = var.route53_zone_name
  private_zone = false
}

resource "aws_route53_zone" "primary" {
  count = var.create_route53_zone ? 1 : 0

  name = trimsuffix(var.route53_zone_name, ".")
}

locals {
  route53_zone_id = var.create_route53_zone ? aws_route53_zone.primary[0].zone_id : (
    var.route53_zone_id != "" ? var.route53_zone_id : data.aws_route53_zone.primary[0].zone_id
  )
}
