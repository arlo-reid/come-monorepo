module "service" {
  name                 = var.name
  source               = "../../modules/cloud-run"
  location             = var.location
  image                = "us-docker.pkg.dev/${var.project}/registry/core-api:${var.docker_tag}"
  cpus                 = 2
  memory               = 2048
  service_account_name = google_service_account.service_account.email
  env = concat([
    for key, value in var.env_vars : { name = key, value = value }
    ], [
    # Add any service-specific environment variables that need to be computed
    { name : "NODE_ENV", value : "production" },
    { name : "CORE_API_ENV_PATH", value : "/apps/core-api" },
    { name : "SKIP_SECRETS", value : "false" },
    { name : "SERVICE_NAME", value : "core-api" },
    {
      name  = "DATABASE_URL"
      value = "postgresql://${var.db_user}:${urlencode(var.db_password)}@localhost:5432/${google_sql_database.database.name}?host=/cloudsql/${var.postgres_connection_name}"
    },
    {
      name  = "GOOGLE_CLOUD_PROJECT"
      value = var.project
    },
    {
      name  = "GOOGLE_CLOUD_PROJECT_LOCATION"
      value = var.location
    }
  ])

  cloud_sql_connections = [var.postgres_connection_name]
  depends_on          = [null_resource.iam_depends_on]
  allow_public_access = true
}