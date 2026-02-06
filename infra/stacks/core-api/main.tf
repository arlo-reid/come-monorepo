module "core-api" {
  for_each = toset(var.locations)

  name                     = "core-api-${var.geo_region}-${each.value}"
  source                   = "../../services/core-api"
  docker_tag               = var.docker_tag
  project                  = var.project
  location                 = each.value
  postgres_instance_name   = var.postgres_instance_name
  postgres_connection_name = var.postgres_connection_name
  db_user                  = var.db_user
  db_password              = var.db_password
  env_vars = merge(var.env_vars, {
    GOOGLE_CLOUD_PROJECT_NUMBER        = var.project_number
    GOOGLE_CLOUD_STORAGE_BUCKET        = var.storage_bucket_name
  })

  depends_on = []
}
