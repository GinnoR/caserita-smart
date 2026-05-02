-- ==========================================================
-- Sincronización Automática de Stock (Trigger)
-- ==========================================================
-- Este script crea una función y un trigger para descontar stock
-- automáticamente cuando se inserta un registro en detalle_ventas.

-- 1. Función de descuento de stock
CREATE OR REPLACE FUNCTION public.fn_descontar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_cod_casero UUID;
BEGIN
    -- Obtener el cod_casero de la venta asociada
    SELECT cod_casero INTO v_cod_casero
    FROM public.ventas
    WHERE id = NEW.venta_id;

    -- Actualizar el stock en ingres_produc
    UPDATE public.ingres_produc
    SET cantidad_ingreso = GREATEST(0, cantidad_ingreso - NEW.cantidad)
    WHERE producto_id = NEW.producto_id
      AND cod_casero = v_cod_casero;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger
DROP TRIGGER IF EXISTS tr_descontar_stock_venta ON public.detalle_ventas;
CREATE TRIGGER tr_descontar_stock_venta
AFTER INSERT ON public.detalle_ventas
FOR EACH ROW
EXECUTE FUNCTION public.fn_descontar_stock_venta();

-- 3. Nota: Esto garantiza integridad incluso si el cliente falla al llamar a updateInventoryStock.
