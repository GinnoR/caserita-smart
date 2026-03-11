
-- MIGRACIÓN PARA MODO DEMO Y LLAVES DE ACCESO
-- Aplicar esto en el editor SQL de Supabase

-- 1. Añadir columnas a cliente_casero
ALTER TABLE cliente_casero 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '30 days'),
ADD COLUMN IF NOT EXISTS access_key TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'; -- 'trial', 'active', 'expired'

-- 2. Habilitar RLS si no estuviera (ya debería estarlo)
ALTER TABLE cliente_casero ENABLE ROW LEVEL SECURITY;

-- 3. Crear función para validar llaves (opcional, se puede hacer por código)
-- Por ahora lo manejaremos directamente en la lógica del Dashboard.
