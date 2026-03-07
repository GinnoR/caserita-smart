"use client";

import { X, Search, Phone, ShoppingBag, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

interface BuyersListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItemsToCart: (items: any[]) => void;
}

export function BuyersListModal({ isOpen, onClose, onAddItemsToCart }: BuyersListModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    // Usamos un estado inicial vacío o podrías conectar con Supabase aquí
    const [orders, setOrders] = useState([
        {
            id: "ORD-001",
            customerName: "María Gonzalez",
            phone: "+51 987 654 321",
            time: "Hace 5 min",
            items: [{ name: "Arroz Faraón", qty: 2, price: 15.50 }, { name: "Aceite Primor", qty: 1, price: 7.50 }],
            itemsText: "Arroz Faraón (2 un), Aceite Primor (1 un)",
            total: "S/ 38.50",
            status: "pending",
        },
        {
            id: "ORD-002",
            customerName: "Bodega Don Pepe",
            phone: "+51 912 345 678",
            time: "Hace 12 min",
            items: [{ name: "Leche Gloria", qty: 24, price: 4.50 }, { name: "Azúcar Rubia", qty: 5, price: 3.50 }],
            itemsText: "Leche Gloria (1 plancha), Azúcar Rubia (5 kg)",
            total: "S/ 115.00",
            status: "pending",
        }
    ]);

    if (!isOpen) return null;

    const filteredOrders = orders.filter(
        (o) =>
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.phone.includes(searchQuery)
    );

    const pendingCount = orders.filter((o) => o.status === "pending").length;

    const markAsCompleted = (id: string) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: "completed" } : o));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden relative border border-slate-200">

                {/* Header */}
                <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center border-b border-red-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-800 p-2 rounded-lg relative">
                            <ShoppingBag className="w-6 h-6 text-white" />
                            {pendingCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Pedidos Entrantes (Delivery / Recojo)</h2>
                            <p className="text-red-100 text-sm">Gestiona los pedidos de tus clientes de WhatsApp</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-700 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="relative max-w-md">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o teléfono..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-10">
                            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No se encontraron pedidos.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center transition-all ${order.status === 'pending' ? 'border-red-200 border-l-4 border-l-red-500' : 'border-slate-200 opacity-70'}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-800">{order.customerName}</h3>
                                        {order.status === 'pending' ? (
                                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> PENDIENTE
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> ATENDIDO
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                        <Phone className="w-4 h-4" />
                                        <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-green-600 hover:underline font-medium">
                                            {order.phone}
                                        </a>
                                        <span className="text-slate-300">•</span>
                                        <span>{order.time}</span>
                                    </div>

                                    <div className="bg-slate-50 p-2 rounded text-sm text-slate-700 border border-slate-100">
                                        <span className="font-semibold text-xs text-slate-500 block mb-1">DETALLE DEL PEDIDO:</span>
                                        {order.itemsText}
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                                    <div className="text-xl font-black text-slate-800">{order.total}</div>
                                    {order.status === "pending" && (
                                        <button
                                            onClick={() => {
                                                markAsCompleted(order.id);
                                                if (Array.isArray(order.items)) {
                                                    onAddItemsToCart(order.items);
                                                }
                                                onClose();
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Marcar Atendido
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
