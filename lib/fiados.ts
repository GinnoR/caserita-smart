// Fiados (Credit) System

export interface Customer {
    id: string;
    fullName: string;
    nickname: string;
    phone: string;
    currentDebt: number;
    paymentDueDate: string;
    status: "solvent" | "debtor" | "loss";
}

export interface CreditTransaction {
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    type: "charge" | "payment";
    description: string;
    date: Date;
}

// Generate a mock customer ID
function generateId(): string {
    return `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function createCustomer(
    name: string,
    nickname: string = "",
    phone: string = ""
): Customer {
    return {
        id: generateId(),
        fullName: name,
        nickname: nickname || name,
        phone,
        currentDebt: 0,
        paymentDueDate: "",
        status: "solvent",
    };
}

export function addCreditCharge(
    customer: Customer,
    amount: number,
    description: string
): { customer: Customer; transaction: CreditTransaction } {
    const updatedCustomer = {
        ...customer,
        currentDebt: customer.currentDebt + amount,
        status: (customer.currentDebt + amount > 0 ? "debtor" : "solvent") as Customer["status"],
    };

    const transaction: CreditTransaction = {
        id: `TXN-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.fullName,
        amount,
        type: "charge",
        description,
        date: new Date(),
    };

    return { customer: updatedCustomer, transaction };
}

export function registerPayment(
    customer: Customer,
    amount: number
): { customer: Customer; transaction: CreditTransaction } {
    const newDebt = Math.max(0, customer.currentDebt - amount);
    const updatedCustomer = {
        ...customer,
        currentDebt: newDebt,
        status: (newDebt === 0 ? "solvent" : "debtor") as Customer["status"],
    };

    const transaction: CreditTransaction = {
        id: `TXN-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.fullName,
        amount,
        type: "payment",
        description: `Abono de S/ ${amount.toFixed(2)}`,
        date: new Date(),
    };

    return { customer: updatedCustomer, transaction };
}

export function markAsLoss(customer: Customer): Customer {
    return {
        ...customer,
        status: "loss",
    };
}
