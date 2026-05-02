-- ==========================================================
-- Caserita Smart: FIX RLS PARA MODO DEMO Y ANÓNIMO
-- ==========================================================
-- Este script permite que el usuario DEMO (0000...0001) y usuarios anónimos
-- puedan registrar ventas y alertas, resolviendo el error de "RLS policy violation".
-- Copia este código y ejecútalo en el SQL Editor de tu Dashboard de Supabase.

DO $$ 
BEGIN
    -- 1. FIX PARA LA TABLA VENTAS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ventas') THEN
        ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
        
        -- Permitir que usuarios anónimos o el usuario demo inserten ventas
        DROP POLICY IF EXISTS "Permitir ventas demo y anon" ON public.ventas;
        CREATE POLICY "Permitir ventas demo y anon" ON public.ventas
            FOR INSERT TO anon, authenticated
            WITH CHECK (
                cod_casero::text = auth.uid()::text 
                OR cod_casero = '00000000-0000-0000-0000-000000000001'
                OR auth.uid() IS NULL 
            );

        -- Permitir lectura propia (incluyendo demo)
        DROP POLICY IF EXISTS "Lectura ventas demo y propias" ON public.ventas;
        CREATE POLICY "Lectura ventas demo y propias" ON public.ventas
            FOR SELECT TO anon, authenticated
            USING (
                cod_casero::text = auth.uid()::text 
                OR cod_casero = '00000000-0000-0000-0000-000000000001'
            );
    END IF;

    -- 2. FIX PARA LA TABLA DETALLE_VENTAS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'detalle_ventas') THEN
        ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Acceso total detalles" ON public.detalle_ventas;
        CREATE POLICY "Acceso total detalles" ON public.detalle_ventas
            FOR ALL TO anon, authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    -- 3. FIX PARA LA TABLA ALERTAS_SEGURIDAD
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alertas_seguridad') THEN
        ALTER TABLE public.alertas_seguridad ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Inserción alertas demo y anon" ON public.alertas_seguridad;
        CREATE POLICY "Inserción alertas demo y anon" ON public.alertas_seguridad
            FOR INSERT TO anon, authenticated
            WITH CHECK (true);

        DROP POLICY IF EXISTS "Lectura alertas propias" ON public.alertas_seguridad;
        CREATE POLICY "Lectura alertas propias" ON public.alertas_seguridad
            FOR SELECT TO anon, authenticated
            USING (
                cod_casero::text = auth.uid()::text 
                OR cod_casero = '00000000-0000-0000-0000-000000000001'
            );
    END IF;

    -- 4. FIX PARA INGRES_PRODUC (Actualización de stock)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingres_produc') THEN
        ALTER TABLE public.ingres_produc ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Update stock demo y anon" ON public.ingres_produc;
        CREATE POLICY "Update stock demo y anon" ON public.ingres_produc
            FOR UPDATE TO anon, authenticated
            USING (
                cod_casero::text = auth.uid()::text 
                OR cod_casero = '00000000-0000-0000-0000-000000000001'
            )
            WITH CHECK (
                cod_casero::text = auth.uid()::text 
                OR cod_casero = '00000000-0000-0000-0000-000000000001'
            );
    END IF;

END $$;
