
-- Tabla para monitorear carritos en tiempo real
CREATE TABLE IF NOT EXISTS carritos_activos (
    id UUID PRIMARY KEY, -- Session ID del cliente móvil
    cod_casero UUID REFERENCES auth.users(id),
    cliente_nombre TEXT,
    items JSONB DEFAULT '[]'::jsonB,
    total DECIMAL(10,2) DEFAULT 0,
    metodo_pago TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime para esta tabla
ALTER publication supabase_realtime ADD TABLE carritos_activos;

-- Habilitar RLS
ALTER TABLE carritos_activos ENABLE ROW LEVEL SECURITY;

-- Política para que el cliente móvil inserte/actualice su propio carrito
CREATE POLICY "Permitir gestión de carrito propio" 
ON carritos_activos FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Política para que el casero vea carritos activos
CREATE POLICY "Dueño ve carritos activos" 
ON carritos_activos FOR SELECT 
TO authenticated 
USING (auth.uid() = cod_casero);
