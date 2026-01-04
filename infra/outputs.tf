# ===========================================
# Staging Environment
# ===========================================

output "d1_database_id_stg" {
  description = "Staging D1 Database ID"
  value       = cloudflare_d1_database.scheduler_db_stg.id
}

output "kv_namespace_id_stg" {
  description = "Staging KV Namespace ID"
  value       = cloudflare_workers_kv_namespace.rate_limit_stg.id
}

# ===========================================
# Production Environment
# ===========================================

output "d1_database_id_prod" {
  description = "Production D1 Database ID"
  value       = cloudflare_d1_database.scheduler_db_prod.id
}

output "kv_namespace_id_prod" {
  description = "Production KV Namespace ID"
  value       = cloudflare_workers_kv_namespace.rate_limit_prod.id
}

# ===========================================
# JSON output for GitHub Actions
# ===========================================

output "github_variables" {
  description = "Variables to set in GitHub Environments"
  value = {
    staging = {
      D1_DATABASE_ID    = cloudflare_d1_database.scheduler_db_stg.id
      KV_NAMESPACE_ID   = cloudflare_workers_kv_namespace.rate_limit_stg.id
    }
    production = {
      D1_DATABASE_ID    = cloudflare_d1_database.scheduler_db_prod.id
      KV_NAMESPACE_ID   = cloudflare_workers_kv_namespace.rate_limit_prod.id
    }
  }
}
