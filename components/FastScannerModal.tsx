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
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-300 backdrop-blur-sm">
            {/* Background Tap to Close (Mobile) */}
            <div className="absolute inset-0 z-0" onClick={onClose}></div>

            <div className="bg-white rounded-t-[2.5rem] sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[92vh]">
                {/* Pull Bar for Mobile Drawer feel */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 sm:hidden" onClick={onClose}></div>

                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Camera className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Caja Rápida</h2>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-90">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5 bg-slate-50 overflow-y-auto">
                    {/* Scanner Area */}
                    {isScanning ? (
                        <div className="relative w-full rounded-3xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner border-4 border-white/10">
                            <div id="reader" className="w-full h-full object-cover"></div>
                            <button
                                onClick={stopScanner}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-black text-sm shadow-2xl border-2 border-white/20 active:scale-95 transition-all"
                            >
                                DETENER CÁMARA
                            </button>
                        </div>
                    ) : (
                        searchStatus === "idle" && (
                            <button
                                onClick={startScanner}
                                className="w-full bg-blue-100 hover:bg-blue-200 border-4 border-dashed border-blue-300 py-12 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-95 text-blue-700 group"
                            >
                                <div className="bg-blue-200 p-4 rounded-full group-hover:scale-110 transition-transform">
                                    <Camera className="w-14 h-14" />
                                </div>
                                <span className="font-black text-xl tracking-tight">Activar Cámara</span>
                            </button>
                        )
                    )}

                    {errorMsg && <div className="text-red-600 font-black text-sm text-center bg-red-100 p-4 rounded-2xl border-2 border-red-200 animate-shake">{errorMsg}</div>}

                    {/* Manual Input Fallback */}
                    {searchStatus === "idle" && !isScanning && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <hr className="flex-1 border-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">O Ingresa Manual</span>
                                <hr className="flex-1 border-slate-300" />
                            </div>
                            <form onSubmit={handleManualScan} className="flex gap-3">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={scannedCode}
                                    onChange={(e) => setScannedCode(e.target.value)}
                                    placeholder="Código de barras..."
                                    className="flex-1 p-5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-slate-900 font-mono text-center text-2xl font-black bg-white shadow-sm"
                                    autoFocus
                                />
                                <button type="submit" className="bg-blue-600 text-white p-5 rounded-2xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
                                    <Search className="w-8 h-8" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Results Area */}
                    {searchStatus === "searching" && (
                        <div className="py-16 flex flex-col items-center gap-4 text-blue-600">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-black text-lg">Buscando producto...</p>
                        </div>
                    )}

                    {searchStatus === "found_local" && localMatches.length > 0 && (
                        <div className="bg-green-50 border-4 border-green-500 rounded-[2rem] p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-300">
                            <div className="bg-green-100 p-3 rounded-full mb-3">
                                <CheckCircle className="w-14 h-14 text-green-600" />
                            </div>
                            <p className="text-green-900 font-black text-xl mb-4 text-center tracking-tight">¡Encontrado en Stock!</p>

                            <div className="w-full flex flex-col gap-4 mt-2">
                                {localMatches.map((match, idx) => (
                                    <div key={match.id || idx} className="bg-white p-5 rounded-2xl shadow-md border-2 border-green-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 leading-none mb-1">{match.name}</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{match.category}</span>
                                            </div>
                                            <span className="text-green-700 font-black text-2xl whitespace-nowrap ml-2">S/ {match.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-y border-slate-50">
                                            <span className="text-sm font-bold text-slate-500">Stock: 
                                                <strong className={`ml-2 text-lg ${match.stock <= (match.unidades_base > 1 ? match.unidades_base : 5) ? 'text-red-600 font-black' : 'text-slate-900'}`}>
                                                    {match.unidades_base > 1 
                                                        ? `${(match.stock / match.unidades_base).toFixed(1)} ${match.name.match(/\(([^)]+)\)/)?.[1]?.split(' ')?.[0]?.toLowerCase() || 'unid'}${ (match.stock / match.unidades_base) !== 1 ? 's' : ''}`
                                                        : `${match.stock} ${match.um === 'und' ? 'unid' : match.um}`}
                                                </strong>
                                            </span>
                                            {match.fecha_caducidad && (
                                                <span className="text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-black text-[10px] border border-orange-100 uppercase tracking-tighter">
                                                    Vence: {new Date(match.fecha_caducidad).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (navigator.vibrate) navigator.vibrate(50);
                                                handleQuickAddLocal(match);
                                            }}
                                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            VENDER [+1] 🛒
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => {
                                setLocalMatches([]);
                                handleScanMasterForce(scannedCode);
                            }} className="mt-6 text-sm font-black text-green-700 underline decoration-2 decoration-green-400/50 hover:text-green-900 transition-colors uppercase tracking-widest">
                                + Ingresar nuevo lote
                            </button>
                        </div>
                    )}

                    {searchStatus === "found_master" && foundProduct && (
                        <div className="bg-indigo-50 border-4 border-indigo-400 rounded-[2rem] p-6 flex flex-col shadow-xl animate-in slide-in-from-bottom-6">
                            <div className="flex items-center gap-3 text-indigo-700 mb-4 justify-center bg-indigo-100/50 py-2 rounded-full">
                                <Database className="w-5 h-5" />
                                <span className="font-black text-[10px] tracking-[0.2em] uppercase">Base Global Caserita</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 text-center mb-1 leading-tight">{foundProduct.product_name}</h3>
                            <p className="text-sm font-bold text-slate-500 text-center mb-6">{foundProduct.brand || 'Genérico'} • {foundProduct.category}</p>

                            <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 mb-6 grid grid-cols-2 gap-5 shadow-inner">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Precio (S/)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        inputMode="decimal"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        className="w-full text-3xl font-black text-indigo-700 bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 text-center outline-none focus:border-indigo-500 shadow-sm"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Stock</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={newStock}
                                        onChange={e => setNewStock(e.target.value)}
                                        className="w-full text-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center outline-none focus:border-indigo-400"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Vencimiento</label>
                                    <input
                                        type="date"
                                        value={newExpiry}
                                        onChange={e => setNewExpiry(e.target.value)}
                                        className="w-full text-lg font-black text-slate-700 bg-white border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 appearance-none"
                                    />
                                </div>
                            </div>

                            <button onClick={handleSaveFromMaster} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 text-xl">
                                GUARDAR Y VENDER 🚀
                            </button>
                        </div>
                    )}

                    {searchStatus === "not_found" && (
                        <div className="bg-amber-50 border-4 border-amber-400 rounded-[2rem] p-8 flex flex-col items-center shadow-xl text-center animate-in zoom-in-90">
                            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-5">
                                <Search className="w-12 h-12 text-amber-600" />
                            </div>
                            <h3 className="text-2xl font-black text-amber-900 mb-3 tracking-tight">No reconocido</h3>
                            <p className="text-amber-700 font-medium mb-8 leading-relaxed">
                                El código <span className="font-mono font-black bg-white px-2 py-0.5 rounded-lg border border-amber-200">{scannedCode}</span> no está en el sistema.
                            </p>

                            <button
                                onClick={() => {
                                    onClose();
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-lg"
                            >
                                REGISTRAR MANUAL ✍️
                            </button>
                        </div>
                    )}

                    {searchStatus !== "idle" && (
                        <button onClick={resetState} className="mt-2 text-slate-400 font-black hover:text-slate-600 text-xs py-3 uppercase tracking-[0.2em] transition-colors">
                            REINTENTAR ESCANEO 🔄
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}
