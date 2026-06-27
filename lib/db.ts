import Dexie, { Table } from 'dexie';

export interface PendingSale {
    id?: string;
    sale: any;
    details: any[];
    timestamp: number;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
}

export interface LocalInventory {
    id: number;
    cod_bar_produc: string | null;
    nombre_producto: string;
    marca_producto: string | null;
    categoria: string | null;
    ubicacion?: string | null;
    cantidad_ingreso?: number;
    p_u_venta?: number;
    p_u_compra?: number;
    um?: string;
    unidades_base?: number;
}

export class CaseritaDB extends Dexie {
    pendingSales!: Table<PendingSale, string>;
    inventory!: Table<LocalInventory, number>;

    constructor() {
        super('CaseritaSmartDB');
        this.version(1).stores({
            pendingSales: 'id, timestamp, status',
            inventory: 'id, cod_bar_produc, nombre_producto, categoria'
        });
    }
}

export const db = new CaseritaDB();
