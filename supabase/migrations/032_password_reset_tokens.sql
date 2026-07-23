-- 032_password_reset_tokens.sql
-- Custom password reset token table (replaces Supabase built-in email flow)

CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens(token_hash);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only the service role (server-side) can access this table
CREATE POLICY "Service role manages reset tokens" ON public.password_reset_tokens
  FOR ALL USING (true)
  WITH CHECK (true);

-- Auto-expire old tokens (cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < now() - interval '1 day' OR used = true;
END;
$$;
