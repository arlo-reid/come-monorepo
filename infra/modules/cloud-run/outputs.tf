output url {
  value = google_cloud_run_v2_service.default.uri
  description = "URL at which the service is available."
}

output name {
  value = google_cloud_run_v2_service.default.name
  description = "Name of service"
}

output neg {
  value = google_compute_region_network_endpoint_group.default
  description = "Network endpoint group"
}