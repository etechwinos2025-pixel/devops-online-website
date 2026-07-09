# Registration notifications setup

When a student submits the registration form, AWS Lambda will:

1. Append their details to a **Google Sheet**
2. Email you at the configured address with a **CSV attachment** of all registrations

## Prerequisites

- AWS registration API deployed (`terraform apply` with `enable_registration_api = true`)
- A Google account to create the sheet and service account

## Step 1 — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it **DevOps Training Registrations**.
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

## Step 2 — Google Cloud service account

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or use an existing one).
3. Enable **Google Sheets API** (APIs & Services → Library).
4. Create a **Service Account** (IAM & Admin → Service Accounts).
5. Create a JSON key and download it.

## Step 3 — Share the sheet

Share the Google Sheet with the service account email (e.g. `devops-sheets@your-project.iam.gserviceaccount.com`) as **Editor**.

## Step 4 — Store credentials in AWS

```bash
aws secretsmanager put-secret-value \
  --secret-id devops-online-website/google-sheets \
  --secret-string file://path/to/service-account.json
```

## Step 5 — Update Terraform variables

Edit `infrastructure/terraform/terraform.tfvars`:

```hcl
google_sheet_id           = "YOUR_SHEET_ID"
registration_notify_email = "your-email@example.com"
```

Then apply:

```bash
cd infrastructure/terraform
terraform apply
./scripts/deploy.sh
```

## Step 6 — Verify SES email (sandbox)

AWS SES starts in **sandbox mode**. Verify the notification email:

1. Check the inbox for `registration_notify_email` and click the AWS verification link.
2. Domain `excelcloudsolutions.com` is verified automatically via Terraform for sending from `noreply@excelcloudsolutions.com`.

Request [SES production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) to send to any email without individual verification.

## Test

Submit the form at https://www.training.excelcloudsolutions.com/register.html

You should receive an email with `registrations.csv` attached and a new row in your Google Sheet.
