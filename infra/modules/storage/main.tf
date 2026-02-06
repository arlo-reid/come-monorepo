resource "google_storage_bucket" "storage" {
  name                        = "${var.name}-storage"
  location                    = var.location
  project                     = var.project
  force_destroy               = false
  uniform_bucket_level_access = true
}
