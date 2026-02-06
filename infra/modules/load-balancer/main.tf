locals {
  # Flatten all services into a single list with service_name and geo_region
  # Example: [{ service = "core-api", geo_region = "eu", ... }, { service = "core-api", geo_region = "us", ... }]
  all_service_geo_pairs = flatten([
    for service_name, geo_regions in var.services : [
      for geo_region, service_group in geo_regions : {
        service_name = service_name
        geo_region   = service_group.geo_region
        negs         = service_group.negs
      }
    ]
  ])

  # Generate SSL certificate domains for all services and geo regions
  # Format: {geo_region}.{service_name}-{env}.{domain}
  # Example: eu.core-api-dev.bloomingsurveys.ai
  all_domains = [
    for pair in local.all_service_geo_pairs :
    "${pair.geo_region}-${pair.service_name}-${var.environment}.${var.domain}"
  ]
}

###########################################################
## Backend services (one per service + geo_region)
## Each backend aggregates NEGs from multiple GCP regions
###########################################################

resource "google_compute_backend_service" "service" {
  for_each = {
    for pair in local.all_service_geo_pairs :
    "${pair.service_name}-${pair.geo_region}-backend" => pair
  }

  name        = each.key
  description = "Backend for ${each.value.service_name} in ${each.value.geo_region} (multiple GCP regions)"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  
  # HTTP backend in front of Cloud Run serverless NEGs
  protocol  = "HTTP"
  port_name = "http"

  timeout_sec = 30

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  # Attach all NEGs for this service+geo_region
  dynamic "backend" {
    for_each = each.value.negs
    content {
      group = backend.value.neg_id
    }
  }
}

###########################################################
## URL map with host rules per service + geo_region
###########################################################

resource "google_compute_url_map" "url_map" {
  name = "${var.name}-url-map"

  # Default to the first available backend
  default_service = google_compute_backend_service.service[
    "${local.all_service_geo_pairs[0].service_name}-${local.all_service_geo_pairs[0].geo_region}-backend"
  ].self_link

  # Host: {geo_region}.{service_name}-{env}.{domain}
  dynamic "host_rule" {
    for_each = local.all_service_geo_pairs
    content {
      hosts        = ["${host_rule.value.geo_region}-${host_rule.value.service_name}-${var.environment}.${var.domain}"]
      path_matcher = "${host_rule.value.service_name}-${host_rule.value.geo_region}-matcher"
    }
  }

  dynamic "path_matcher" {
    for_each = local.all_service_geo_pairs
    content {
      name = "${path_matcher.value.service_name}-${path_matcher.value.geo_region}-matcher"
      default_service = google_compute_backend_service.service[
        "${path_matcher.value.service_name}-${path_matcher.value.geo_region}-backend"
      ].self_link
    }
  }
}

###########################################################
## HTTPS frontend: managed cert, proxy, forwarding rule
###########################################################

resource "google_compute_managed_ssl_certificate" "lb_cert" {
  # Use a unique name based on domains hash to allow certificate recreation
  name = "${var.name}-managed-cert-${substr(md5(join(",", sort(local.all_domains))), 0, 8)}"

  managed {
    domains = local.all_domains
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name    = "${var.name}-https-proxy"
  url_map = google_compute_url_map.url_map.self_link

  ssl_certificates = [
    google_compute_managed_ssl_certificate.lb_cert.self_link,
  ]
}

resource "google_compute_global_address" "lb_ip" {
  name = "${var.name}-ip"
}

resource "google_compute_global_forwarding_rule" "https" {
  name       = "${var.name}-https-forwarding-rule"
  target     = google_compute_target_https_proxy.https_proxy.self_link
  port_range = "443"
  ip_address = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
