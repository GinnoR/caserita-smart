# Task: Unit Conversion & Decomposition System

The user needs to handle "Unit of Supply" (bulk purchases) vs "Unit of Sale" (individual sales). For example, buying 1 dozen (12 units) of milk should add 12 individual units to the inventory.

## Todo List
- [x] Research: Define the mapping between Supply Units and Sale Units (Unidades de Comercialización)
- [x] UI: Add "Decomposition Factor" (Unidades de Comercialización) to the Product Master
- [x] Logic: Update stock addition logic in "Guías de Remisión" form
- [x] Refinement: Ensure intelligent form handles decomposition explicitly with visual feedback
- [x] Persistence: Ensure conversion factors are stored in Supabase
- [x] Enable Basic Unit of Measure Editing
- [x] Fix Order Quantities & Unified Matching
- [x] Agregar stock counters (con y sin stock) en la cabecera del `InventoryPanel`.
- [x] Implementar funcionalidad de colapsar/expandir en `InventoryPanel`.
- [x] Añadir buscador manual (tipeable) en el panel de inventario.
- [x] Implementar restricciones de Propietario y Link de Pago por Tarjeta:
    - [x] Agregar campo "Link de Pago con Tarjeta" en `ConfigModal.tsx`.
    - [x] Restringir el botón "Cambiar QR" en `QRModal.tsx` solo para el Propietario.
    - [x] Implementar lógica en `Dashboard.tsx` para enviar link de pago por WhatsApp al seleccionar Tarjeta.
- [x] Migrar almacenamiento de QR a Supabase:
    - [x] Agregar columna `qr_code_data` en `cliente_casero`. (Código listo, requiere SQL)
    - [x] Implementar `getQR` y `saveQR` en `supabaseService`.
    - [x] Actualizar `QRModal.tsx` para usar Supabase.
    - [x] Pasar `userId` de `Dashboard.tsx` a `QRModal`.
- [x] Restringir ConfigModal solo al Propietario:
    - [x] Deshabilitar o advertir en `ConfigModal.tsx` cuando el usuario no sea el propietario.
    - [x] Asegurar que el prop `isOwner` llegue correctamente desde el `Dashboard`.

- [x] Solucionar error RLS en usuario demo:
    - [x] Omitir `ensureCaseroCasero` para el UUID demo en `Dashboard.tsx`.
    - [x] Agregar validación en `supabase-service.ts` para evitar inserts del demo.
    - [x] Verificar que el error de consola desaparezca al entrar como Demo.
- [x] Restaurar Inventario Realista (30 productos de abarrotes).
- [x] Resolver error de RLS para el usuario demo (UUID fijo).
- [x] Generar Identidad Visual Premium (Logo y Branding).
- [x] Crear Tour Visual en walkthrough.md con capturas actuales.
- [x] Verificar persistencia de stock y precios en Supabase.
- [x] **Pruebas del Sistema de Pánico:**
    - [x] Botón de Pánico UI (Sirena + Alerta)
    - [x] Activación por Voz ("Auxilio")
    - [x] Registro remoto de incidente en Supabase
    - [x] Captura de Coordenadas GPS (Latitud/Longitud) y "Teleprompter" de PIN en pantalla.
- [x] **Gestión de PWA (Instalación Móvil):**
    - [x] Configuración de `manifest.json` y `sw.js` (Service Worker).
    - [x] Modificación de `layout.tsx` para aceptar instalación nativa en iOS/Android.
    - [x] Botón flotante "Instalar App" habilitado.
- [x] **API de Proveedores Real (Supabase):**
    - [x] Migración SQL `proveedores`.
    - [x] Conexión CRUD (Crear, Editar, Borrar, Leer) en `ProveedoresModal.tsx` vía `supabase-service`.
- [x] **Preparación para Producción (Deploy Vercel):**
    - [x] Archivo `.vercelignore` creado.
    - [x] Corrección de reglas en `next.config.ts`.
    - [x] Prueba de compilación `npm run build` exitosa.
