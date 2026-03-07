/**
 * supabase-service.ts
 * Capa de acceso a datos para Caserita Smart.
 * Usa las tablas del esquema maestro (supabase_maestro.sql).
 */

import { supabase } from '@/utils/supabase/client';
import { offlineService } from './offline-service';

const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url && url !== 'https://placeholder.supabase.co';
};

// ============================================================
// Tipos de datos (alineados con el esquema maestro)
// ============================================================

export interface InventoryItem {
    id: number;
    cod_bar_produc: string | null;
    nombre_producto: string;
    marca_producto: string | null;
    categoria: string | null;
    ubicacion?: string | null;
    fecha_caducidad?: string | null;
    // Campos de stock/precio del casero (cuando se hace join con ingres_produc)
    cantidad_ingreso?: number;
    p_u_venta?: number;
    p_u_compra?: number;
    um?: string;
    unidades_base?: number;
}

export interface SaleInsert {
    cod_casero?: string;
    total_venta: number;
    metodo_pago: string;
    cliente_id?: number | null;
    nombre_cajero?: string;
}

export interface SaleDetailInsert {
    venta_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
}

export interface AsistenteRow {
    id: number;
    cod_casero: string;
    apelativo: string;
    activo: boolean;
    autorizado_catalogo?: boolean;
    fecha_autorizacion?: string | null;
}

export interface Customer {
    id: number;
    cod_casero?: string;
    nombre_cliente: string;
    telefono?: string | null;
    deuda_total: number;
}

// ============================================================
// Módulo: Inventario
// ============================================================
export const supabaseService = {

    async getInventory(codCasero?: string): Promise<InventoryItem[]> {
        if (!isSupabaseConfigured()) {
            console.log('[Supabase] No configurado — devolviendo inventario de demostración');
            return getDemoInventory();
        }
        try {
            let finalInventory: InventoryItem[] = [];

            // Si hay un casero autenticado, traemos su stock con precios reales
            if (codCasero) {
                const { data, error } = await supabase
                    .from('ingres_produc')
                    .select(`
                        id, cantidad_ingreso, p_u_venta, p_u_compra,
                        inventario (
                            id, cod_bar_produc, nombre_producto, marca_producto, categoria, ubicacion, um, unidades_base
                        )
                    `)
                    .eq('cod_casero', codCasero)
                    .order('id', { ascending: true });

                if (!error && data && data.length > 0) {
                    finalInventory = data.map((row: any) => ({
                        id: row.inventario.id,
                        cod_bar_produc: row.inventario.cod_bar_produc,
                        nombre_producto: row.inventario.nombre_producto,
                        marca_producto: row.inventario.marca_producto,
                        categoria: row.inventario.categoria,
                        ubicacion: row.inventario.ubicacion,
                        fecha_caducidad: row.inventario.fecha_caducidad ?? null,
                        cantidad_ingreso: row.cantidad_ingreso ?? 50,
                        p_u_venta: row.p_u_venta ?? 1.50,
                        p_u_compra: row.p_u_compra ?? 1.00,
                        um: row.inventario.um ?? 'und',
                        unidades_base: row.inventario.unidades_base ?? 1,
                    }));
                } else if (codCasero === '00000000-0000-0000-0000-000000000001') {
                    // Si es el usuario DEMO y no hay stock en DB, devolver inventario realista de demostración
                    finalInventory = getDemoInventory();
                }
            }

            if (finalInventory.length === 0) {
                // Inventario maestro general (todos los productos, precios por defecto)
                const { data, error } = await supabase
                    .from('inventario')
                    .select('*')
                    .order('nombre_producto', { ascending: true });

                if (error) {
                    throw error;
                }
                finalInventory = (data || []).map(item => ({
                    id: item.id,
                    cod_bar_produc: item.cod_bar_produc,
                    nombre_producto: item.nombre_producto,
                    marca_producto: item.marca_producto,
                    categoria: item.categoria,
                    ubicacion: item.ubicacion,
                    um: item.um ?? 'und',
                    unidades_base: item.unidades_base ?? 1,
                    fecha_caducidad: item.fecha_caducidad ?? null,
                    cantidad_ingreso: 50,
                    p_u_venta: 1.50,
                    p_u_compra: 1.00,
                }));
            }

            // Guardar en cache local si tuvo éxito
            if (finalInventory.length > 0) {
                offlineService.saveInventory(finalInventory);
            }
            return finalInventory;
        } catch (e) {
            console.error('[Supabase] Error o sin conexión. Usando cache local:', e);
            const cached = offlineService.getInventory();
            return cached || getDemoInventory();
        }
    },

    // ============================================================
    // Módulo: Ventas
    // ============================================================

    async saveSale(sale: SaleInsert): Promise<number | null> {
        if (!isSupabaseConfigured()) {
            console.log('[Supabase] Mock: venta guardada localmente', sale);
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('ventas')
                .insert(sale)
                .select('id')
                .single();

            if (error) {
                console.error('[Supabase] Error al guardar venta:', error.message);
                return null;
            }
            return data?.id ?? null;
        } catch (e) {
            console.error('[Supabase] Excepción al guardar venta:', e);
            return null;
        }
    },

    async saveSaleDetails(details: SaleDetailInsert[]): Promise<void> {
        if (!isSupabaseConfigured() || details.length === 0) return;
        try {
            const { error } = await supabase
                .from('detalle_ventas')
                .insert(details);

            if (error) console.error('[Supabase] Error en detalles de venta:', error.message);
        } catch (e) {
            console.error('[Supabase] Excepción en detalles:', e);
        }
    },

    async getTodaySales(): Promise<any[]> {
        if (!isSupabaseConfigured()) return [];
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('ventas')
                .select('*')
                .gte('fecha_venta', today + 'T00:00:00')
                .order('fecha_venta', { ascending: false });

            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    },

    // ============================================================
    // Módulo: Clientes/Fiados
    // ============================================================

    async getCustomers(): Promise<Customer[]> {
        if (!isSupabaseConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nombre_cliente', { ascending: true });

            if (error) throw error;

            const customers = (data || []).map(c => ({
                id: c.id,
                nombre_cliente: c.nombre_cliente,
                telefono: c.telefono,
                deuda_total: c.deuda_total || 0,
            }));

            offlineService.saveCustomers(customers);
            return customers;
        } catch (e) {
            console.error('[Supabase] Error cargando clientes. Usando cache:', e);
            const cached = offlineService.getCustomers();
            return cached || [];
        }
    },

    async createCustomer(nombre: string, telefono?: string): Promise<Customer | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert({ nombre_cliente: nombre, telefono: telefono || null, deuda_total: 0 })
                .select()
                .single();

            if (error) return null;
            return data;
        } catch (e) {
            return null;
        }
    },

    async updateCustomerDebt(id: number, newDebt: number): Promise<void> {
        if (!isSupabaseConfigured()) return;
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ deuda_total: newDebt })
                .eq('id', id);

            if (error) console.error('[Supabase] Error al actualizar deuda:', error.message);
        } catch (e) {
            console.error('[Supabase] Excepción al actualizar deuda:', e);
        }
    },

    // ============================================================
    // Módulo: Perfil de Casero (cliente_casero)
    // ============================================================

    /**
     * Busca el perfil del casero en la tabla cliente_casero.
     * Si no existe, lo crea con los datos del usuario de Auth.
     */
    async ensureCaseroCasero(
        userId: string,
        nombre?: string,
        telefono?: string
    ): Promise<void> {
        if (!isSupabaseConfigured()) return;
        // Omitir registro para el usuario demo (evitar error RLS)
        if (userId === '00000000-0000-0000-0000-000000000001') return;
        try {
            const { data: existing } = await supabase
                .from('cliente_casero')
                .select('cod_casero')
                .eq('cod_casero', userId)
                .single();

            if (!existing) {
                // Crear perfil si no existe
                const { error } = await supabase
                    .from('cliente_casero')
                    .insert({
                        cod_casero: userId,
                        tipo_casero: 'vendedor',
                        nombre_vendedor: nombre || 'Mi Bodega',
                        telefono: telefono || null,
                    });
                if (error) console.error('[Supabase] Error al crear cliente_casero:', error.message);
                else console.log('[Supabase] Perfil caserito creado:', userId);
            }
        } catch (e) {
            console.error('[Supabase] Excepción en ensureCaseroCasero:', e);
        }
    },

    /**
     * Obtiene el QR de cobro desde Supabase.
     */
    async getQR(codCasero: string): Promise<string | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('cliente_casero')
                .select('qr_code_data')
                .eq('cod_casero', codCasero)
                .single();

            if (error) {
                // Si el error es p.e. que la columna no existe aún, devolvemos null silenciosamente
                return null;
            }
            return data?.qr_code_data || null;
        } catch (e) {
            console.error('[Supabase] Excepción en getQR:', e);
            return null;
        }
    },

    /**
     * Guarda el QR de cobro en Supabase.
     */
    async saveQR(codCasero: string, qrData: string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from('cliente_casero')
                .update({ qr_code_data: qrData } as any) // Cast as any to avoid TS errors before column exists
                .eq('cod_casero', codCasero);

            if (error) {
                console.error('[Supabase] Error al guardar QR:', error.message);
                return false;
            }
            return true;
        } catch (e) {
            console.error('[Supabase] Excepción en saveQR:', e);
            return false;
        }
    },

    // ============================================================
    // Módulo: Asistentes (Aux1, Aux2, Aux3...)
    // ============================================================

    async getAsistentes(codCasero: string): Promise<AsistenteRow[]> {
        if (!isSupabaseConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('asistentes')
                .select('*')
                .eq('cod_casero', codCasero)
                .order('id', { ascending: true });
            if (error) return [];
            return (data || []) as AsistenteRow[];
        } catch { return []; }
    },

    async saveAsistente(codCasero: string, apelativo: string): Promise<AsistenteRow | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('asistentes')
                .insert({ cod_casero: codCasero, apelativo, activo: true })
                .select()
                .single();
            if (error) { console.error('[Supabase] Error guardando asistente:', error.message); return null; }
            return data as AsistenteRow;
        } catch { return null; }
    },

    async toggleAsistente(id: number, activo: boolean): Promise<void> {
        if (!isSupabaseConfigured()) return;
        try {
            const { error } = await supabase
                .from('asistentes')
                .update({ activo })
                .eq('id', id);
            if (error) console.error('[Supabase] Error actualizando asistente:', error.message);
        } catch { }
    },

    async deleteAsistente(id: number): Promise<void> {
        if (!isSupabaseConfigured()) return;
        try {
            await supabase.from('asistentes').delete().eq('id', id);
        } catch { }
    },

    // ============================================================
    // Módulo: Actualización de Productos
    // ============================================================

    async updateProduct(productId: number, updates: {
        nombre_producto?: string;
        marca_producto?: string;
        categoria?: string;
        ubicacion?: string | null;
        cod_bar_produc?: string;
        fecha_caducidad?: string | null;
        um?: string;
        unidades_base?: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from('inventario')
                .update(updates)
                .eq('id', productId);

            if (error) {
                console.error('[Supabase] Error al actualizar producto:', error.message);
                return false;
            }
            console.log('[Supabase] Producto actualizado:', productId, updates);
            return true;
        } catch (e) {
            console.error('[Supabase] Excepción al actualizar producto:', e);
            return false;
        }
    },

    async updateProductPrice(codCasero: string, productId: number, newPrice: number): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from('ingres_produc')
                .update({ p_u_venta: newPrice })
                .eq('cod_casero', codCasero)
                .eq('producto_id', productId);

            if (error) {
                // Si inventario_id no existe como columna, intentar con id vinculando por inventario
                console.error('[Supabase] Error al actualizar precio:', error.message);
                return false;
            }
            return true;
        } catch { return false; }
    },

    // ============================================================
    // Módulo: Autorización de Asistentes para Catálogo
    // ============================================================

    async authorizeAsistente(id: number, autorizar: boolean): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const { error } = await supabase
                .from('asistentes')
                .update({
                    autorizado_catalogo: autorizar,
                    fecha_autorizacion: autorizar ? new Date().toISOString() : null,
                })
                .eq('id', id);
            if (error) {
                console.error('[Supabase] Error autorizando asistente:', error.message);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    },

    async getAsistenteByName(codCasero: string, apelativo: string): Promise<AsistenteRow | null> {
        if (!isSupabaseConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('asistentes')
                .select('id, cod_casero, apelativo, activo, autorizado_catalogo, fecha_autorizacion')
                .eq('cod_casero', codCasero)
                .eq('apelativo', apelativo)
                .single();
            if (error || !data) return null;
            return data as AsistenteRow;
        } catch {
            return null;
        }
    },
};

// ============================================================
// Inventario de demostración (cuando Supabase no está configurado)
// ============================================================
function getDemoInventory(): InventoryItem[] {
    return [
        { id: 101, cod_bar_produc: 'AB-101', nombre_producto: 'Arroz Extra Costeño (Saco 50kg)', marca_producto: 'Costeño', categoria: 'Abarrotes', cantidad_ingreso: 5, p_u_venta: 185.00, p_u_compra: 162.00, um: 'Kg', unidades_base: 50 },
        { id: 102, cod_bar_produc: 'AB-102', nombre_producto: 'Azúcar Rubia Paramonga (Saco 50kg)', marca_producto: 'Paramonga', categoria: 'Abarrotes', cantidad_ingreso: 8, p_u_venta: 160.00, p_u_compra: 140.00, um: 'Kg', unidades_base: 50 },
        { id: 103, cod_bar_produc: 'AB-103', nombre_producto: 'Aceite Primor Premium 1L', marca_producto: 'Primor', categoria: 'Aceites', cantidad_ingreso: 24, p_u_venta: 8.50, p_u_compra: 7.20, um: 'Lt', unidades_base: 1 },
        { id: 104, cod_bar_produc: 'AB-104', nombre_producto: 'Leche Gloria Tarro Azul (Six Pack)', marca_producto: 'Gloria', categoria: 'Lácteos', cantidad_ingreso: 15, p_u_venta: 23.50, p_u_compra: 20.00, um: 'pqte', unidades_base: 6 },
        { id: 105, cod_bar_produc: 'AB-105', nombre_producto: 'Fideos Lavaggi Tallarín 500g', marca_producto: 'Lavaggi', categoria: 'Abarrotes', cantidad_ingreso: 40, p_u_venta: 3.20, p_u_compra: 2.60, um: 'und', unidades_base: 1 },
        { id: 106, cod_bar_produc: 'AB-106', nombre_producto: 'Huevos Rosados (Jabita x30)', marca_producto: 'Granja', categoria: 'Lácteos', cantidad_ingreso: 12, p_u_venta: 16.50, p_u_compra: 14.20, um: 'und', unidades_base: 30 },
        { id: 107, cod_bar_produc: 'AB-107', nombre_producto: 'Lenteja Serrana 1kg', marca_producto: 'Granel', categoria: 'Legumbres', cantidad_ingreso: 25, p_u_venta: 7.80, p_u_compra: 6.50, um: 'Kg', unidades_base: 1 },
        { id: 108, cod_bar_produc: 'AB-108', nombre_producto: 'Papa Canchán Seleccionada 1kg', marca_producto: 'Mercado', categoria: 'Verduras', cantidad_ingreso: 100, p_u_venta: 2.50, p_u_compra: 1.80, um: 'Kg', unidades_base: 1 },
        { id: 109, cod_bar_produc: 'AB-109', nombre_producto: 'Cebolla Roja 1kg', marca_producto: 'Mercado', categoria: 'Verduras', cantidad_ingreso: 80, p_u_venta: 3.80, p_u_compra: 2.90, um: 'Kg', unidades_base: 1 },
        { id: 110, cod_bar_produc: 'AB-110', nombre_producto: 'Pollo Fresco con Menudencia 1kg', marca_producto: 'San Fernando', categoria: 'Carnes', cantidad_ingreso: 30, p_u_venta: 11.20, p_u_compra: 9.50, um: 'Kg', unidades_base: 1 },
        { id: 201, cod_bar_produc: 'BEB-101', nombre_producto: 'Inka Kola 3L (Botella)', marca_producto: 'Coca-Cola', categoria: 'Bebidas', cantidad_ingreso: 20, p_u_venta: 12.50, p_u_compra: 10.80, um: 'und', unidades_base: 1 },
        { id: 202, cod_bar_produc: 'BEB-102', nombre_producto: 'Cerveza Pilsen Callao (Caja x12)', marca_producto: 'Backus', categoria: 'Bebidas', cantidad_ingreso: 10, p_u_venta: 65.00, p_u_compra: 56.00, um: 'caja', unidades_base: 12 },
        { id: 203, cod_bar_produc: 'BEB-103', nombre_producto: 'Agua Cielo 2.5L', marca_producto: 'AJE', categoria: 'Bebidas', cantidad_ingreso: 30, p_u_venta: 3.00, p_u_compra: 2.20, um: 'und', unidades_base: 1 },
        { id: 301, cod_bar_produc: 'LIM-101', nombre_producto: 'Detergente Opal Ultra 1kg', marca_producto: 'Alicorp', categoria: 'Limpieza', cantidad_ingreso: 18, p_u_venta: 9.80, p_u_compra: 8.40, um: 'Kg', unidades_base: 1 },
        { id: 302, cod_bar_produc: 'LIM-102', nombre_producto: 'Lejía Sapolio Tradicional 1L', marca_producto: 'Sapolio', categoria: 'Limpieza', cantidad_ingreso: 25, p_u_venta: 3.50, p_u_compra: 2.70, um: 'und', unidades_base: 1 },
        { id: 303, cod_bar_produc: 'LIM-103', nombre_producto: 'Jabón Bolívar Glicerina', marca_producto: 'Bolívar', categoria: 'Limpieza', cantidad_ingreso: 50, p_u_venta: 4.20, p_u_compra: 3.40, um: 'und', unidades_base: 1 },
        { id: 401, cod_bar_produc: 'SNK-101', nombre_producto: 'Galletas Soda Field (Pack x6)', marca_producto: 'Mondelēz', categoria: 'Snacks', cantidad_ingreso: 36, p_u_venta: 5.50, p_u_compra: 4.60, um: 'pqte', unidades_base: 6 },
        { id: 402, cod_bar_produc: 'SNK-102', nombre_producto: 'Papas Lay\'s Clásicas Familiar', marca_producto: 'PepsiCo', categoria: 'Snacks', cantidad_ingreso: 15, p_u_venta: 7.20, p_u_compra: 5.80, um: 'und', unidades_base: 1 },
        { id: 111, cod_bar_produc: 'AB-111', nombre_producto: 'Mantequilla Laive con Sal 200g', marca_producto: 'Laive', categoria: 'Lácteos', cantidad_ingreso: 20, p_u_venta: 6.80, p_u_compra: 5.50, um: 'und', unidades_base: 1 },
        { id: 112, cod_bar_produc: 'AB-112', nombre_producto: 'Yogurt Gloria Fresa 1L', marca_producto: 'Gloria', categoria: 'Lácteos', cantidad_ingreso: 15, p_u_venta: 6.50, p_u_compra: 5.20, um: 'und', unidades_base: 1 },
        { id: 113, cod_bar_produc: 'AB-113', nombre_producto: 'Avena 3 Ositos 500g', marca_producto: 'Alicorp', categoria: 'Desayuno', cantidad_ingreso: 24, p_u_venta: 4.50, p_u_compra: 3.60, um: 'und', unidades_base: 1 },
        { id: 114, cod_bar_produc: 'AB-114', nombre_producto: 'Café Altomayo Instantáneo 200g', marca_producto: 'Altomayo', categoria: 'Desayuno', cantidad_ingreso: 12, p_u_venta: 18.20, p_u_compra: 15.00, um: 'und', unidades_base: 1 },
        { id: 115, cod_bar_produc: 'AB-115', nombre_producto: 'Pan de Molde Bimbo Blanco Grande', marca_producto: 'Bimbo', categoria: 'Panadería', cantidad_ingreso: 10, p_u_venta: 10.50, p_u_compra: 8.80, um: 'und', unidades_base: 1 },
        { id: 304, cod_bar_produc: 'LIM-104', nombre_producto: 'Papel Higiénico Elite (Paquete x4)', marca_producto: 'Elite', categoria: 'Limpieza', cantidad_ingreso: 20, p_u_venta: 7.50, p_u_compra: 6.10, um: 'pqte', unidades_base: 4 },
        { id: 116, cod_bar_produc: 'AB-116', nombre_producto: 'Sal Marina Emsal 1kg', marca_producto: 'Emsal', categoria: 'Condimentos', cantidad_ingreso: 50, p_u_venta: 1.80, p_u_compra: 1.40, um: 'Kg', unidades_base: 1 },
        { id: 117, cod_bar_produc: 'AB-117', nombre_producto: 'Filete de Atún Campomar', marca_producto: 'Campomar', categoria: 'Abarrotes', cantidad_ingreso: 48, p_u_venta: 6.20, p_u_compra: 5.20, um: 'und', unidades_base: 1 },
        { id: 118, cod_bar_produc: 'AB-118', nombre_producto: 'Ajinomoto 100g', marca_producto: 'Ajinomoto', categoria: 'Condimentos', cantidad_ingreso: 100, p_u_venta: 2.50, p_u_compra: 2.10, um: 'und', unidades_base: 1 },
        { id: 119, cod_bar_produc: 'AB-119', nombre_producto: 'Mayonesa Alacena 400g (Doypack)', marca_producto: 'Alacena', categoria: 'Condimentos', cantidad_ingreso: 15, p_u_venta: 8.90, p_u_compra: 7.60, um: 'und', unidades_base: 1 },
        { id: 204, cod_bar_produc: 'BEB-104', nombre_producto: 'Yogurt Griego Tigo Natural', marca_producto: 'Tigo', categoria: 'Lácteos', cantidad_ingreso: 8, p_u_venta: 14.50, p_u_compra: 12.20, um: 'und', unidades_base: 1 },
        { id: 120, cod_bar_produc: 'AB-120', nombre_producto: 'Queso Edam Laive Tajado 200g', marca_producto: 'Laive', categoria: 'Lácteos', cantidad_ingreso: 12, p_u_venta: 13.50, p_u_compra: 11.40, um: 'und', unidades_base: 1 },
    ];
}
