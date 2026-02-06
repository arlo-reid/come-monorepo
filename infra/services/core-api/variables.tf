variable "name" {
  type        = string
  description = "Google cloud run name as well as docker container name"
}

variable "location" {
  type        = string
  description = "Region/location"
}

variable "docker_tag" {
  type = string
}

variable "project" {
  type        = string
  description = "Project id"
}

variable "postgres_instance_name" {
  type        = string
  description = "postgres_instance_name"
}

variable "postgres_connection_name" {
  type        = string
  description = "postgres_connection_name"
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

variable "env_vars" {
  description = "Environment variables to pass to the service"
  type        = map(string)
  default     = {}
}