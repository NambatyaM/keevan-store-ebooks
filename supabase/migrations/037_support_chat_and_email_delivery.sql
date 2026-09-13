-- ============================================================================
-- 037 — Support chat + email delivery tracking + notifications
-- Adds: support_conversations, support_messages, email_queue delivery columns,
-- and guarantees the notifications table exists (missing in some DBs).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Support conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'buyer',
  email text NOT NULL,
  name text NOT NULL DEFAULT 'Customer',
  subject text NOT NULL DEFAULT 'Support request',
  category text NOT NULL DEFAULT 'other',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'awaiting_admin', 'resolved', 'closed')),
  access_token text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status
  ON public.support_conversations (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user
  ON public.support_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_email
  ON public.support_conversations (email);

DROP TRIGGER IF EXISTS support_conversations_updated_at ON public.support_conversations;
CREATE TRIGGER support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Support messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user'
    CHECK (sender_role IN ('user', 'admin', 'bot')),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'text'
    CHECK (kind IN ('text', 'attachment', 'download', 'system')),
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
  ON public.support_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- 3. RLS — access is via API routes (service role); these policies keep the
-- raw data API safe for owners only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users view own conversations" ON public.support_conversations;
CREATE POLICY "users view own conversations" ON public.support_conversations
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users insert own conversations" ON public.support_conversations;
CREATE POLICY "users insert own conversations" ON public.support_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own conversations" ON public.support_conversations;
CREATE POLICY "users update own conversations" ON public.support_conversations
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users view own messages" ON public.support_messages;
CREATE POLICY "users view own messages" ON public.support_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.support_conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users insert own messages" ON public.support_messages;
CREATE POLICY "users insert own messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.support_conversations WHERE user_id = auth.uid()
    )
  );

GRANT ALL ON public.support_conversations TO anon, authenticated, service_role;
GRANT ALL ON public.support_messages TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. email_queue — track Resend message id + delivery status so the admin
-- panel can show delivery confirmation per order.
-- ---------------------------------------------------------------------------
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS resend_id text;
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_email_queue_resend_id
  ON public.email_queue (resend_id);

-- ---------------------------------------------------------------------------
-- 4b. email_deliveries — permanent per-order log of every confirmation email
-- sent (instant or via cron) with Resend delivery status, so the admin panel
-- can confirm a buyer received their download link email.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  type text NOT NULL DEFAULT 'order_confirmation',
  product_title text,
  download_token text,
  resend_id text,
  delivery_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_order
  ON public.email_deliveries (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status
  ON public.email_deliveries (delivery_status);

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage email deliveries" ON public.email_deliveries;
CREATE POLICY "Admins manage email deliveries" ON public.email_deliveries
  FOR ALL USING (public.is_admin());

GRANT ALL ON public.email_deliveries TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. notifications — the app + issue bot use this as the in-dashboard feed.
-- Originally defined in migration 008 but missing in some databases, which
-- broke the admin notification bell. Recreated idempotently.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

GRANT ALL ON public.notifications TO anon, authenticated, service_role;