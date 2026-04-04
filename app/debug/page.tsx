"use client";

export default function DebugPage() {
    return (
        <div style={{ padding: '50px', background: 'red', color: 'white', fontSize: '30px', fontWeight: 'bold', height: '100vh' }}>
            PRUEBA DE CONEXIÓN: {new Date().toLocaleString()}
            <br />
            SI VES ESTO EN TU MÓVIL, ESTOY EN LA CARPETA CORRECTA.
        </div>
    );
}
