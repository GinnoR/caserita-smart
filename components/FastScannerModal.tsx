import { useState, useEffect, useRef } from "react";
import { Camera, X, Search, CheckCircle, Database } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/utils/supabase/client";

interface FastScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: any[];
    setInventory: (inv: any[]) => void;
    onAddToCart: (items: any[]) => void;
    userId?: string;
    cajeroNombre?: string;
}

export function FastScannerModal({ isOpen, onClose, inventory, setInventory, onAddToCart, userId, cajeroNombre }: FastScannerModalProps) {
    const [scannedCode, setScannedCode] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found_local" | "found_master" | "not_found">("idle");
    const [foundProduct, setFoundProduct] = useState<any>(null);
    const [localMatches, setLocalMatches] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState("");

    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Form inputs when product is not local
    const [newPrice, setNewPrice] = useState("");
    const [newCost, setNewCost] = useState("");
    const [newStock, setNewStock] = useState("10");
    const [newUm, setNewUm] = useState("und");
    const [newExpiry, setNewExpiry] = useState("");

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setScannedCode("");
        setSearchStatus("idle");
        setFoundProduct(null);
        setLocalMatches([]);
        setErrorMsg("");
        setNewPrice("");
        setNewCost("");
        setNewStock("10");
        setNewUm("und");
        setNewExpiry("");
    };

    const startScanner = async () => {
        setIsScanning(true);
        setErrorMsg("");

        // Wait for React to render the #reader div
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    (decodedText) => {
                        handleScanSuccess(decodedText);
                        stopScanner(); // Stop after first successful scan
                    },
                    (errorMessage) => {
                        // Ignore continuous scanning errors
                    }
                );
            } catch (err: any) {
                console.error("Error starting scanner:", err);
                setErrorMsg("No se pudo iniciar la cámara. Revisa los permisos.");
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);
    };

    const handleScanSuccess = async (code: string) => {
        setScannedCode(code);
        setSearchStatus("searching");

        // 1. LOCAL SEARCH
        const localMatchesArr = inventory.filter(i => i.code === code);
        if (localMatchesArr.length > 0) {
            setSearchStatus("found_local");
            setLocalMatches(localMatchesArr);
            return;
        }

        // 2. MASTER DB SEARCH
        try {
            const { data, error } = await supabase
                .from('productos_maestra')
                .select('*')
                .eq('barcode', code)
                .single();

            if (data) {
                setSearchStatus("found_master");
                setFoundProduct(data);
            } else {
                setSearchStatus("not_found");
            }
        } catch (err) {
            console.error("Error querying master db:", err);
            setSearchStatus("not_found");
        }
    };

    const handleManualScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (scannedCode.trim()) {
            handleScanSuccess(scannedCode.trim());
        }
    };

    const handleScanMasterForce = async (code: string) => {
        setSearchStatus("searching");
        try {
            const { data, error } = await supabase
                .from('productos_maestra')
                .select('*')
                .eq('barcode', code)
                .single();

            if (data) {
                setSearchStatus("found_master");
                setFoundProduct(data);
            } else {
                setSearchStatus("not_found");
            }
        } catch (err) {
            console.error("Error querying master db:", err);
            setSearchStatus("not_found");
        }
    };

    const handleQuickAddLocal = (match: any) => {
        if (match) {
            onAddToCart([
                {
                    code: match.code,
                    name: match.name,
                    qty: 1,
                    price: match.price,
                    um: match.um,
                    subtotal: match.price,
                }
            ]);
            onClose();
        }
    };

    const handleSaveFromMaster = async () => {
        if (!newPrice || isNaN(Number(newPrice))) {
            setErrorMsg("Ingresa un precio válido.");
            return;
        }

        try {
            // 1. Prepare product object for the master `inventario` table
            const productData: any = {
                nombre_producto: foundProduct.product_name,
                cod_bar_produc: foundProduct.barcode,
                categoria: (["Abarrotes", "Verduras", "Lácteos", "Otros"].includes(foundProduct.category)) ? foundProduct.category : "Otros",
                fecha_caducidad: newExpiry ? newExpiry : null,
                um: newUm,
                unidades_base: 1 // Default
            };

            // Insert into 'inventario'
            const { data: newProd, error: prodError } = await (supabase as any)
                .from('inventario')
                .insert(productData)
                .select()
                .single();

            if (prodError || !newProd) throw prodError || new Error("Failed to insert inventory");

            // 2. Link with casero's stock/price in 'ingres_produc'
            const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
            if (isUUID) {
                const { error: vinculacionError } = await (supabase as any)
                    .from('ingres_produc')
                    .insert({
                        cod_casero: userId,
                        producto_id: newProd.id,
                        cantidad_ingreso: Number(newStock) || 0,
                        p_u_venta: Number(newPrice),
                        p_u_compra: newCost ? Number(newCost) : (Number(newPrice) * 0.8)
                    });
                if (vinculacionError) throw vinculacionError;
            }

            // 3. Update local UI
            const localItem = {
                id: newProd.id,
                code: newProd.cod_bar_produc,
                name: newProd.nombre_producto,
                category: newProd.categoria,
                stock: Number(newStock) || 0,
                price: Number(newPrice),
                um: newUm,
                fecha_caducidad: newProd.fecha_caducidad
            };

            setInventory([localItem, ...inventory]);

            // Automatically add 1 unit to cart
            onAddToCart([
                {
                    code: localItem.code,
                    name: localItem.name,
                    qty: 1,
                    price: localItem.price,
                    um: localItem.um,
                    subtotal: localItem.price,
                }
            ]);

            onClose();
        } catch (err: any) {
            console.error("Error saving from master:", err);
            setErrorMsg("Error guardando el producto: " + (err.message || 'Avisar a soporte.'));
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col pt-10 px-4 items-center animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white flex justify-between items-center shadow-md z-10">
                    <div className="flex items-center gap-2">
                        <Camera className="w-6 h-6" />
                        <h2 className="text-xl font-black tracking-tight">Caja Rápida (Escáner)</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4 bg-slate-50 relative">
                    {/* Scanner Area */}
                    {isScanning ? (
                        <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                            <div id="reader" className="w-full h-full object-cover"></div>
                            <button
                                onClick={stopScanner}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border border-white/20"
                            >
                                Detener Cámara
                            </button>
                        </div>
                    ) : (
                        searchStatus === "idle" && (
                            <button
                                onClick={startScanner}
                                className="w-full bg-blue-100 hover:bg-blue-200 border-2 border-dashed border-blue-400 py-10 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors text-blue-700"
                            >
                                <Camera className="w-12 h-12" />
                                <span className="font-bold text-lg">Activar Cámara</span>
                            </button>
                        )
                    )}

                    {errorMsg && <div className="text-red-500 font-bold text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200">{errorMsg}</div>}

                    {/* Manual Input Fallback */}
                    {searchStatus === "idle" && !isScanning && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <hr className="flex-1 border-slate-300" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">O Ingresa Manual</span>
                                <hr className="flex-1 border-slate-300" />
                            </div>
                            <form onSubmit={handleManualScan} className="flex gap-2">
                                <input
                                    type="text"
                                    value={scannedCode}
                                    onChange={(e) => setScannedCode(e.target.value)}
                                    placeholder="Código de barras..."
                                    className="flex-1 p-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-slate-900 font-mono text-center text-lg"
                                    autoFocus
                                />
                                <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
                                    <Search className="w-6 h-6" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Results Area */}
                    {searchStatus === "searching" && (
                        <div className="py-12 flex flex-col items-center gap-3 text-blue-600 animate-pulse">
                            <Search className="w-10 h-10 animate-bounce" />
                            <p className="font-bold">Buscando producto...</p>
                        </div>
                    )}

                    {searchStatus === "found_local" && localMatches.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5 flex flex-col items-center shadow-sm animate-in zoom-in-95">
                            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                            <p className="text-green-800 font-bold mb-1 text-center">¡Producto(s) en tu Stock!</p>

                            <div className="w-full flex flex-col gap-3 mt-3">
                                {localMatches.map((match, idx) => (
                                    <div key={match.id || idx} className="bg-white p-3 rounded-lg shadow-sm border border-green-200 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-black text-slate-800 leading-tight flex-1">{match.name}</h3>
                                            <span className="text-green-700 font-bold text-lg whitespace-nowrap ml-2">S/ {match.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Stock: <strong className="text-slate-700">{match.stock} {match.um}</strong></span>
                                            {match.fecha_caducidad && (
                                                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-bold">
                                                    Vence: {new Date(match.fecha_caducidad).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleQuickAddLocal(match)}
                                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2 rounded-lg transition-transform active:scale-95"
                                        >
                                            Vender Este Lote (+1)
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => {
                                // Forced master search if they want to add a *new* batch from scratch
                                setLocalMatches([]);
                                handleScanMasterForce(scannedCode);
                            }} className="mt-4 text-xs font-bold text-green-700 underline decoration-green-400 hover:text-green-900 transition-colors">
                                + Ingresar un nuevo Lote/Vencimiento
                            </button>
                        </div>
                    )}

                    {searchStatus === "found_master" && foundProduct && (
                        <div className="bg-indigo-50 border-2 border-indigo-400 rounded-xl p-5 flex flex-col shadow-sm animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-2 text-indigo-700 mb-2 justify-center">
                                <Database className="w-5 h-5" />
                                <span className="font-bold text-xs tracking-widest uppercase">Base Global Caserita</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 text-center mb-1 leading-tight">{foundProduct.product_name}</h3>
                            <p className="text-xs text-slate-500 text-center mb-3">{foundProduct.brand || 'Sin marca'} • {foundProduct.category}</p>

                            <div className="bg-white p-3 rounded-lg border border-indigo-100 mb-4 grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Precio Venta (S/)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        className="w-full text-xl font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md p-1.5 text-center outline-none focus:border-indigo-500"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Costo Compra (S/)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newCost}
                                        onChange={e => setNewCost(e.target.value)}
                                        className="w-full text-lg font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-center outline-none focus:border-slate-400"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Unidad (UM)</label>
                                    <select
                                        value={newUm}
                                        onChange={e => setNewUm(e.target.value)}
                                        className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2 outline-none focus:border-indigo-500"
                                    >
                                        <option value="und">UND (Unidad)</option>
                                        <option value="Kg">Kg (Kilos)</option>
                                        <option value="grs.">Grs (Gramos)</option>
                                        <option value="Lt">Lt (Litros)</option>
                                        <option value="pqte">Paquete</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Stock Inicial</label>
                                    <input
                                        type="number"
                                        value={newStock}
                                        onChange={e => setNewStock(e.target.value)}
                                        className="w-full text-base font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-center outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha Caducidad</label>
                                    <input
                                        type="date"
                                        value={newExpiry}
                                        onChange={e => setNewExpiry(e.target.value)}
                                        className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-md p-1.5 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <button onClick={handleSaveFromMaster} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-center">
                                Guardar y Agregar a Venta
                            </button>
                        </div>
                    )}

                    {searchStatus === "not_found" && (
                        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 flex flex-col items-center shadow-sm text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                                <Search className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-black text-amber-900 mb-2">Producto no reconocido</h3>
                            <p className="text-amber-700 text-sm mb-4">El código <span className="font-mono font-bold bg-amber-200/50 px-1 rounded">{scannedCode}</span> no está en tu tienda ni en la base de datos Global.</p>

                            <button
                                onClick={() => {
                                    // Trigger ProductMasterModal open in parent 
                                    onClose();
                                    // Ideally, pass the code to the parent so it opens the Add form pre-filled.
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition"
                            >
                                Registrar Nuevo Producto Manual
                            </button>
                        </div>
                    )}

                    {searchStatus !== "idle" && (
                        <button onClick={resetState} className="mt-2 text-slate-500 font-bold hover:text-slate-800 text-sm py-2">
                            Volver a Escanear
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}
