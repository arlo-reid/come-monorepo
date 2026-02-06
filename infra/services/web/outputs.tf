output url {
  value = module.service.url
  description = "URL at which the service is available."
}
output name {
  value = module.service.name
  description = "Name of service"
}
output neg {
  value = module.service.neg
  description = "Network endpoint group"
}