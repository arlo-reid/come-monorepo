resource "google_sql_database" "database" {
  name     = var.name
  instance = var.postgres_instance_name
}
