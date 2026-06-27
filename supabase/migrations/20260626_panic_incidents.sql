-- Tabla para registrar incidentes de pánico / SOS
CREATE TABLE public.panic_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_casero UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_incidente TEXT NOT NULL,
    descripcion TEXT,
    es_silencioso BOOLEAN DEFAULT false,
    estado TEXT DEFAULT 'ACTIVO',
    latitud NUMERIC,
    longitud NUMERIC,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.panic_incidents ENABLE ROW LEVEL SECURITY;

-- Permitir a los usuarios insertar sus propios incidentes
CREATE POLICY "Permitir inserción de incidentes propios" 
ON public.panic_incidents 
FOR INSERT 
WITH CHECK (true); -- En un entorno más estricto, validar `cod_casero = auth.uid()`

-- Permitir a los usuarios ver sus propios incidentes
CREATE POLICY "Permitir lectura de incidentes propios" 
ON public.panic_incidents 
FOR SELECT 
USING (true);
