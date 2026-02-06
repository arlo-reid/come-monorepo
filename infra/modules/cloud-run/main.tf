resource "google_cloud_run_v2_service" "default" {
  name     = var.name
  location = var.location
  deletion_protection = false
  ingress = var.allow_public_access ? "INGRESS_TRAFFIC_ALL" : "INGRESS_TRAFFIC_INTERNAL_ONLY"
  
  template {
    service_account = var.service_account_name != null ? var.service_account_name : null
    
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = var.cloud_sql_connections
      }
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = "${var.cpus * 1000}m"
          memory = "${var.memory}Mi"
        }
      }

      dynamic "env" {
        for_each = try(var.env, [])

        content {
          name  = try(env.value.name, null)
          value = try(env.value.value, null)
        }
      }

    }
  }

  traffic {
    type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

}

resource "google_cloud_run_service_iam_member" "public_access" {
  count    = var.allow_public_access ? 1 : 0
  service  = google_cloud_run_v2_service.default.name
  location = google_cloud_run_v2_service.default.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_compute_region_network_endpoint_group" "default" {
  name                  = "${var.name}--neg"
  network_endpoint_type = "SERVERLESS"
  region                = google_cloud_run_v2_service.default.location
  cloud_run {
    service = google_cloud_run_v2_service.default.name
  }
}
