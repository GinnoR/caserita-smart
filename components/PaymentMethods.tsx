import { Banknote, CreditCard, Smartphone, CheckSquare } from "lucide-react";

interface PaymentMethodsProps {
    onPayment?: (method: "Efectivo" | "Yape" | "Plin" | "Tarjeta" | "Crédito") => void;
}

export function PaymentMethods({ onPayment }: PaymentMethodsProps) {
    return (
        <div className="grid grid-cols-4 gap-1.5 h-16">
            <PaymentButton
                icon={Banknote}
                label="EFECTIVO"
                color="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 border-green-800"
                onClick={() => onPayment?.("Efectivo")}
            />
            <PaymentButton
                icon={Smartphone}
                label="YAPE / PLIN"
                color="bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 border-purple-800"
                onClick={() => onPayment?.("Yape")}
            />
            <PaymentButton
                icon={CreditCard}
                label="TARJETA"
                color="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 border-blue-800"
                onClick={() => onPayment?.("Tarjeta")}
            />
            <PaymentButton
                icon={CheckSquare}
                label="CRÉDITO"
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
            className={`flex flex-col items-center justify-center p-1 rounded-lg shadow-md border-b-2 active:border-b-0 active:translate-y-0.5 transition-all text-white ${color}`}
        >
            <Icon className="w-5 h-5 mb-0.5 drop-shadow" />
            <span className="text-[8px] font-black uppercase text-center leading-[1.1] drop-shadow-sm px-0.5">
                {label}
            </span>
        </button>
    );
}
