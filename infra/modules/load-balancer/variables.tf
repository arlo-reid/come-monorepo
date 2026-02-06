variable "domain" {
  type        = string
  description = "Domain name"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

variable "name" {
  type        = string
  description = "Name of the service."
}

variable "project" {
  type = string
}

variable "services" {
  description = <<-EOT
    Map of all services to expose through the load balancer.
    Structure:
    {
      "service-name" = {
        "geo-region" = {
          geo_region = "eu"
          negs = [...]
        }
      }
    }
    Example:
    {
      "core-api" = {
        "eu" = { geo_region = "eu", negs = [...] }
        "us" = { geo_region = "us", negs = [...] }
      }
      "generator-api" = {
        "eu" = { geo_region = "eu", negs = [...] }
      }
    }
  EOT
  type = map(map(object({
    geo_region = string
    negs = list(object({
      gcp_region   = string
      neg_id       = string
      neg_name     = string
      service_name = string
      url          = string
    }))
  })))
}