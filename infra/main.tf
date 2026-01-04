# ===========================================
# D1 Databases
# ===========================================

resource "cloudflare_d1_database" "scheduler_db_stg" {
  account_id = var.cloudflare_account_id
  name       = "ai-scheduler-db-stg"

  lifecycle {
    ignore_changes = all
  }
}

resource "cloudflare_d1_database" "scheduler_db_prod" {
  account_id = var.cloudflare_account_id
  name       = "ai-scheduler-db-prod"

  lifecycle {
    ignore_changes = all
  }
}

# ===========================================
# KV Namespaces (Rate Limiting)
# ===========================================

resource "cloudflare_workers_kv_namespace" "rate_limit_stg" {
  account_id = var.cloudflare_account_id
  title      = "ai-scheduler-rate-limit-stg"
}

resource "cloudflare_workers_kv_namespace" "rate_limit_prod" {
  account_id = var.cloudflare_account_id
  title      = "ai-scheduler-rate-limit-prod"
}
