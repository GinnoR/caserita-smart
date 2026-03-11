-- MIGRACIÓN PARA PAGOS REALES (Múltiples números de Yape/Plin)
-- Agrega columnas para número de Yape y Plin al perfil del casero

ALTER TABLE cliente_casero 
ADD COLUMN IF NOT EXISTS yape_number TEXT,
ADD COLUMN IF NOT EXISTS plin_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_details TEXT;

-- Comentario informativo
COMMENT ON COLUMN cliente_casero.yape_number IS 'Número principal para recibir pagos por Yape';
COMMENT ON COLUMN cliente_casero.plin_number IS 'Número principal para recibir pagos por Plin';
COMMENT ON COLUMN cliente_casero.bank_account_details IS 'Detalles de cuenta bancaria para transferencias';
