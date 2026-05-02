import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const src = searchParams.get("src") || "temu";

    try {
        // Obtenemos un solo frame JPEG de go2rtc
        // Esto es mucho más estable que intentar pasar un stream infinito por Next.js
        const response = await fetch(`http://127.0.0.1:1984/api/frame.jpeg?src=${src}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            return new Response("Cámara no disponible", { status: 502 });
        }

        const buffer = await response.arrayBuffer();

        return new Response(buffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        return new Response("Error de conexión", { status: 500 });
    }
}
