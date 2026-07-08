#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="${ROOT}/infrastructure/terraform"
SITE_DIR="${ROOT}/site"

cd "$TF_DIR"

if [[ ! -f terraform.tfvars ]]; then
  echo "Create infrastructure/terraform/terraform.tfvars from terraform.tfvars.example first."
  exit 1
fi

BUCKET="$(terraform output -raw site_bucket_name)"
DIST_ID="$(terraform output -raw cloudfront_distribution_id)"

echo "==> Syncing ${SITE_DIR} -> s3://${BUCKET}/"
aws s3 sync "$SITE_DIR" "s3://${BUCKET}/" --delete \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=3600"

echo "==> Invalidating CloudFront ${DIST_ID}"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --query 'Invalidation.Id' --output text

echo "==> Done"
terraform output website_urls
