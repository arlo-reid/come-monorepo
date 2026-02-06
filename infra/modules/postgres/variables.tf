variable "name" {
  type = string
}

variable "region" {
  type = string
}

variable "tier" {
  type    = string
  default = "db-f1-micro"
}

variable "max_connections" {
  type    = number
  default = 100
}

variable "edition" {
  type    = string
  default = "ENTERPRISE"
}

variable "database_name" {
  type        = string
  description = "Name of the database to create within the PostgreSQL instance, this is optional and if not provided, then no database will be created"
  default     = null
}
