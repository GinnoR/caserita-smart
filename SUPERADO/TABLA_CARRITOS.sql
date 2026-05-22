
-- Tabla para persistencia de carritos en tiempo real
CREATE TABLE IF NOT EXISTS carritos_activos (
    id UUID PRIMARY KEY, -- Usamos el sessionId del localStorage
    cod_casero TEXT,     -- Slug o UUID del casero
    cliente_nombre TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(10,2) DEFAULT 0,
    metodo_pago TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para carritos
ALTER TABLE carritos_activos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo en carritos_activos" ON carritos_activos;
CREATE POLICY "Permitir todo en carritos_activos"
    ON carritos_activos FOR ALL
    USING (true)
    WITH CHECK (true);
