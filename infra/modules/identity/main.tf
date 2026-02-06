resource "google_identity_platform_config" "default" {
  sign_in {
    anonymous {
        enabled = true
    }
    email {
        enabled = true
        password_required = true
    }
  }
  authorized_domains = [
    "localhost",
  ]
}
