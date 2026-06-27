-- Migration: Onboarding + Freemium System
-- Date: 2026-05-30
-- Description: Creates tables for onboarding tracking, feedback (free plan renewal), and subscriptions

-- ============================================================
-- TABLE: casero_onboarding
-- ============================================================
CREATE TABLE IF NOT EXISTS casero_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casero_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,   -- 0=not started, 1=name set, 2=ruc set, 3=complete
  bodega_name TEXT,
  ruc TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(casero_id)
);

-- RLS
ALTER TABLE casero_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casero_onboarding_own" ON casero_onboarding
  FOR ALL USING (auth.uid() = casero_id);

CREATE POLICY "casero_onboarding_admin_read" ON casero_onboarding
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TABLE: casero_feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS casero_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casero_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('publicidad', 'recomendacion', 'mejora')),
  content TEXT NOT NULL CHECK (char_length(content) >= 30),
  is_public BOOLEAN DEFAULT true,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE casero_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "casero_feedback_insert_own" ON casero_feedback
  FOR INSERT WITH CHECK (auth.uid() = casero_id);

-- Users can read their own feedback
CREATE POLICY "casero_feedback_select_own" ON casero_feedback
  FOR SELECT USING (auth.uid() = casero_id OR is_public = true);

-- Admin can read all
CREATE POLICY "casero_feedback_admin_all" ON casero_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TABLE: casero_subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS casero_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casero_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'annual', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_feedback', 'suspended', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                -- NULL = indefinite (renews with feedback)
  renewal_feedback_due_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  last_feedback_at TIMESTAMPTZ,
  price_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'PEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(casero_id)
);

ALTER TABLE casero_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casero_subscriptions_own" ON casero_subscriptions
  FOR ALL USING (auth.uid() = casero_id);

CREATE POLICY "casero_subscriptions_admin" ON casero_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FUNCTION: auto-create free subscription on onboarding complete
-- ============================================================
CREATE OR REPLACE FUNCTION handle_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- When step_completed reaches 3, create/update subscription
  IF NEW.step_completed = 3 AND (OLD.step_completed IS NULL OR OLD.step_completed < 3) THEN
    INSERT INTO casero_subscriptions (casero_id, plan_type, status)
    VALUES (NEW.casero_id, 'free', 'active')
    ON CONFLICT (casero_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_onboarding_complete
  AFTER UPDATE ON casero_onboarding
  FOR EACH ROW EXECUTE FUNCTION handle_onboarding_complete();

-- ============================================================
-- VIEW: admin_onboarding_stats
-- ============================================================
CREATE OR REPLACE VIEW admin_onboarding_stats AS
SELECT
  o.casero_id,
  o.bodega_name,
  o.ruc,
  o.step_completed,
  o.completed_at,
  s.plan_type,
  s.status AS subscription_status,
  s.last_feedback_at,
  s.renewal_feedback_due_at,
  (s.renewal_feedback_due_at < NOW() AND s.plan_type = 'free') AS feedback_overdue,
  COUNT(f.id) FILTER (WHERE f.created_at > NOW() - INTERVAL '30 days') AS feedback_last_30_days
FROM casero_onboarding o
LEFT JOIN casero_subscriptions s ON s.casero_id = o.casero_id
LEFT JOIN casero_feedback f ON f.casero_id = o.casero_id
GROUP BY o.casero_id, o.bodega_name, o.ruc, o.step_completed, o.completed_at,
         s.plan_type, s.status, s.last_feedback_at, s.renewal_feedback_due_at;

-- ============================================================
-- INDEX: performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_casero_onboarding_casero_id ON casero_onboarding(casero_id);
CREATE INDEX IF NOT EXISTS idx_casero_feedback_casero_id ON casero_feedback(casero_id);
CREATE INDEX IF NOT EXISTS idx_casero_feedback_type ON casero_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_casero_subscriptions_casero_id ON casero_subscriptions(casero_id);
CREATE INDEX IF NOT EXISTS idx_casero_subscriptions_due ON casero_subscriptions(renewal_feedback_due_at);
