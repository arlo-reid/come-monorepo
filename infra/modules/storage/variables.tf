variable "location" {
  type        = string
  description = "Region/location"
}

variable "project" {
  type        = string
  description = "The GCP project ID"
}

variable "name" {
  type        = string
  description = "Name of the storage bucket"
}

variable "cors_origins" {
  type        = list(string)
  description = "List of origins allowed for CORS"
  default     = []
}
