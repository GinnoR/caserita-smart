/**
 * offline-service.ts
 * Maneja el almacenamiento local (localStorage) para permitir el funcionamiento offline.
 */

const KEYS = {
    INVENTORY: 'caserita_cache_inventory',
    CUSTOMERS: 'caserita_cache_customers',
    SYNC_QUEUE: 'caserita_sync_queue_sales',
    LAST_SYNC: 'caserita_last_sync_time'
};

export interface SyncItem {
    id: string;
    sale: any;
    details: any[];
    timestamp: number;
}

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

    // --- COLA DE SINCRONIZACIÓN (VENTAS) ---

    addToSyncQueue(sale: any, details: any[]) {
        if (typeof window === 'undefined') return;
        const queue: SyncItem[] = this.getSyncQueue();
        const newItem: SyncItem = {
            id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sale,
            details,
            timestamp: Date.now()
        };
        queue.push(newItem);
        localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
        console.log('📦 Venta añadida a la cola offline:', newItem.id);
        return newItem.id;
    },

    getSyncQueue(): SyncItem[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(KEYS.SYNC_QUEUE);
        return data ? JSON.parse(data) : [];
    },

    removeFromSyncQueue(itemId: string) {
        if (typeof window === 'undefined') return;
        const queue = this.getSyncQueue().filter(item => item.id !== itemId);
        localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    },

    clearSyncQueue() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(KEYS.SYNC_QUEUE);
    }
};
