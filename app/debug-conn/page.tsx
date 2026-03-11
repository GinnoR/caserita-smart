
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Database, Globe } from "lucide-react";

export default function DebugConnPage() {
    const [status, setStatus] = useState<any>({
        env: "checking",
        supabase: "checking",
        products: "checking",
        error: null
    });

    useEffect(() => {
        async function runDiagnostics() {
            const results: any = { ...status };

            // 1. Check Env
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            results.env = (url && key) ? "ok" : "missing";
            results.details = { url: url?.substring(0, 20) + "..." };

            setStatus({ ...results });

            // 2. Initializing Client
            try {
                const supabase = createClient();
                results.supabase = "ok";
            } catch (e: any) {
                results.supabase = "error";
                results.error = "Client Init: " + e.message;
            }
            setStatus({ ...results });

            // 3. Fetching Data
            if (results.supabase === "ok") {
                try {
                    const supabase = createClient();
                    const { data, error, status: httpStatus } = await supabase
                        .from('inventario')
                        .select('*')
                        .limit(1);

                    if (error) {
                        results.products = "error";
                        results.error = `DB Error: ${error.message} [Code: ${error.code}] (HTTP: ${httpStatus})`;
                    } else {
                        results.products = "ok";
                        results.count = data?.length || 0;
                    }
                } catch (e: any) {
                    results.products = "error";
                    results.error = "Fatal Fetch: " + e.message;
                }
            }
            setStatus({ ...results });
        }

        runDiagnostics();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-mono text-sm">
            <h1 className="text-xl font-bold mb-6 text-red-400">System Diagnostic (Mobile Connection)</h1>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                        <span>Environment Vars</span>
                    </div>
                    {status.env === "ok" ? <CheckCircle2 className="text-green-400" /> : <Loader2 className="animate-spin text-slate-500" />}
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-purple-400" />
                        <span>Supabase Client</span>
                    </div>
                    {status.supabase === "ok" ? <CheckCircle2 className="text-green-400" /> : status.supabase === "error" ? <XCircle className="text-red-400" /> : <Loader2 className="animate-spin text-slate-500" />}
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-orange-400" />
                        <span>Network / Remote Fetch</span>
                    </div>
                    {status.products === "ok" ? <CheckCircle2 className="text-green-400" /> : status.products === "error" ? <XCircle className="text-red-400" /> : <Loader2 className="animate-spin text-slate-500" />}
                </div>

                {status.error && (
                    <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
                        <p className="font-bold mb-2 uppercase text-xs">Error Detail:</p>
                        <p className="break-all">{status.error}</p>
                    </div>
                )}

                {status.products === "ok" && (
                    <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200">
                        <p>Connection: VERIFIED</p>
                        <p>Items found: {status.count}</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => window.location.reload()}
                className="mt-8 w-full py-3 bg-red-600 rounded-xl font-bold active:scale-95 transition-all"
            >
                RE-RUN DIAGNOSTIC
            </button>
        </div>
    );
}
