
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

/**
 * Tipos de la base de datos Caserita Smart — alineados con supabase_maestro.sql
 */
export interface Database {
    public: {
        Tables: {
            inventario: {
                Row: {
                    id: number
                    cod_bar_produc: string | null
                    nombre_producto: string
                    marca_producto: string | null
                    categoria: string | null
                    ubicacion: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    cod_bar_produc?: string | null
                    nombre_producto: string
                    marca_producto?: string | null
                    categoria?: string | null
                    ubicacion?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    cod_bar_produc?: string | null
                    nombre_producto?: string
                    marca_producto?: string | null
                    categoria?: string | null
                    ubicacion?: string | null
                    created_at?: string | null
                }
            }
            ingres_produc: {
                Row: {
                    id: number
                    cod_casero: string | null
                    producto_id: number | null
                    cantidad_ingreso: number
                    p_u_compra: number
                    p_u_venta: number | null
                    costo_diferencial: number | null
                    margen_sol: number | null
                    precio_costo: number | null
                    fecha_ingreso: string | null
                }
                Insert: {
                    id?: number
                    cod_casero?: string | null
                    producto_id?: number | null
                    cantidad_ingreso?: number
                    p_u_compra?: number
                    p_u_venta?: number | null
                    costo_diferencial?: number | null
                    margen_sol?: number | null
                    fecha_ingreso?: string | null
                }
                Update: {
                    id?: number
                    cod_casero?: string | null
                    producto_id?: number | null
                    cantidad_ingreso?: number
                    p_u_compra?: number
                    p_u_venta?: number | null
                }
            }
            ventas: {
                Row: {
                    id: number
                    cod_casero: string | null
                    fecha_venta: string
                    total_venta: number
                    metodo_pago: string | null
                    cliente_id: number | null
                }
                Insert: {
                    id?: number
                    cod_casero?: string | null
                    fecha_venta?: string
                    total_venta: number
                    metodo_pago?: string | null
                    cliente_id?: number | null
                }
                Update: {
                    id?: number
                    total_venta?: number
                    metodo_pago?: string | null
                }
            }
            detalle_ventas: {
                Row: {
                    id: number
                    venta_id: number | null
                    producto_id: number | null
                    cantidad: number
                    precio_unitario: number
                    subtotal: number | null
                }
                Insert: {
                    id?: number
                    venta_id: number
                    producto_id?: number | null
                    cantidad: number
                    precio_unitario: number
                }
                Update: {
                    id?: number
                    cantidad?: number
                    precio_unitario?: number
                }
            }
            clientes: {
                Row: {
                    id: number
                    cod_casero: string | null
                    nombre_cliente: string
                    telefono: string | null
                    deuda_total: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    cod_casero?: string | null
                    nombre_cliente: string
                    telefono?: string | null
                    deuda_total?: number | null
                }
                Update: {
                    id?: number
                    nombre_cliente?: string
                    deuda_total?: number | null
                }
            }
            cliente_casero: {
                Row: {
                    cod_casero: string
                    tipo_casero: string
                    nombre_vendedor: string | null
                    distrito: string | null
                    telefono: string | null
                    panic_word: string | null
                    created_at: string | null
                }
                Insert: {
                    cod_casero: string
                    tipo_casero?: string
                    nombre_vendedor?: string | null
                    distrito?: string | null
                    telefono?: string | null
                    panic_word?: string | null
                }
                Update: {
                    tipo_casero?: string
                    nombre_vendedor?: string | null
                    district?: string | null
                    panic_word?: string | null
                }
            }
        }
    }
}
