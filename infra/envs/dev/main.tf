locals {
  environment = "dev"
  domain      = "thoughtandfunction.com"

  core_api_env_vars = {
    APP_ENV                     = "DEV"
    SERVICE_NAME                = "core-api"
    WEBAPP_URL                  = "http://localhost:3000,http://localhost,*.vercel.app"
    SENTRY_DSN                  = "https://fd30fb140e7fb768792c5cd18a711884@o114201.ingest.us.sentry.io/4509728673562624"
    SENTRY_TRACES_SAMPLE_RATE   = "1"
    POSTHOG_API_KEY             = "phc_XnfP8IeI2xTT8BQDtILNkgExXOPn1redrHGAGQ8n8GJ"
    POSTHOG_HOST                = "https://eu.i.posthog.com"
    POSTHOG_PERSON_DELETION_KEY = "1"
    MAILERSEND_FROM_EMAIL       = "support@thoughtandfunction.com"
    ADMIN_EMAIL                 = "qatesting+admin-${local.environment}@thoughtandfunction.com"
    FIREBASE_PUBLIC_KEY         = "eyAiYXBpS2V5IjogIkFJemFTeUJHZGh6dXlzdnhzLTJDMnNzQ2hUM05laHZObTBUV0hGcyIsICJhdXRoRG9tYWluIjogInNwLTFtdmUyLWRldi5maXJlYmFzZWFwcC5jb20iIH0="
  }
}

# Get project info
data "google_project" "current" {
  project_id = var.project
}

module "google-services" {
  source = "../../modules/google-services"
}

# EU database
module "postgres-core-eu" {
  source = "../../modules/postgres"
  name   = "core-db-eu"
  region = "europe-west2"
}

# EU storage
module "storage-eu" {
  source   = "../../modules/storage"
  project  = var.project
  location = "europe-west2"
  name     = "${var.project}-eu"

  cors_origins = [
    "http://localhost:3000",
    "https://dev.bloomingsurveys.ai"
  ]
}

module "stack-core-api-eu" {
  source                     = "../../stacks/core-api"
  geo_region                 = "eu"
  locations                  = ["europe-west2"]
  project                    = var.project
  project_number             = data.google_project.current.number
  postgres_instance_name     = module.postgres-core-eu.instance_name
  postgres_connection_name   = module.postgres-core-eu.connection_name
  db_user                    = module.postgres-core-eu.api_user
  db_password                = module.postgres-core-eu.api_password
  environment                = local.environment
  domain                     = local.domain
  docker_tag                 = var.docker_tag
  env_vars                   = local.core_api_env_vars
  storage_bucket_name        = module.storage-eu.storage_bucket_name

  depends_on = [module.google-services, module.postgres-core-eu, module.storage-eu]
}

module "lb" {
  source      = "../../modules/load-balancer"
  name        = "global-lb"
  project     = var.project
  environment = local.environment
  domain      = local.domain

  # Generic services map - add any service without modifying the LB module
  services = {
    "core-api" = {
      eu = module.stack-core-api-eu.core-api-services
    }
  }
}
