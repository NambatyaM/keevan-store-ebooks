-- Migration 006: Withdrawal & earnings audit fixes
-- Adds missing index for creator withdrawal history queries

create index if not exists withdrawals_creator_requested_idx
  on public.withdrawal_requests(creator_id, requested_at desc);
