variable "geo_region" {
  type        = string
  description = "Geographic region identifier (e.g., eu, us, asia) used for grouping multiple GCP regions"
}

variable "locations" {
  type        = list(string)
  description = "List of GCP regions to deploy the service to"
}

variable "project" {
  type = string
}

variable "project_number" {
  type        = string
  description = "GCP project number for Cloud Run URL construction"
}

variable "docker_tag" {
  type    = string
  default = "latest"
}

variable "postgres_instance_name" {
  type        = string
  description = "Name of the shared Postgres instance"
}

variable "postgres_connection_name" {
  type        = string
  description = "Connection name of the shared Postgres instance"
}

variable "storage_bucket_name" {
  type        = string
  description = "Name of the GCS bucket for storage"
}

variable "db_user" {
  description = "Database user for core-api"
  type        = string
}

variable "db_password" {
  description = "Database password for core-api"
  type        = string
  sensitive   = true
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "domain" {
  type        = string
  description = "Base domain for the load balancer"
}

variable "env_vars" {
  description = "Environment variables to pass to the service"
  type        = map(string)
  default     = {}
}
