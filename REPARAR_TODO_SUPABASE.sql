
-- 1. Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Asegurar que existe el perfil del casero demo (Don Pepe)
INSERT INTO users_profile (id, store_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Bodega Don Pepe')
ON CONFLICT (id) DO NOTHING;

-- 3. Asegurar que existe la info del casero para el catálogo (Yape/WhatsApp)
-- SUSTITUIR '900000000' con tu número real si deseas recibir los Yapes y mensajes
INSERT INTO cliente_casero (cod_casero, telefono, nombre_vendedor)
VALUES ('00000000-0000-0000-0000-000000000001', '51900000000', 'Don Pepe')
ON CONFLICT (cod_casero) DO NOTHING;

-- 4. Crear la tabla de pedidos_entrantes sin restricciones estrictas de FK para pruebas
CREATE TABLE IF NOT EXISTS pedidos_entrantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_casero UUID, -- Quitamos el REFERENCES para evitar errores si el ID no existe
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS y permitir inserciones públicas
ALTER TABLE pedidos_entrantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede insertar un pedido" ON pedidos_entrantes;
CREATE POLICY "Cualquiera puede insertar un pedido"
    ON pedidos_entrantes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Casero puede administrar sus pedidos_entrantes" ON pedidos_entrantes;
CREATE POLICY "Casero puede administrar sus pedidos_entrantes"
    ON pedidos_entrantes FOR ALL
    USING (true); -- Permitir ver todo durante pruebas, luego filtrar por id
