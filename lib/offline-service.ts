import { db } from './db';
import { supabaseService } from './supabase-service';

const KEYS = {
    INVENTORY: 'caserita_cache_inventory',
    CUSTOMERS: 'caserita_cache_customers',
    LAST_SYNC: 'caserita_last_sync_time'
};

export const offlineService = {
    // --- CACHE DE DATOS ---
    saveInventory(data: any[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(data));
        localStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());
    },

    getInventory(): any[] | null {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(KEYS.INVENTORY);
        return data ? JSON.parse(data) : null;
    },

    saveCustomers(data: any[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data));
    },

    getCustomers(): any[] | null {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : null;
    },

    // --- COLA DE SINCRONIZACIÓN (VENTAS) CON DEXIE ---

    async addToSyncQueue(sale: any, details: any[]) {
        if (typeof window === 'undefined') return;
        const id = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        
        await db.pendingSales.add({
            id,
            sale,
            details,
            timestamp: Date.now(),
            status: 'pending'
        });
        
        console.log('📦 Venta añadida a la cola offline (IndexedDB):', id);
        return id;
    },

    async getPendingQueueCount(): Promise<number> {
        if (typeof window === 'undefined') return 0;
        return await db.pendingSales.where('status').equals('pending').count();
    },

    // --- SINCRONIZADOR EN SEGUNDO PLANO ---
    
    async syncPendingSales() {
        if (typeof window === 'undefined') return;
        
        const pending = await db.pendingSales.where('status').equals('pending').toArray();
        if (pending.length === 0) return;

        console.log(`🔄 Iniciando sincronización de ${pending.length} ventas offline...`);

        for (const item of pending) {
            try {
                // Marcar como en proceso
                await db.pendingSales.update(item.id!, { status: 'syncing' });

                // Intentar guardar en Supabase
                const saleId = await supabaseService.saveSale(item.sale);
                if (saleId) {
                    // Si hay detalles, vincularlos al nuevo saleId
                    if (item.details && item.details.length > 0) {
                        const finalDetails = item.details.map(d => ({ ...d, venta_id: saleId }));
                        await supabaseService.saveSaleDetails(finalDetails);
                        // Actualizar stock
                        await supabaseService.updateInventoryStock(item.sale.cod_casero, finalDetails);
                    }
                    
                    // Si todo fue bien, borrar de la cola local
                    await db.pendingSales.delete(item.id!);
                    console.log(`✅ Venta offline sincronizada: ${item.id} -> Supabase ID: ${saleId}`);
                } else {
                    // Falló la inserción (ej. sin conexión nuevamente), regresar a pending
                    await db.pendingSales.update(item.id!, { status: 'pending' });
                }
            } catch (err: any) {
                console.error(`❌ Error sincronizando venta ${item.id}:`, err);
                await db.pendingSales.update(item.id!, { status: 'failed', error: err.message });
            }
        }
    }
};
