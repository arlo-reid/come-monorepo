variable "name" {
  type        = string
  description = "Name of the service."
}

variable "location" {
  type        = string
  description = "Location of the service."
}

variable "service_account_name" {
  type        = string
  default     = null
  description = "The service account to use"
}

variable "image" {
  type        = string
  description = "Docker image name."
}

variable "cpus" {
  type        = number
  default     = 1
  description = "Number of CPUs to allocate per container."
}

variable "memory" {
  type        = number
  default     = 512
  description = "Memory (in Mi) to allocate to containers. Minimum of 512Mi is required."
}

variable "allow_public_access" {
  type        = bool
  default     = false
  description = "Allow unauthenticated access to the service."
}

variable "cloud_sql_connections" {
  type        = list(string)
  default     = []
  description = "List of Cloud SQL instance connection names for Cloud Run to connect to."
}

variable "env" {
  type = list(object({
    name  = string
    value = optional(string)
    value_from = optional(
      object({
        name = string
        key  = string
      })
    )
  }))
  default     = []
  description = "Environment variables to inject into container instances."
}
