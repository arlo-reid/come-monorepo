output "service_info" {
  value = {
    geo_region   = var.geo_region
    gcp_region   = var.locations[0]
    priority     = 1
    neg_id       = module.core-api[var.locations[0]].neg.id
    service_name = module.core-api[var.locations[0]].name
    url          = module.core-api[var.locations[0]].url
    docker_tag   = var.docker_tag
  }
}

output "core-api-negs" {
  value = [
    for instance in module.core-api :
    instance.neg
  ]
  description = "core-api negs created"
}

output "core-api-services" {
  description = "Core-API service information grouped by geo region"
  value = {
    geo_region = var.geo_region
    negs = [
      for location, service in module.core-api : {
        gcp_region   = location
        neg_id       = service.neg.id
        neg_name     = service.neg.name
        service_name = service.name
        url          = service.url
      }
    ]
  }
}