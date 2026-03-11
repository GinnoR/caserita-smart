-- 1. Añadimos soporte para "código de barras" a la tabla de inventario del caserito
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);

-- 2. Creamos la base de datos Maestra Mundial (Global)
CREATE TABLE IF NOT EXISTS productos_maestra (
    barcode TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    rubro TEXT NOT NULL DEFAULT 'Bodega', -- Bodega, Ferretería, Obra, Farmacia, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) -- Opcional: Para saber quién registró el producto
);

-- 3. Creamos un índice para buscar súper rápido por rubro
CREATE INDEX IF NOT EXISTS idx_maestra_rubro ON productos_maestra(rubro);

-- =========================================================================
-- DATOS DE MOVIMIENTO (Para salvar la cuenta hoy mismo de la inactividad)
-- Insertamos solo unos cuantos códigos de prueba simulando el archivo de Perú.
-- Luego podrás borrar estos si lo deseas.
-- =========================================================================

INSERT INTO productos_maestra (barcode, product_name, category, brand, rubro) VALUES
('101209159', 'Producto Peruano Prueba 1', 'Abarrotes', 'Genérica', 'Bodega'),
('105000011', 'Producto Peruano Prueba 2', 'Abarrotes', 'Genérica', 'Bodega'),
('105000042', 'Producto Peruano Prueba 3', 'Abarrotes', 'Genérica', 'Bodega'),
('105000059', 'Producto Peruano Prueba 4', 'Abarrotes', 'Genérica', 'Bodega'),
('105000073', 'Producto Peruano Prueba 5', 'Abarrotes', 'Genérica', 'Bodega'),
('105000196', 'Clavo de 1 Pulgada', 'Construcción', 'Aceros', 'Obra'),
('105000219', 'Arena Fina x bolsa', 'Construcción', 'Genérica', 'Obra'),
('105000318', 'Martillo Goma', 'Herramientas', 'Stanley', 'Ferretería')
ON CONFLICT (barcode) DO NOTHING;
