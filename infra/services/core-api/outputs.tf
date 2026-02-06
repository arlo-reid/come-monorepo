output "url" {
  value       = module.service.url
  description = "URL at which the service is available."
}
output "name" {
  value       = module.service.name
  description = "Name of service"
}
output "neg" {
  value       = module.service.neg
  description = "Network endpoint group"
}
output "service_account_email" {
  value       = google_service_account.service_account.email
  description = "Email of the service account"
}
output "database_name" {
  value       = google_sql_database.database.name
  description = "Name of the database"
}