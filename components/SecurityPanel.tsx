
"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Play, Settings, Shield, Maximize2, RefreshCw, Power, AlertTriangle, Bell, BellOff } from "lucide-react";
import { playSiren, stopSirenInternal } from "@/lib/siren-utils";
import { createClient } from "@/utils/supabase/client";

interface SecurityPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CameraConfig {
    id: string;
    name: string;
    url: string;
    type: "Domo" | "Bala";
    status: "online" | "offline";
}

export function SecurityPanel({ isOpen, onClose }: SecurityPanelProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [cameras, setCameras] = useState<CameraConfig[]>([
        { id: "1", name: "PS3 Eye (Vigilancia)", url: "externa", type: "Domo", status: "offline" },
        { id: "2", name: "Laptop HP (Caja)", url: "caja", type: "Domo", status: "offline" },
        { id: "3", name: "Temu 1 (Fachada)", url: "temu", type: "Bala", status: "offline" },
        { id: "4", name: "Temu 2 (Entrada)", url: "temu", type: "Bala", status: "offline" },
    ]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [selectedCamId, setSelectedCamId] = useState<string>("1");

    // Cargar lista de cámaras disponibles y sincronizar estados
    useEffect(() => {
        const getDevices = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.warn("API de mediaDevices no soportada en este entorno (Requiere HTTPS o localhost).");
                    setDevices([]);
                    return;
                }

                // Pedir permiso básico
                const streamPromise = navigator.mediaDevices.getUserMedia({ video: true });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000));
                
                await Promise.race([streamPromise, timeoutPromise])
                    .then((s: any) => { if(s) s.getTracks().forEach((t:any) => t.stop()); })
                    .catch(() => console.log("Permiso omitido o lento"));
                
                const devs = await navigator.mediaDevices.enumerateDevices();
                const videoDevs = devs.filter(d => d.kind === 'videoinput');
                setDevices(videoDevs);
                
                // PRIORIDAD: Buscar ManyCam (Puente estable), PS3 Eye, u OBS
                const targetCamera = videoDevs.find(d => {
                    const label = d.label.toLowerCase();
                    return label.includes('manycam') || 
                           label.includes('ps3') || 
                           (label.includes('eye') && !label.includes('hp')) ||
                           label.includes('b4.09.24.1') ||
                           label.includes('obs virtual');
                });

                if (targetCamera && !selectedDeviceId) {
                    setSelectedDeviceId(targetCamera.deviceId);
                    setCameras(prev => prev.map(c => 
                        c.id === "1" ? { ...c, name: targetCamera.label || "PS3 Eye / Externa" } : c
                    ));
                } else if (videoDevs.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(videoDevs[0].deviceId);
                    setCameras(prev => prev.map(c => 
                        c.id === "1" ? { ...c, name: videoDevs[0].label || "Cámara Local" } : c
                    ));
                }
            } catch (err) {
                console.error("Error listando dispositivos:", err);
            }
        };
        if (isOpen) getDevices();
    }, [isOpen, refreshKey]);

    // Sincronizar el estado de 'online' basado en si hay stream activo
    useEffect(() => {
        setCameras(prev => prev.map(c => {
            if (c.id === "1") return { ...c, status: stream ? "online" as const : "offline" as const };
            // La cam 2 suele ser la integrada, si hay más de 1 dispositivo la marcamos como "standby" (online)
            if (c.id === "2" && devices.length > 1) return { ...c, status: "online" as const };
            return c;
        }));
    }, [stream, devices]);

    const [statusMsg, setStatusMsg] = useState<string>("Esperando inicio...");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResults, setAiResults] = useState<{ 
        risk: string, 
        tags: string[], 
        description?: string,
        counts?: { sacos?: number, cajas?: number, personas?: number, huecos_estante?: number } 
    } | null>(null);

    // Detección de entorno para decidir si usamos hardware local o proxy
    const [useProxy, setUseProxy] = useState(false);
    useEffect(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isInsecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        setUseProxy(isMobile || isInsecure);
    }, []);

    const [isAutoMonitoring, setIsAutoMonitoring] = useState(true);
    const [isSirenPlaying, setIsSirenPlaying] = useState(false);
    const [remoteRefreshKey, setRemoteRefreshKey] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Timer para refrescar cámaras remotas (Temu) cada 1s en móvil
    useEffect(() => {
        if (isOpen && selectedCamId !== "1") {
            const timer = setInterval(() => {
                setRemoteRefreshKey(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [selectedCamId, isOpen]);

    // Auto-scroll a resultados y auto-limpieza
    useEffect(() => {
        if (aiResults && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth' });
            
            // Auto-limpieza después de 5 segundos para liberar la pantalla
            const timer = setTimeout(() => {
                setCapturedImage(null);
                setAiResults(null);
                setStatusMsg("Sistema Listo");
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [aiResults]);

    const stopSiren = () => {
        stopSirenInternal();
        setIsSirenPlaying(false);
    };

    // Función para capturar y analizar frame
    const analyzeThreat = async (isAuto = false) => {
        if (!isOpen) return;
        
        const currentCam = cameras.find(c => c.id === selectedCamId);
        if (!currentCam) return;

        if (!isAuto) setIsAnalyzing(true);
        setStatusMsg(isAuto ? "Vigilando..." : "Capturando frame...");

        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            let imageData = "";

            // Caso 1: Cámara Local (PC)
            if (!useProxy && videoRef.current && (currentCam.id === "1" || currentCam.id === "2")) {
                canvas.width = videoRef.current.videoWidth || 640;
                canvas.height = videoRef.current.videoHeight || 480;
                ctx.drawImage(videoRef.current, 0, 0);
                imageData = canvas.toDataURL("image/jpeg", 0.7);
            } 
            // Caso 2: Cámara Remota o Mobile (Proxy)
            else {
                // Capturamos el frame actual del proxy directamente
                const response = await fetch(`/api/cam?src=${currentCam.url}`);
                const blob = await response.blob();
                imageData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            if (!imageData) throw new Error("No se pudo capturar la imagen");
            setCapturedImage(imageData);

            if (!isAuto) setStatusMsg("IA Gemini analizando...");
            
            // Llamada real a la API de Visión
            const aiResponse = await fetch("/api/analyze-vision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData })
            });

            const results = await aiResponse.json();
            setAiResults(results);

            if (results.risk === "ALTO") {
                triggerEmergencyAlert();
                setStatusMsg(`🚨 AMENAZA: ${results.description}`);
                speak(`¡Atención! Peligro detectado. ${results.description}`);
            } else {
                setStatusMsg(isAuto ? "Zona Segura ✅" : `Análisis: ${results.description || "Todo normal"}`);
                
                // Generar mensaje de voz para conteos
                if (!isAuto && results.counts) {
                    let voiceMsg = "Análisis completado. ";
                    if (results.counts.huevos) voiceMsg += `Se detectaron ${results.counts.huevos} huevos. `;
                    if (results.counts.sacos) voiceMsg += `Hay ${results.counts.sacos} sacos. `;
                    if (results.counts.cajas) voiceMsg += `Veo ${results.counts.cajas} cajas. `;
                    if (results.counts.personas) voiceMsg += `Hay ${results.counts.personas} personas. `;
                    speak(voiceMsg);
                }
            }

        } catch (err) {
            console.error("Error en análisis:", err);
            setStatusMsg("Error en IA Gemini");
        } finally {
            if (!isAuto) setIsAnalyzing(false);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-PE";
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Función para disparar la emergencia real
    const triggerEmergencyAlert = async () => {
        console.warn("🚨 IA DETECTÓ AMENAZA! DISPARANDO SIRENAS 🚨");
        setStatusMsg("🚨 AMENAZA DETECTADA! 🚨");
        
        // 1. Sirena Física
        playSiren(45); 
        setIsSirenPlaying(true);

        // 2. Registro en Supabase
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase.from('alertas_seguridad').insert({
                    cod_casero: session.user.id,
                    tipo_alerta: 'IA_ENCAPUCHADO',
                    origen: 'VisionSystem',
                    resuelto: false
                });
            }
        } catch (e) {
            console.error("Error logging IA alert", e);
        }

        // 3. Simulación de WhatsApp
        const emergencyPhone = localStorage.getItem('caserita_emergency_1') || '999111222';
        console.log(`📱 Enviando alerta WhatsApp a ${emergencyPhone}: [ALERTA] Sujeto sospechoso detectado en Pasillo 1.`);
    };

    // Efecto para monitoreo automático cada 15 segundos
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoMonitoring && isOpen) {
            interval = setInterval(() => {
                analyzeThreat(true);
            }, 15000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAutoMonitoring, isOpen]);

    // Función para iniciar la cámara USB local
    const startWebcam = async (forceId?: string) => {
        const deviceToUse = forceId || selectedDeviceId;
        if (!deviceToUse) {
            setStatusMsg("Selecciona una cámara");
            return;
        }

        console.log("🚀 Intentando iniciar cámara con ID:", deviceToUse);
        setStatusMsg("Iniciando hardware...");
        
        // Detener stream previo si existe
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Intento 1: Formato compatible PS3 Eye (640x480)
        try {
            const constraints: MediaStreamConstraints = {
                video: { 
                    deviceId: deviceToUse ? { exact: deviceToUse } : undefined,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStatusMsg("Cámara activa ✅");
            }
        } catch (err: any) {
            console.warn("Fallo Intento 1, probando modo ultra-genérico...", err);
            
            // Intento 2: Sin ninguna restricción (Solo el ID)
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: deviceToUse ? { deviceId: deviceToUse } : true 
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    setStatusMsg("Cámara activa (Modo Seguro) ✅");
                }
            } catch (err2: any) {
                console.warn("Fallo Intento 2, probando modo 320x240...", err2);
                
                // Intento 3: Baja resolución (Compatible con todo)
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            deviceId: deviceToUse,
                            width: 320,
                            height: 240
                        } 
                    });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        setStatusMsg("Cámara activa (320x240) ✅");
                    }
                } catch (err3: any) {
                    console.error("Error final:", err3);
                    if (err3.name === 'NotReadableError' || err2.name === 'NotReadableError') {
                        setStatusMsg("BLOQUEO: Cámara ocupada. Usa OBS Virtual Camera.");
                    } else {
                        setStatusMsg(`Error: ${err3.name || 'Fallo total'}`);
                    }
                }
            }
        }
    };

    // Detener cámara al cerrar SOLO si no está en modo centinela
    useEffect(() => {
        if (!isOpen && stream && !isAutoMonitoring) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [isOpen, stream, isAutoMonitoring]);

    const [isConfiguring, setIsConfiguring] = useState(false);

    return (
        <div className={`fixed inset-0 z-[20000] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/90 backdrop-blur-md transition-all overflow-y-auto pt-12 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`bg-slate-900 text-white w-full h-auto min-h-[92vh] md:h-[90vh] md:max-w-6xl rounded-t-[2.5rem] md:rounded-3xl overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col border-t md:border border-slate-800 transition-transform duration-300 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full md:scale-95'}`}>
                
                {/* Header */}
                <div className="bg-slate-800/50 p-4 md:p-6 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="bg-red-500 p-1.5 md:p-2 rounded-lg animate-pulse">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic leading-none">Vigilancia</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">IA Activa</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={stopSiren}
                            className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${isSirenPlaying ? 'bg-red-600 hover:bg-red-500 text-white animate-bounce' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                            title="Silenciar Sirena"
                        >
                            <BellOff className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase hidden md:inline">Silenciar</span>
                        </button>
                        <button 
                            onClick={() => setIsConfiguring(!isConfiguring)}
                            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-all"
                        >
                            <Settings className="w-5 h-5 text-slate-300" />
                        </button>
                        <button onClick={() => { stopSiren(); onClose(); }} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row p-4 gap-4">
                    
                    {/* Viewport Grid & Tabs */}
                    <div className="flex-1 flex flex-col gap-2">
                        {/* Vista de Cámaras */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin shrink-0">
                            {cameras.map(cam => (
                                <button
                                    key={cam.id}
                                    onClick={() => setSelectedCamId(cam.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border-2 ${selectedCamId === cam.id ? 'bg-orange-500 text-black border-orange-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                >
                                    {cam.name}
                                </button>
                            ))}
                        </div>

                        {cameras.filter(c => c.id === selectedCamId).map((cam) => (
                            <div key={cam.id} className="relative bg-black rounded-2xl overflow-hidden group border border-slate-800 hover:border-orange-500/50 transition-all flex-1 min-h-[30vh] md:min-h-[50vh]">
                                {/* Video Label */}
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {cam.status}
                                    </span>
                                    <span className="bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-md text-[10px] font-bold text-white uppercase border border-white/10">
                                        {cam.name}
                                    </span>
                                </div>

                                {/* Video Placeholder / Stream */}
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                                    {(cam.id === "1" || cam.id === "2") && !useProxy ? (
                                        <div className="relative w-full h-full group/video flex items-center justify-center">
                                            {/* Video Stream Local (PC Only) */}
                                            <video 
                                                ref={videoRef} 
                                                autoPlay 
                                                playsInline 
                                                className={`w-full h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] ${!stream ? 'hidden' : 'block'}`}
                                            />

                                            {/* Controls Overlay Local */}
                                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-slate-900/90 backdrop-blur-md transition-opacity ${stream ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                                                {!stream && (
                                                    <div className="flex flex-col items-center mb-4">
                                                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden border border-slate-700">
                                                            <Camera className="w-10 h-10 text-slate-500 relative z-10" />
                                                            <div className="absolute inset-0 bg-orange-500/10 animate-pulse rounded-full"></div>
                                                        </div>
                                                        <p className="text-white font-black tracking-widest text-sm mt-4 text-center">CENTRO DE MONITOREO LOCAL</p>
                                                    </div>
                                                )}
                                                
                                                {devices.length > 0 && (
                                                    <div className="w-full max-w-[300px] flex flex-col gap-1">
                                                        <select 
                                                            value={selectedDeviceId}
                                                            onChange={(e) => {
                                                                const newId = e.target.value;
                                                                setSelectedDeviceId(newId);
                                                                startWebcam(newId);
                                                            }}
                                                            className="bg-black/60 text-white text-[11px] font-bold py-3 px-4 rounded-xl border border-white/20 w-full"
                                                        >
                                                            {devices.map(d => (
                                                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Cámara ${d.deviceId.slice(0,5)}`}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={() => startWebcam()}
                                                    className="w-full max-w-[300px] bg-orange-500 text-black py-3 rounded-xl font-black uppercase text-sm hover:bg-orange-400"
                                                >
                                                    {stream ? "REINTENTAR CONEXIÓN" : "INICIAR VIGILANCIA LOCAL"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full group/video flex items-center justify-center">
                                            {/* Stream Remoto usando proxy de frames (Mobile & Temu) */}
                                            <img 
                                                src={`/api/cam?src=${cam.url}&t=${remoteRefreshKey}`} 
                                                alt={`Cámara ${cam.name}`} 
                                                className="w-full h-full object-contain"
                                                onError={(e) => { 
                                                    setStatusMsg(`${cam.name} fuera de línea`); 
                                                }}
                                                onLoad={() => {
                                                    setStatusMsg(`Conectado a ${cam.name}`);
                                                    setCameras(prev => prev.map(c => c.id === cam.id ? { ...c, status: "online" } : c));
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                        {/* IA Analytics Panel */}
                        <div ref={resultsRef} className="relative bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col overflow-hidden">
                            {capturedImage ? (
                                <div className="flex-1 flex flex-col">
                                    <div className="relative h-40 md:h-64 bg-black shrink-0">
                                        <img src={capturedImage} className="w-full h-full object-contain" alt="Captura IA" />
                                        {aiResults?.risk?.includes("ALTO") && (
                                            <div className="absolute inset-0 border-4 border-red-500 animate-pulse flex items-center justify-center">
                                                <div className="bg-red-500 text-white px-4 py-2 font-black uppercase text-xl rotate-[-10deg]">AMENAZA DETECTADA</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-700 flex-1 overflow-y-auto">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm md:text-lg font-black uppercase text-orange-500 tracking-tighter">Análisis Gemini</h3>
                                            <span className={`${aiResults?.risk?.includes("ALTO") ? 'bg-red-500' : 'bg-green-500'} text-white px-2 py-0.5 md:px-3 md:py-1 rounded text-[10px] md:text-sm font-black`}>
                                                {aiResults?.risk}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-[11px] md:text-xs mb-3 font-medium leading-tight">
                                            {aiResults?.description || "Sin descripción disponible."}
                                        </p>

                                        {/* Bloque de Conteos IA */}
                                        {aiResults?.counts && (
                                            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                                {aiResults.counts.sacos !== undefined && (
                                                    <div className="flex flex-col items-center p-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sacos</span>
                                                        <span className="text-lg font-black text-white">{aiResults.counts.sacos}</span>
                                                    </div>
                                                )}
                                                {aiResults.counts.cajas !== undefined && (
                                                    <div className="flex flex-col items-center p-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Cajas</span>
                                                        <span className="text-lg font-black text-white">{aiResults.counts.cajas}</span>
                                                    </div>
                                                )}
                                                {aiResults.counts.personas !== undefined && (
                                                    <div className="flex flex-col items-center p-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Gente</span>
                                                        <span className="text-lg font-black text-white">{aiResults.counts.personas}</span>
                                                    </div>
                                                )}
                                                {aiResults.counts.huecos_estante !== undefined && (
                                                    <div className="flex flex-col items-center p-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Huecos</span>
                                                        <span className="text-lg font-black text-white text-orange-400">{aiResults.counts.huecos_estante}</span>
                                                    </div>
                                                )}
                                                {aiResults.counts.huevos !== undefined && (
                                                    <div className="flex flex-col items-center p-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Huevos</span>
                                                        <span className="text-lg font-black text-white text-yellow-400">{aiResults.counts.huevos}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {aiResults?.tags?.map(tag => (
                                                <span key={tag} className="bg-slate-800 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-xs font-bold border border-slate-700 shadow-sm">
                                                    # {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 md:gap-3 sticky bottom-0 bg-slate-900 py-2 mt-auto">
                                            <button 
                                                onClick={() => analyzeThreat(false)}
                                                disabled={isAnalyzing}
                                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 md:py-4 rounded-xl font-black uppercase text-[10px] md:text-xs transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 border-b-4 border-red-800 active:scale-95 disabled:opacity-50"
                                            >
                                                {isAnalyzing ? "Analizando..." : <><AlertTriangle className="w-4 h-4" /> Re-Analizar</>}
                                            </button>
                                            <button 
                                                onClick={() => { setCapturedImage(null); setAiResults(null); setStatusMsg("Esperando inicio..."); }}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] md:text-xs font-bold uppercase transition-all border border-slate-700"
                                            >
                                                Limpiar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 relative">
                                            <Shield className={`w-10 h-10 ${isAutoMonitoring ? 'text-green-500 animate-pulse' : 'text-orange-500'}`} />
                                            {isAnalyzing && <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </div>
                                        <h3 className="text-sm font-black uppercase text-slate-400">Vigilancia Inteligente</h3>
                                        <p className="text-[10px] text-slate-500 mt-2 max-w-[200px]">
                                            {isAutoMonitoring 
                                                ? "El sistema está analizando el video automáticamente cada 15 seg." 
                                                : "Activa el modo centinela para monitoreo autónomo."}
                                        </p>
                                        
                                        <div className="flex flex-col gap-3 mt-6 w-full max-w-[200px]">
                                            <button 
                                                onClick={() => setIsAutoMonitoring(!isAutoMonitoring)}
                                                className={`py-3 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 border-2 ${isAutoMonitoring ? 'bg-green-600/20 border-green-500 text-green-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                            >
                                                {isAutoMonitoring ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                                {isAutoMonitoring ? "Modo Centinela Activo" : "Activar Centinela"}
                                            </button>

                                            <button 
                                                onClick={() => analyzeThreat(false)}
                                                disabled={isAnalyzing}
                                                className="bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-black uppercase text-[10px] transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <AlertTriangle className="w-4 h-4" /> Analizar Ahora
                                            </button>

                                            <button 
                                                onClick={() => {
                                                    const mockResults = {
                                                        risk: "ALTO",
                                                        tags: ["TEST", "SIMULACIÓN"],
                                                        description: "SIMULACIÓN DE PRUEBA: Sujeto detectado con actitud sospechosa."
                                                    };
                                                    setAiResults(mockResults);
                                                    triggerEmergencyAlert();
                                                    speak("¡Atención! Iniciando prueba de seguridad. Sirenas activadas.");
                                                }}
                                                className="mt-2 bg-slate-800 text-slate-400 py-2 rounded-xl font-bold uppercase text-[9px] border border-dashed border-slate-600 hover:bg-slate-700 hover:text-white transition-all"
                                            >
                                                🧪 Simular Amenaza (Prueba)
                                            </button>
                                        </div>
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats (Visible only on larger screens) */}
                    <div className="hidden lg:flex w-64 flex-col gap-4">
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                            <h4 className="text-[10px] font-black uppercase text-orange-500 mb-4 tracking-widest">Logs de Seguridad</h4>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 text-[10px]">
                                        <span className="text-slate-500 font-mono">14:2{i}</span>
                                        <p className="text-slate-300 font-bold">Movimiento detectado en Entrada.</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 bg-gradient-to-b from-orange-500 to-orange-700 rounded-2xl p-6 text-black flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-black uppercase mb-1">Estado del Pilot</h4>
                                <p className="text-[10px] font-bold opacity-80 uppercase leading-tight">3 Cámaras configuradas para Caserita Smart</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl">
                                <p className="text-[9px] font-black uppercase opacity-60">Dirección Local IP</p>
                                <p className="text-sm font-mono font-bold">192.168.1.254</p>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    );
}
