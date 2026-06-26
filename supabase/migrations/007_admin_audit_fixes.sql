-- Migration 007: Admin audit trail fixes
-- Adds missing indexes on admin_logs for audit queries

create index if not exists admin_logs_target_idx
  on public.admin_logs(target_table, action, created_at desc);

create index if not exists admin_logs_action_idx
  on public.admin_logs(action, created_at desc);
