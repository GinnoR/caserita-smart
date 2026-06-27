-- Migración para el Sistema de Proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
    id SERIAL PRIMARY KEY,
    cod_casero UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    phone TEXT,
    frequency TEXT,
    debt NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'ok',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS (Seguridad)
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Los caseros solo pueden ver sus propios proveedores
CREATE POLICY "Ver propios proveedores"
ON public.proveedores FOR SELECT
USING (auth.uid() = cod_casero);

-- Los caseros pueden insertar sus proveedores
CREATE POLICY "Insertar proveedores propios"
ON public.proveedores FOR INSERT
WITH CHECK (auth.uid() = cod_casero);

-- Los caseros pueden actualizar sus proveedores
CREATE POLICY "Actualizar proveedores propios"
ON public.proveedores FOR UPDATE
USING (auth.uid() = cod_casero);

-- Los caseros pueden eliminar sus proveedores
CREATE POLICY "Eliminar proveedores propios"
ON public.proveedores FOR DELETE
USING (auth.uid() = cod_casero);
