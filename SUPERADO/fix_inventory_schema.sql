-- ==========================================================
-- Caserita Smart: Fix Schema (Missing Columns in Inventario)
-- ==========================================================

-- Ejecuta esto en el SQL Editor de Supabase para añadir las columnas faltantes
-- que el sistema de "Abarrotes" y el "Modal de Escaneo" requieren.

ALTER TABLE inventario ADD COLUMN IF NOT EXISTS um TEXT DEFAULT 'und';
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS unidades_base INTEGER DEFAULT 1;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS fecha_caducidad DATE;

-- Asegurar que los productos existentes tengan valores por defecto si estaban vacíos
UPDATE inventario SET um = 'und' WHERE um IS NULL;
UPDATE inventario SET unidades_base = 1 WHERE unidades_base IS NULL;
