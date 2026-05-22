
-- 1. Eliminar la restricción de llave foránea que está bloqueando el demo
-- Esto permite que 'cliente_casero' acepte el UUID 0000...01 aunque no sea un usuario real de Auth
ALTER TABLE cliente_casero 
DROP CONSTRAINT IF EXISTS cliente_casero_cod_casero_fkey;

-- 2. Asegurar que existe la info del casero para el catálogo (Yape/WhatsApp)
-- SUSTITUIR '51900000000' con tu número real si deseas recibir los Yapes y mensajes
INSERT INTO cliente_casero (cod_casero, telefono, nombre_vendedor)
VALUES ('00000000-0000-0000-0000-000000000001', '51900000000', 'Don Pepe')
ON CONFLICT (cod_casero) DO UPDATE 
SET telefono = EXCLUDED.telefono, nombre_vendedor = EXCLUDED.nombre_vendedor;

-- 3. Crear la tabla de pedidos_entrantes (si no existe)
-- Sin FK a users_profile para evitar el mismo error en el catálogo
CREATE TABLE IF NOT EXISTS pedidos_entrantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_casero UUID, 
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS y permitir inserciones públicas
ALTER TABLE pedidos_entrantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede insertar un pedido" ON pedidos_entrantes;
CREATE POLICY "Cualquiera puede insertar un pedido"
    ON pedidos_entrantes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Casero puede administrar sus pedidos_entrantes" ON pedidos_entrantes;
CREATE POLICY "Casero puede administrar sus pedidos_entrantes"
    ON pedidos_entrantes FOR ALL
    USING (true);
