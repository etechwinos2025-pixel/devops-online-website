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
API_URL="$(terraform output -raw registration_api_url 2>/dev/null || true)"

cat > "${SITE_DIR}/js/config.js" <<EOF
window.SITE_CONFIG = {
  phoneDisplay: "(330) 391-3130",
  phoneTel: "+13303913130",
  contactEmail: "training@excelcloudsolutions.com",
  siteUrl: "https://www.training.excelcloudsolutions.com",
  siteDisplay: "www.training.excelcloudsolutions.com",
  companyUrl: "https://www.excelcloudsolutions.com",
  companyDisplay: "www.excelcloudsolutions.com",
  programWeeks: 16,
  apiUrl: "${API_URL}",
};
EOF

echo "==> Syncing ${SITE_DIR} -> s3://${BUCKET}/"
aws s3 sync "$SITE_DIR" "s3://${BUCKET}/" --delete \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=3600"

echo "==> Invalidating CloudFront ${DIST_ID}"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --query 'Invalidation.Id' --output text

echo "==> Done"
terraform output website_urls
