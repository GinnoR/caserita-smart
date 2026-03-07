const XLSX = require('xlsx');
const fs = require('fs');

const salesData = [
    {
        fecha: '2026-02-12',
        hora: '23:30',
        producto: 'Azúcar Bolsa',
        qty: 1,
        um: '5kg',
        precio: 18,
        subtotal: 18,
        total_venta: 33,
        metodo: 'Efectivo'
    },
    {
        fecha: '2026-02-12',
        hora: '23:30',
        producto: 'Papa',
        qty: 5,
        um: 'kg',
        precio: 3,
        subtotal: 15,
        total_venta: '',
        metodo: ''
    },
    {
        fecha: '2026-02-12',
        hora: '23:31',
        producto: 'Camote Pack',
        qty: 4,
        um: '5kg',
        precio: 15,
        subtotal: 60,
        total_venta: 103.5,
        metodo: 'Yape'
    },
    {
        fecha: '2026-02-12',
        hora: '23:31',
        producto: 'Atún Real',
        qty: 1,
        um: 'und',
        precio: 5.5,
        subtotal: 5.5,
        total_venta: '',
        metodo: ''
    },
    {
        fecha: '2026-02-12',
        hora: '23:31',
        producto: 'Azúcar Rubia',
        qty: 10,
        um: 'kg',
        precio: 3.8,
        subtotal: 38,
        total_venta: '',
        metodo: ''
    }
];

const worksheet = XLSX.utils.json_to_sheet(salesData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas de Hoy");

// Adjust column widths
const wscols = [
    { wch: 12 }, // Fecha
    { wch: 8 },  // Hora
    { wch: 20 }, // Producto
    { wch: 10 }, // Cantidad
    { wch: 5 },  // UM
    { wch: 10 }, // Precio
    { wch: 10 }, // Subtotal
    { wch: 12 }, // Total Venta
    { wch: 10 }  // Método
];
worksheet['!cols'] = wscols;

XLSX.writeFile(workbook, 'Ventas_Caserita_Hoy.xlsx');
console.log('Archivo Ventas_Caserita_Hoy.xlsx generado con éxito.');
