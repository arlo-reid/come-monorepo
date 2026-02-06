output "instance_name" {
  value = google_sql_database_instance.postgres.name
}
output "connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}
output "api_user" {
  value = google_sql_user.api.name
}

output "api_password" {
  value     = google_sql_user.api.password
  sensitive = true
}

output "location" {
  description = "The location/region of the PostgreSQL instance"
  value       = google_sql_database_instance.postgres.region
}
