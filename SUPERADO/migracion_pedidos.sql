-- Creación de la tabla de Pedidos Entrantes (Catálogo Móvil)
CREATE TABLE IF NOT EXISTS pedidos_entrantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_casero UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('Efectivo', 'Yape', 'Transferencia', 'Fiado')),
    estado TEXT CHECK (estado IN ('pendiente', 'atendido', 'cancelado')) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Seguridad (RLS)
ALTER TABLE pedidos_entrantes ENABLE ROW LEVEL SECURITY;

-- 1. Casero puede ver y actualizar solo sus propios pedidos recibidos
CREATE POLICY "Casero puede administrar sus pedidos_entrantes"
    ON pedidos_entrantes FOR ALL
    USING (auth.uid() = cod_casero);

-- 2. Clientes Anónimos (Cualquiera con el Link) pueden insertar un pedido para un Casero específico
CREATE POLICY "Cualquiera puede insertar un pedido"
    ON pedidos_entrantes FOR INSERT
    WITH CHECK (true); -- Cualquiera puede hacerlo, el casero_id debe venir en el payload
