import { Banknote, CreditCard, Smartphone, CheckSquare } from "lucide-react";

interface PaymentMethodsProps {
    onPayment?: (method: "Efectivo" | "Yape" | "Plin" | "Tarjeta" | "Crédito") => void;
}

export function PaymentMethods({ onPayment }: PaymentMethodsProps) {
    return (
        <div className="grid grid-cols-4 gap-2 h-24">
            <PaymentButton
                icon={Banknote}
                label="Efectivo"
                color="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 border-green-800"
                onClick={() => onPayment?.("Efectivo")}
            />
            <PaymentButton
                icon={Smartphone}
                label="Yape / Plin"
                color="bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 border-purple-800"
                onClick={() => onPayment?.("Yape")}
            />
            <PaymentButton
                icon={CreditCard}
                label="Tarjeta Crédito"
                color="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 border-blue-800"
                onClick={() => onPayment?.("Tarjeta")}
            />
            <PaymentButton
                icon={CheckSquare}
                label="A Crédito"
                color="bg-gradient-to-b from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 border-orange-800"
                onClick={() => onPayment?.("Crédito")}
            />
        </div>
    );
}

function PaymentButton({
    icon: Icon,
    label,
    color,
    onClick,
}: {
    icon: any;
    label: string;
    color: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-xl shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white ${color}`}
        >
            <Icon className="w-8 h-8 mb-1 drop-shadow" />
            <span className="text-xs font-bold uppercase text-center leading-tight drop-shadow-sm">
                {label}
            </span>
        </button>
    );
}
