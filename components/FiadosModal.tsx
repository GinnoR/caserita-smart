"use client";

import { useState } from "react";
import { X, UserPlus, DollarSign, AlertTriangle } from "lucide-react";
import { Customer, createCustomer, registerPayment, markAsLoss } from "@/lib/fiados";

interface FiadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    onUpdateCustomers: (customers: Customer[]) => void;
    onSelectCustomer: (customer: Customer) => void;
}

export function FiadosModal({
    isOpen,
    onClose,
    customers,
    onUpdateCustomers,
    onSelectCustomer,
}: FiadosModalProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newNickname, setNewNickname] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [paymentAmount, setPaymentAmount] = useState<{ [id: string]: string }>({});

    if (!isOpen) return null;

    const handleAddCustomer = () => {
        if (!newName.trim()) return;
        const customer = createCustomer(newName, newNickname, newPhone);
        onUpdateCustomers([...customers, customer]);
        setNewName("");
        setNewNickname("");
        setNewPhone("");
        setShowAddForm(false);
    };

    const handlePayment = (customer: Customer) => {
        const amount = parseFloat(paymentAmount[customer.id] || "0");
        if (amount <= 0) return;
        const { customer: updated } = registerPayment(customer, amount);
        const updatedCustomers = customers.map((c) =>
            c.id === customer.id ? updated : c
        );
        onUpdateCustomers(updatedCustomers);
        setPaymentAmount((prev) => ({ ...prev, [customer.id]: "" }));
    };

    const handleMarkLoss = (customer: Customer) => {
        if (!confirm(`¿Marcar la deuda de ${customer.fullName} como PÉRDIDA? Esta acción no se puede deshacer.`)) return;
        const updated = markAsLoss(customer);
        const updatedCustomers = customers.map((c) =>
            c.id === customer.id ? updated : c
        );
        onUpdateCustomers(updatedCustomers);
    };

    const debtors = customers.filter((c) => c.status === "debtor");
    const losses = customers.filter((c) => c.status === "loss");
    const solvent = customers.filter((c) => c.status === "solvent");

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col text-slate-800 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">📋 Sistema de Fiados (Crédito)</h2>
                    <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Add Customer Button */}
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                        >
                            <UserPlus className="w-4 h-4" /> Agregar Cliente
                        </button>
                    ) : (
                        <div className="bg-slate-100 p-4 rounded-lg space-y-2">
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm text-slate-900 font-semibold"
                            />
                            <input
                                type="text"
                                placeholder='Apodo / "Chapa"'
                                value={newNickname}
                                onChange={(e) => setNewNickname(e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm text-slate-900 font-semibold"
                            />
                            <input
                                type="text"
                                placeholder="WhatsApp"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm text-slate-900 font-semibold"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddCustomer}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                                >
                                    Guardar
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-slate-400 hover:bg-slate-300 text-white rounded text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Debtors Section */}
                    {debtors.length > 0 && (
                        <div>
                            <h3 className="font-bold text-red-600 mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Deudores ({debtors.length})
                            </h3>
                            {debtors.map((c) => (
                                <CustomerCard
                                    key={c.id}
                                    customer={c}
                                    paymentValue={paymentAmount[c.id] || ""}
                                    onPaymentChange={(val) =>
                                        setPaymentAmount((prev) => ({ ...prev, [c.id]: val }))
                                    }
                                    onPay={() => handlePayment(c)}
                                    onMarkLoss={() => handleMarkLoss(c)}
                                    onSelect={() => { onSelectCustomer(c); onClose(); }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Solvent Section */}
                    {solvent.length > 0 && (
                        <div>
                            <h3 className="font-bold text-green-600 mb-2">
                                ✅ Al día ({solvent.length})
                            </h3>
                            {solvent.map((c) => (
                                <CustomerCard
                                    key={c.id}
                                    customer={c}
                                    paymentValue=""
                                    onPaymentChange={() => { }}
                                    onPay={() => { }}
                                    onSelect={() => { onSelectCustomer(c); onClose(); }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Losses Section */}
                    {losses.length > 0 && (
                        <div>
                            <h3 className="font-bold text-slate-400 mb-2">
                                💸 Pérdidas ({losses.length})
                            </h3>
                            {losses.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex justify-between items-center p-3 bg-slate-100 rounded-lg mb-2 opacity-60"
                                >
                                    <div>
                                        <span className="font-bold text-slate-800">{c.fullName}</span>
                                        {c.nickname && (
                                            <span className="text-slate-700 ml-2 text-sm italic">
                                                &quot;{c.nickname}&quot;
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-red-600 font-bold line-through">
                                        S/ {c.currentDebt.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {customers.length === 0 && (
                        <p className="text-center text-slate-700 font-medium py-8">
                            No hay clientes registrados aún.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CustomerCard({
    customer,
    paymentValue,
    onPaymentChange,
    onPay,
    onMarkLoss,
    onSelect,
}: {
    customer: Customer;
    paymentValue: string;
    onPaymentChange: (val: string) => void;
    onPay: () => void;
    onMarkLoss?: () => void;
    onSelect: () => void;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-2 shadow-sm">
            <div className="flex justify-between items-center">
                <div>
                    <button onClick={onSelect} className="font-bold text-slate-900 hover:text-blue-600 transition text-left">
                        {customer.fullName}
                    </button>
                    {customer.nickname && customer.nickname !== customer.fullName && (
                        <span className="text-slate-800 ml-2 text-sm italic">
                            &quot;{customer.nickname}&quot;
                        </span>
                    )}
                    {customer.phone && (
                        <span className="text-slate-700 ml-2 text-xs font-medium">{customer.phone}</span>
                    )}
                </div>
                <span
                    className={`font-bold text-lg ${customer.currentDebt > 0 ? "text-red-500" : "text-green-500"
                        }`}
                >
                    S/ {customer.currentDebt.toFixed(2)}
                </span>
            </div>

            {customer.status === "debtor" && (
                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="number"
                        step="0.10"
                        min="0"
                        placeholder="Monto abono"
                        value={paymentValue}
                        onChange={(e) => onPaymentChange(e.target.value)}
                        className="flex-1 px-3 py-1 border rounded text-sm text-slate-900 font-semibold"
                    />
                    <button
                        onClick={onPay}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm flex items-center gap-1"
                    >
                        <DollarSign className="w-3 h-3" /> Abonar
                    </button>
                    {onMarkLoss && (
                        <button
                            onClick={onMarkLoss}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                            title="Marcar como pérdida"
                        >
                            Pérdida
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
