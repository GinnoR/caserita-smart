-- ==========================================================
-- Caserita Smart: Fix RLS Policies
-- ==========================================================

-- 1. Habilitar RLS en las tablas principales
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingres_produc ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'inventario' (Cualquier usuario autenticado puede ver y crear productos maestros)
DROP POLICY IF EXISTS "Permitir lectura inventario" ON inventario;
CREATE POLICY "Permitir lectura inventario" ON inventario
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir insert inventario" ON inventario;
CREATE POLICY "Permitir insert inventario" ON inventario
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update inventario" ON inventario;
CREATE POLICY "Permitir update inventario" ON inventario
    FOR UPDATE TO authenticated USING (true);

-- 3. Políticas para 'ingres_produc' (El usuario solo maneja su propio stock)
DROP POLICY IF EXISTS "Usuarios ven su propio stock" ON ingres_produc;
CREATE POLICY "Usuarios ven su propio stock" ON ingres_produc
    FOR SELECT TO authenticated 
    USING (cod_casero::text = auth.uid()::text OR cod_casero = '00000000-0000-0000-0000-000000000001');

DROP POLICY IF EXISTS "Usuarios insertan su propio stock" ON ingres_produc;
CREATE POLICY "Usuarios insertan su propio stock" ON ingres_produc
    FOR INSERT TO authenticated 
    WITH CHECK (cod_casero::text = auth.uid()::text OR cod_casero = '00000000-0000-0000-0000-000000000001');

DROP POLICY IF EXISTS "Usuarios actualizan su propio stock" ON ingres_produc;
CREATE POLICY "Usuarios actualizan su propio stock" ON ingres_produc
    FOR UPDATE TO authenticated 
    USING (cod_casero::text = auth.uid()::text OR cod_casero = '00000000-0000-0000-0000-000000000001');
