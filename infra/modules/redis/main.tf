resource "google_redis_instance" "cache" {
  name           = var.name
  region         = var.region
  memory_size_gb = var.memory_size_gb
}
