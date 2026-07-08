# DevOps Online Training Website

Static website for **Excel Cloud Solutions** DevOps online training program, hosted on AWS.

**Live URL:** [https://training.excelcloudsolutions.com](https://training.excelcloudsolutions.com)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Static HTML, CSS, vanilla JS |
| Hosting | S3 (private) + CloudFront + ACM + Route 53 |
| IaC | Terraform |
| CI/CD | GitHub Actions (optional) |

Estimated cost: ~$1–5/month at low traffic.

## Project structure

```
site/                          # Static website assets
infrastructure/terraform/      # AWS infrastructure (S3, CloudFront, ACM, Route 53)
scripts/deploy.sh              # Sync site to S3 + invalidate CloudFront
```

## Local preview

```bash
cd site && python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080)

## Deploy infrastructure

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

## Deploy website

```bash
./scripts/deploy.sh
```

## Pages

- **Home** — Program overview, curriculum, and enrollment CTA
- **Courses** — Training programs (Bootcamp, K8s, CI/CD, AWS)
- **Register** — Enrollment form
- **Contact** — Contact information

## License

MIT
