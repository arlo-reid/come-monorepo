resource "google_sql_database_instance" "postgres" {
  name             = var.name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    edition = var.edition
    # Second-generation instance tiers are based on the machine
    # type. See argument reference below.
    tier = var.tier

    database_flags {
      name  = "max_connections"
      value = var.max_connections
    }
  }
}

resource "google_sql_database" "database" {
  count    = (var.database_name != null && var.database_name != "") ? 1 : 0
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

resource "random_password" "api_password" {
  length = 16
}

resource "google_sql_user" "api" {
  name     = "api"
  password = random_password.api_password.result
  instance = google_sql_database_instance.postgres.name
}


