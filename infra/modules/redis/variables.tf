variable region {
  type = string
  description = "Region of the service."
}

variable name {
  type = string
  description = "Name of the service."
}

variable memory_size_gb {
  type = number
  description = "Memory size in GB."
  default = 1
}