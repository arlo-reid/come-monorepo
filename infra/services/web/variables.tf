variable name {
  type = string
  description = "Google cloud run name as well as docker container name"
}

variable location {
  type = string
  description = "Region/location"
}

variable "docker_tag" {
  type = string
}

variable project {
  type = string
  description = "Project id"
}

variable core_api_url {
  type = string
  description = "core-api url"
}
