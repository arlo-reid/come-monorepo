output "url" {
  description = "Global HTTPS load balancer URL"
  value       = "https://${google_compute_global_forwarding_rule.https.ip_address}"
}
