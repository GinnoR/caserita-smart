import { useState } from "react";
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Download, Filter, BarChart2, Lightbulb, Activity, PackageMinus, Zap, ShieldAlert, Users, Receipt, LineChart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportesModalProps {
    isOpen: boolean;
    onClose: () => void;
    sales: any[];
    compras: any[];
    gastos: any[];
    customers?: any[]; // added for "Cuentas por Cobrar" calculation
}

export function ReportesModal({ isOpen, onClose, sales = [], compras = [], gastos = [], customers = [] }: ReportesModalProps) {
    const [activeTab, setActiveTab] = useState<'resumen' | 'tendencias' | 'sugerencias'>('resumen');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month');

    // --- Estados para Simulador de Flujo ---
    const [diasProyeccion, setDiasProyeccion] = useState<number>(15);
    const [tasaCrecimiento, setTasaCrecimiento] = useState<number>(0); // -50 a +50
    const [gastosFijosSimulados, setGastosFijosSimulados] = useState<string>("0");

    // Cálculos reales basados en ventas
    const ingresosReales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const cantidadVentas = sales.length;

    // 1. Ticket Promedio
    const ticketPromedio = cantidadVentas > 0 ? ingresosReales / cantidadVentas : 0;

    // 2. Recurrencia de Clientes (tasa de retención)
    const ventasConCliente = sales.filter((s) => s.customerId).length;
    const recurrencia = cantidadVentas > 0 ? (ventasConCliente / cantidadVentas) * 100 : 0;

    // 3. Margen de Utilidad Neta (usando mocks para costos fijos temporales)
    // Cuando integres inventarios reales, sumarás el costo real de los productos vendidos
    const mockCostoMercaderia = 2850.00;
    const mockGastosOperativos = 450.00;

    // Si no hay ventas, mostramos el mock para no ver todo en 0 (durante pruebas visuales)
    // pero si hay, usamos la data real
    const totalIngresos = ingresosReales > 0 ? ingresosReales : 4520.50;

    const utilidadNeta = totalIngresos - (mockCostoMercaderia + mockGastosOperativos);
    const margenNeto = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

    // 4. Flujo de Caja (Dinero Real - sin Fiados)
    const ventasEfectivas = sales.filter(s => s.paymentMethod?.toLowerCase() !== "crédito")
        .reduce((sum, sale) => sum + sale.total, 0);

    const totalDineroEntrante = ventasEfectivas > 0 ? ventasEfectivas : 4200.00; // Mock si no hay data
    const flujoDeCaja = totalDineroEntrante - (mockCostoMercaderia + mockGastosOperativos);

    // 5. Endeudamiento (Cuentas por cobrar - Fiados)
    const cuentasPorCobrar = customers?.reduce((sum, c) => sum + (c.currentDebt || 0), 0) || 0;

    // --- LÓGICA DEL SIMULADOR DE FLUJO ---
    // Promedio diario basado en ventas actuales (si 0, asumimos base de S/ 150/día para que no se rompa la vista)
    const ventaDiariaPromedio = cantidadVentas > 0 ? (totalDineroEntrante / 30) : 150;
    const costoDiarioPromedio = mockCostoMercaderia / 30;

    // Proyección con la tasa de crecimiento aplicada
    const factorCrecimiento = 1 + (tasaCrecimiento / 100);
    const ingresosProyectados = ventaDiariaPromedio * diasProyeccion * factorCrecimiento;
    const costosProyectados = costoDiarioPromedio * diasProyeccion * factorCrecimiento; // Asumimos costo acompaña ventas

    const gastosExtra = parseFloat(gastosFijosSimulados) || 0;
    const flujoProyectadoFinal = ingresosProyectados - costosProyectados - gastosExtra;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">

                {/* Header Global */}
                <div className="bg-slate-800 p-5 text-white flex justify-between items-center shadow-md z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl border border-indigo-400">
                            <BarChart2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">Reportes y Sugerencias</h2>
                            <p className="text-blue-200 text-sm">Finanzas y analítica de tu negocio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 bg-white shadow-sm z-10 sticky top-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'resumen' ? "border-blue-500 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <DollarSign className="w-5 h-5" /> Resumen Financiero
                    </button>
                    <button
                        onClick={() => setActiveTab('tendencias')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'tendencias' ? "border-purple-500 text-purple-700 bg-purple-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <Activity className="w-5 h-5" /> Tendencias
                    </button>
                    <button
                        onClick={() => setActiveTab('sugerencias')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'sugerencias' ? "border-orange-500 text-orange-700 bg-orange-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <Lightbulb className={cn("w-5 h-5", activeTab === 'sugerencias' && "animate-pulse text-yellow-500")} /> Sugerencias IA
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100">

                    {/* Report Controls (Solo para Resumen y Tendencias) */}
                    {activeTab !== 'sugerencias' && (
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 gap-4">
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setDateRange('today')} className={cn("px-4 py-2 text-sm font-bold rounded-md transition-colors", dateRange === 'today' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-200")}>Hoy</button>
                                <button onClick={() => setDateRange('week')} className={cn("px-4 py-2 text-sm font-bold rounded-md transition-colors", dateRange === 'week' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-200")}>Esta Semana</button>
                                <button onClick={() => setDateRange('month')} className={cn("px-4 py-2 text-sm font-bold rounded-md transition-colors", dateRange === 'month' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-200")}>Este Mes</button>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors">
                                    <Filter className="w-4 h-4" /> Filtros
                                </button>
                                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition-colors">
                                    <Download className="w-4 h-4" /> Bajar Excel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 1: RESUMEN FINANCIERO --- */}
                    {activeTab === 'resumen' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            {/* Big Numbers Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {/* 1. Margen de Utilidad Neta (El indicador más importante) */}
                                <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group hover:shadow-xl transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Margen Neto</p>
                                            <div className="flex items-end gap-2 mt-1">
                                                <h3 className={cn("text-3xl font-black", margenNeto > 15 ? "text-green-400" : margenNeto > 0 ? "text-yellow-400" : "text-red-400")}>
                                                    {margenNeto.toFixed(1)}%
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 relative z-10 flex justify-between items-end">
                                        <p className="text-xs text-slate-400 font-medium">Utilidad: S/ {utilidadNeta.toFixed(2)}</p>
                                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded", margenNeto > 15 ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400")}>
                                            {margenNeto > 15 ? "Saludable" : "Bajo"}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Ticket Promedio */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Ticket Promedio</p>
                                            <h3 className="text-3xl font-black text-slate-800 mt-1">S/ {ticketPromedio.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-emerald-100 p-2 rounded-xl">
                                            <Receipt className="w-6 h-6 text-emerald-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">Lo que gasta cada cliente en promedio</p>
                                </div>

                                {/* 3. Recurrencia de Clientes */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Recurrencia</p>
                                            <h3 className="text-3xl font-black text-slate-800 mt-1">{recurrencia.toFixed(1)}%</h3>
                                        </div>
                                        <div className="bg-purple-100 p-2 rounded-xl">
                                            <Users className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">Ventas a clientes registrados</p>
                                </div>

                                {/* 4. Flujo de Caja (Efectivo real) */}
                                <div className={cn("p-5 rounded-2xl shadow-sm border relative overflow-hidden group hover:shadow-md transition-all", flujoDeCaja >= 0 ? "bg-white border-slate-200" : "bg-red-50 border-red-200")}>
                                    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] -z-0 opacity-50 transition-transform", flujoDeCaja >= 0 ? "bg-blue-100" : "bg-red-200")}></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className={"font-bold text-sm uppercase tracking-wider " + (flujoDeCaja >= 0 ? "text-slate-500" : "text-red-700")}>Flujo de Caja</p>
                                            <h3 className={"text-3xl font-black mt-1 " + (flujoDeCaja >= 0 ? "text-slate-800" : "text-red-800")}>S/ {flujoDeCaja.toFixed(2)}</h3>
                                        </div>
                                        <div className={cn("p-2 rounded-xl", flujoDeCaja >= 0 ? "bg-blue-100" : "bg-red-200")}>
                                            <LineChart className={cn("w-6 h-6", flujoDeCaja >= 0 ? "text-blue-600" : "text-red-700")} />
                                        </div>
                                    </div>
                                    <p className={"text-xs font-medium mt-4 relative z-10 " + (flujoDeCaja >= 0 ? "text-slate-500" : "text-red-600")}>Dinero líquido menos gastos</p>
                                </div>

                                {/* 5. Cuentas por Cobrar (Deudas/Endeudamiento) */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Cuentas por Cobrar</p>
                                            <h3 className="text-3xl font-black text-slate-800 mt-1">S/ {cuentasPorCobrar.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-amber-100 p-2 rounded-xl">
                                            <Wallet className="w-6 h-6 text-amber-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">Total fiado en la calle</p>
                                </div>

                                {/* Ingresos Totales */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Ingresos Totales</p>
                                            <h3 className="text-2xl font-black text-slate-800 mt-1">S/ {totalIngresos.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-green-100 p-2 rounded-xl">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">{cantidadVentas} ventas registradas</p>
                                </div>

                                {/* Costo Mercadería */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Compras</p>
                                            <h3 className="text-2xl font-black text-slate-800 mt-1">S/ {mockCostoMercaderia.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-orange-100 p-2 rounded-xl">
                                            <PackageMinus className="w-5 h-5 text-orange-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">Inversión calculada</p>
                                </div>

                                {/* Gastos Operativos */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-[100px] -z-0 opacity-50 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Gastos Oper.</p>
                                            <h3 className="text-2xl font-black text-slate-800 mt-1">S/ {mockGastosOperativos.toFixed(2)}</h3>
                                        </div>
                                        <div className="bg-red-100 p-2 rounded-xl">
                                            <TrendingDown className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-4 relative z-10">Fijos y operativos</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: TENDENCIAS (SIMULADOR DE FLUJO) --- */}
                    {activeTab === 'tendencias' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Panel de Mandos - Simulador */}
                                    <div className="flex-1 space-y-5">
                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-purple-500" /> Simulador de Flujo Proyectado
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Calcula tu liquidez futura jugando con variables de ventas y pagos pendientes.
                                        </p>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Periodo a simular</label>
                                            <div className="flex gap-2">
                                                {[7, 15, 30].map(dias => (
                                                    <button
                                                        key={dias}
                                                        onClick={() => setDiasProyeccion(dias)}
                                                        className={cn(
                                                            "flex-1 py-2 text-sm font-medium rounded-lg border transition-colors",
                                                            diasProyeccion === dias ? "bg-purple-100 text-purple-700 border-purple-300" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {dias === 7 ? "1 Semana" : dias === 15 ? "1 Quincena" : "1 Mes"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                                <span>Tendencia de Ventas (Slider)</span>
                                                <span className={tasaCrecimiento > 0 ? "text-green-600 font-black" : tasaCrecimiento < 0 ? "text-red-600 font-black" : "text-slate-500 font-black"}>
                                                    {tasaCrecimiento > 0 ? `+${tasaCrecimiento}%` : `${tasaCrecimiento}%`}
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min="-50" max="50" step="5"
                                                value={tasaCrecimiento}
                                                onChange={(e) => setTasaCrecimiento(Number(e.target.value))}
                                                className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                                                <span>Caída (-50%)</span>
                                                <span>Estable (0%)</span>
                                                <span>Subida (+50%)</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Gastos / Deudas a pagar en ese lapso (S/)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">S/</span>
                                                <input
                                                    type="number"
                                                    value={gastosFijosSimulados}
                                                    onChange={(e) => setGastosFijosSimulados(e.target.value)}
                                                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                                                    placeholder="Ej. alquiler, prestamo"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resultado Proyectado */}
                                    <div className="md:w-[350px] flex flex-col">
                                        <div className={cn(
                                            "flex-1 rounded-2xl p-6 border flex flex-col justify-center items-center text-center transition-colors relative overflow-hidden",
                                            flujoProyectadoFinal >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                        )}>
                                            <h4 className="font-bold text-sm tracking-widest uppercase text-slate-500 mb-2 relative z-10">Caja Proyectada</h4>
                                            <span className={cn(
                                                "text-4xl font-black relative z-10 mb-2",
                                                flujoProyectadoFinal >= 0 ? "text-green-700" : "text-red-700"
                                            )}>
                                                S/ {flujoProyectadoFinal.toFixed(2)}
                                            </span>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase relative z-10",
                                                flujoProyectadoFinal >= 0 ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                            )}>
                                                {flujoProyectadoFinal >= 0 ? "Caja Saludable" : "Riesgo de Iliquidez"}
                                            </span>

                                            <div className="w-full mt-6 space-y-2 border-t pt-4 border-slate-200/50 relative z-10">
                                                <div className="flex justify-between text-xs text-slate-600">
                                                    <span>Ingresos est.:</span>
                                                    <span className="font-bold">S/ {ingresosProyectados.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-600">
                                                    <span>Compras est.:</span>
                                                    <span className="font-bold text-orange-600">- S/ {costosProyectados.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-600">
                                                    <span>Gastos extra:</span>
                                                    <span className="font-bold text-red-600">- S/ {gastosExtra.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Decorative Background */}
                                            <div className={cn(
                                                "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40 z-0",
                                                flujoProyectadoFinal >= 0 ? "bg-green-400" : "bg-red-400"
                                            )}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Productos Más Demandados (Top 3)</h4>
                                    <ul className="space-y-3">
                                        <li className="flex justify-between items-center text-sm font-medium"><span className="text-slate-700">1. Arroz Faraón (Saco 50kg)</span> <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Alta Demanda</span></li>
                                        <li className="flex justify-between items-center text-sm font-medium"><span className="text-slate-700">2. Azúcar Rubia (Bolsa 1kg)</span> <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Alta Demanda</span></li>
                                        <li className="flex justify-between items-center text-sm font-medium"><span className="text-slate-700">3. Aceite Primor Premium</span> <span className="text-slate-500">Estable</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Hora Pico de Ventas</h4>
                                    <div className="flex justify-between items-center mt-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-800">10:00 AM</p>
                                            <p className="text-xs text-slate-500 mt-1">Lunes a Sábado</p>
                                        </div>
                                        <div className="h-12 w-px bg-slate-200"></div>
                                        <div className="text-center text-orange-600">
                                            <p className="text-2xl font-bold">15%</p>
                                            <p className="text-xs mt-1">Más flujo vs tardé</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- TAB 3: SUGERENCIAS E IA --- */}
                    {activeTab === 'sugerencias' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm mb-6">
                                <div className="flex gap-4">
                                    <div className="bg-orange-100 p-3 rounded-full h-fit shadow-inner">
                                        <Zap className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-orange-900">IA de Caserita Smart</h3>
                                        <p className="text-orange-800 mt-1 text-sm">Este panel analiza tus compras y tus ventas para avisarte qué productos debes mover rápido para evitar perder tu capital.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Alerta de Vencimiento */}
                                <div className="bg-white border-l-4 border-red-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> Riesgo de Vencimiento</h4>
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Crítico</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">Detectamos stock de "Yogurt Gloria Fresa" que vencerá en 10 días.</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs font-bold text-slate-700 mb-1">Stock inmovilizado: <span className="text-red-600">S/ 45.00</span></p>
                                        <button className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 rounded border border-red-200 transition-colors">
                                            Crear Promoción 2x1 en Catálogo
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Frío (No rota) */}
                                <div className="bg-white border-l-4 border-blue-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><PackageMinus className="w-4 h-4 text-blue-500" /> Capital Inactivo (Stock Frío)</h4>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Atención</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">"Galletas Casino Menta" no ha tenido ventas en los últimos 25 días.</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs font-bold text-slate-700 mb-1">Capital atrapado: <span className="text-blue-600">S/ 120.00</span></p>
                                        <button className="w-full mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded border border-blue-200 transition-colors">
                                            Sugerir Remate en Tienda a S/ 0.50
                                        </button>
                                    </div>
                                </div>

                                {/* Sugerencia de Compra (Se agota rápido) */}
                                <div className="bg-white border-l-4 border-green-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Oportunidad de Re-Stock</h4>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Oportunidad</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:items-start text-sm">
                                        <p className="text-slate-600">Tus ventas de <strong>Detergente Bolívar</strong> han subido un 30% esta semana, pero te quedan pocas unidades en inventario para el fin de semana.</p>
                                        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap shadow-sm transition-colors w-full sm:w-auto">
                                            Añadir a Próxima Compra
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
