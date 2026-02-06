# TF CLI

A command-line tool for managing Google Cloud Platform infrastructure and local development environments for this monorepo.

## Prerequisites

Before using the CLI, ensure you have the following installed and configured:

- **Node.js** (v18+)
- **Google Cloud SDK** (`gcloud`) - [Installation guide](https://cloud.google.com/sdk/docs/install)
- **GitHub CLI** (`gh`) - [Installation guide](https://cli.github.com/)

You must be authenticated with both tools:

```bash
# Authenticate with Google Cloud
gcloud auth login

# Authenticate with GitHub
gh auth login
```

## Installation

The CLI is available as part of the monorepo. From the root directory:

```bash
# Install dependencies
npm install

# Run the CLI using npx
npx tf --help
```

## Commands

### Infrastructure Commands (`tf infra`)

Commands for setting up and managing GCP infrastructure.

#### `tf infra init`

**Interactive setup wizard** that provisions the complete GCP infrastructure for a new environment.

```bash
tf infra init
```

This command will prompt you for:

| Prompt | Description |
|--------|-------------|
| Environment | Target environment (e.g., `demo`) |
| Region | GCP region for resources (e.g., `europe-west2`) |
| Prefix | Unique project prefix (lowercase, no numbers at start) |
| Organization | Your GCP organization |
| Folder | Optional GCP folder for project organization |
| Billing Account | GCP billing account to link |

The wizard then automatically:

1. Creates a GCP project with the naming pattern `<prefix>-<uid>-<environment>`
2. Creates a service account for GitHub Actions
3. Creates Terraform state and Turborepo cache buckets
4. Creates an Artifact Registry for Docker images
5. Configures local Terraform files
6. Sets up GitHub Actions variables and secrets

---

#### `tf infra setup-project`

Creates and configures a new GCP project.

```bash
tf infra setup-project <project> <billing-account-id> <organizationId> [folderId]
```

| Argument | Description |
|----------|-------------|
| `project` | Project name/ID |
| `billing-account-id` | GCP billing account ID |
| `organizationId` | GCP organization ID |
| `folderId` | (Optional) GCP folder ID |

**Enables the following GCP APIs:**
- Cloud Resource Manager
- Cloud SQL Admin
- Secret Manager
- IAM

---

#### `tf infra create-service-account`

Creates a service account with permissions for GitHub Actions CI/CD.

```bash
tf infra create-service-account <iam>
```

| Argument | Description |
|----------|-------------|
| `iam` | Service account in format `<account>@<project>.iam.gserviceaccount.com` |

**Assigned IAM roles:**

| Role | Purpose |
|------|---------|
| `roles/editor` | Terraform resource management |
| `roles/storage.objectAdmin` | State bucket + Turborepo access |
| `roles/secretmanager.admin` | Secret management |
| `roles/run.admin` | Cloud Run services |
| `roles/iam.serviceAccountTokenCreator` | Docker buildx caching |
| `roles/resourcemanager.projectIamAdmin` | IAM policy management |
| `roles/storage.admin` | Storage bucket management |

---

#### `tf infra create-service-account-keys`

Creates service account keys and stores them in GitHub secrets.

```bash
tf infra create-service-account-keys <iam>
```

Stores the key as `GOOGLE_CLOUD_TOKEN_<ENVIRONMENT>` in GitHub secrets (base64-encoded JSON).

---

#### `tf infra create-terraform-bucket`

Creates a GCS bucket for Terraform remote state.

```bash
tf infra create-terraform-bucket <iam> <bucket>
```

| Argument | Description |
|----------|-------------|
| `iam` | Service account IAM |
| `bucket` | Bucket name |

Sets GitHub variable: `PROJECT_TF_STATE_BUCKET_<ENVIRONMENT>`

---

#### `tf infra create-turborepo-bucket`

Creates a GCS bucket for Turborepo remote caching.

```bash
tf infra create-turborepo-bucket <iam>
```

Sets GitHub variable: `PROJECT_TURBOREPO_BUCKET_<ENVIRONMENT>`

---

#### `tf infra create-container-registry`

Creates an Artifact Registry repository for Docker images.

```bash
tf infra create-container-registry <iam>
```

Creates a repository named `registry` in the `us` region.

---

#### `tf infra configure-terraform-bucket-locally`

Configures local Terraform to use the remote state bucket.

```bash
tf infra configure-terraform-bucket-locally <iam> <bucket>
```

Creates `infra/envs/<environment>/backend.tf` with GCS backend configuration.

---

#### `tf infra configure-terraform-vars-locally`

Creates local Terraform variable files.

```bash
tf infra configure-terraform-vars-locally <iam> <region> <prefix>
```

Creates `infra/envs/<environment>/terraform.tfvars` with:
- `region`
- `project`
- `docker_tag`
- `prefix`

---

#### `tf infra setup-secrets`

Interactively configures environment secrets in Google Secret Manager.

```bash
tf infra setup-secrets <environment>
```

Prompts for and stores the following secrets:

| Secret | Description |
|--------|-------------|
| `CLERK_ISSUER` | Clerk authentication issuer |
| `CLERK_JWSK_URL` | Clerk JWKS URL |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

---

### Development Commands (`tf dev`)

Commands for local development setup.

#### `tf dev init`

Sets up local `.env` files by pulling secrets from Google Secret Manager.

```bash
tf dev init
```

This command:

1. Reads the `dev` environment configuration from GitHub variables
2. Fetches Clerk secrets from Google Secret Manager
3. Merges secrets with each app's `.env.example` file
4. Writes the merged configuration to `.env` files in `/apps/*`

**Affected files:**
- `apps/<app>/.env` (created/overwritten for each app)

---

## Supported Regions

The CLI supports all standard GCP regions:

**Americas:**
- `us-central1`, `us-east1`, `us-east4`, `us-east5`, `us-south1`
- `us-west1`, `us-west2`, `us-west3`, `us-west4`
- `northamerica-northeast1`, `northamerica-northeast2`
- `southamerica-east1`, `southamerica-west1`

**Europe:**
- `europe-central2`, `europe-north1`, `europe-southwest1`
- `europe-west1`, `europe-west2`, `europe-west3`, `europe-west4`
- `europe-west6`, `europe-west8`, `europe-west9`, `europe-west10`
- `europe-west12`

**Asia Pacific:**
- `asia-east1`, `asia-east2`
- `asia-northeast1`, `asia-northeast2`, `asia-northeast3`
- `asia-south1`, `asia-south2`
- `asia-southeast1`, `asia-southeast2`
- `australia-southeast1`, `australia-southeast2`

**Middle East & Africa:**
- `me-central1`, `me-central2`, `me-west1`
- `africa-south1`

---

## Project Naming Convention

Projects are named using the pattern:

```
<prefix>-<uid>-<environment>
```

| Component | Description |
|-----------|-------------|
| `prefix` | User-provided identifier (lowercase, max ~20 chars) |
| `uid` | Auto-generated 5-character alphanumeric ID |
| `environment` | Target environment (e.g., `demo`) |

**Example:** `myapp-abc12-demo`

---

## GitHub Integration

The CLI stores configuration in GitHub repository variables and secrets:

### Variables

| Variable | Description |
|----------|-------------|
| `PROJECT_UID_<ENV>` | Unique project identifier |
| `PROJECT_PREFIX_<ENV>` | Project prefix |
| `PROJECT_REGION_<ENV>` | GCP region |
| `PROJECT_TF_STATE_BUCKET_<ENV>` | Terraform state bucket name |
| `PROJECT_TURBOREPO_BUCKET_<ENV>` | Turborepo cache bucket name |

### Secrets

| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | GitHub token for Actions |
| `GOOGLE_CLOUD_TOKEN_<ENV>` | Service account key (base64 JSON) |

---

## Troubleshooting

### Authentication Issues

```bash
# Re-authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Re-authenticate with GitHub
gh auth login
```

### Permission Errors

Ensure your Google Cloud account has:
- Organization Admin or Project Creator role
- Billing Account User role on the billing account
- Folder Admin if using folders

### Service Account Creation Timeout

The CLI waits up to 60 seconds for service account creation. If it times out:
1. Check if the service account was partially created in GCP Console
2. Delete it manually if needed
3. Re-run the command

---

## Quick Start

1. **Initial Setup** (one-time):
   ```bash
   tf infra init
   ```

2. **Configure Secrets**:
   ```bash
   tf infra setup-secrets demo
   ```

3. **Local Development**:
   ```bash
   tf dev init
   ```

4. **Deploy**: Run the deployment workflow from GitHub Actions
