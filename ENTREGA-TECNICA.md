# INSOAMIL — Entrega Técnica

**Sitio público:** https://insoamil.web.app
**Panel de gestión:** https://insoamil.web.app/admin/
**Proyecto Firebase:** `insoamil-web` (consola: https://console.firebase.google.com/project/insoamil-web)
**Repositorio:** https://github.com/tecchnova-cmd/insoamil-web

Construido en 9 fases (ver historial de commits del repo, uno por fase). Este documento es el cierre técnico: qué se construyó, cómo administrarlo, cómo desplegarlo y qué queda pendiente.

---

## 1. Estructura del repositorio

```
insoamil-web/
├── index.html               ← Sitio público (HTML + CSS + JS, un solo archivo, sin build)
├── web-insoamil.html        ← Copia idéntica de index.html (histórico del kit original)
├── assets/                  ← Imágenes del sitio público (logo, fondos, favicon)
├── firebase.json            ← Config de Hosting (2 sitios), Firestore y Storage
├── firestore.rules          ← Reglas de seguridad de Firestore
├── firestore.indexes.json   ← Índices compuestos necesarios
├── storage.rules            ← Reglas de seguridad de Storage
├── admin/                   ← Build compilado del panel (esto es lo que se publica en /admin/)
└── admin-app/                ← Código FUENTE del panel (React + Vite) — edita aquí, no en admin/
    ├── package.json
    ├── scripts/copy-dist.mjs ← copia admin-app/dist → ../admin automáticamente
    └── src/
        ├── firebase.js       ← Config del SDK de Firebase (claves públicas, no son secretas)
        ├── auth/             ← Login, cambio de contraseña, contexto de autenticación
        ├── components/       ← Layout, ConfirmDialog, RichTextField, etc.
        ├── lib/              ← Utilidades: actividad, roles, categorías, compresión de imágenes, texto enriquecido
        └── modules/          ← Un archivo por sección del panel (Dashboard, Mensajes, FAQs, Servicios, etc.)
```

**Regla de oro:** el sitio público (`index.html`) NUNCA necesita `npm install` ni build — es HTML plano. Solo `admin-app/` es un proyecto Node/Vite.

---

## 2. Estructura de Firestore

Base de datos `(default)`, modo Nativo. Colecciones:

| Colección | Contenido | Quién escribe |
|---|---|---|
| `users/{uid}` | Perfil de cada usuario del panel: `email, displayName, role, active, forcePasswordChange, createdAt/By, updatedAt/By` | Solo superadmin |
| `siteSettings/general` | WhatsApp (número/mensaje), email, dirección, horarios, redes sociales, texto de footer | superadmin, admin |
| `faqCategories/{id}` | Categorías de preguntas frecuentes: `name, order, active` | superadmin, admin, editor |
| `faqs/{id}` | Preguntas: `categoryId, question, answer, order, active` | superadmin, admin, editor |
| `workProcess/_section` | Título/intro/botón de "Cómo Trabajamos" | superadmin, admin, editor |
| `workProcess/{id}` | Pasos del proceso: `title, description, icon, order, active` | superadmin, admin, editor |
| `operatorsContent/main` | Sección "Sectores": título, intro, y bloques Estratégico/No Estratégico (texto enriquecido, ícono, CTA, visibilidad, orden) | superadmin, admin, editor |
| `services/{id}` | Los 17 servicios (+ los que se agreguen): todos los campos de texto, `images[]`, `files[]` (URLs + metadatos, los binarios están en Storage), `categoria, order, isOriginal, numeroOriginal, active` | superadmin, admin, editor |
| `messages/{id}` | Mensajes del formulario público. Subcolecciones `notes/` y `history/` | Público solo crea; superadmin/admin/comercial gestionan |
| `activityLogs/{id}` | Bitácora de acciones del panel: `uid, accion, modulo, docId, detalle, fecha` | Cualquier usuario activo (solo lectura para superadmin/admin) |

Todos los documentos administrables llevan `createdAt/updatedAt` (timestamp del servidor), `createdBy/updatedBy` (uid) y `active`/`order` cuando aplica.

---

## 3. Estructura de Firebase Storage

Bucket: `insoamil-web.firebasestorage.app`

```
services/{serviceId}/images/{archivo}.jpg   ← hasta 5 por servicio, comprimidas a ~1600px/JPEG antes de subir
services/{serviceId}/files/{archivo}        ← hasta 3 por servicio (PDF/DOC/DOCX/XLS/XLSX)
```

Todo lo demás en el bucket está bloqueado por regla.

---

## 4. Reglas de seguridad (resumen — el texto completo está en `firestore.rules` y `storage.rules`)

- **Lectura pública**: solo documentos con `active == true` en `faqs`, `faqCategories`, `workProcess`, `services`; y siempre en `siteSettings`, `operatorsContent` (estos dos ya controlan su propia visibilidad con un campo `visible`/`sectionVisible`).
- **`messages`**: el público solo puede **crear** (con validación de campos y límites de tamaño), nunca leer/editar/borrar. Solo superadmin/admin/comercial gestionan la bandeja.
- **Edición de contenido** (FAQs, proceso, operadores, servicios): superadmin, admin y editor.
- **`siteSettings` y `usuarios`**: solo superadmin y admin (usuarios: solo superadmin puede crear/editar/eliminar a otros).
- **Storage**: lectura pública de imágenes/archivos de servicios; escritura solo para roles con permiso de edición de contenido, validando tipo de archivo y tamaño máximo (5MB imágenes, 10MB documentos).
- Ningún rol se valida solo en el frontend — todo está repetido y forzado en las reglas de Firestore/Storage, que es lo que realmente protege los datos.

**Nota técnica importante para el futuro**: las reglas de Storage necesitan permiso de IAM (`roles/datastore.viewer` para la cuenta de servicio de Storage) para poder leer el rol del usuario desde Firestore. Esto ya está configurado en el proyecto — si algún día se recrea el proyecto desde cero, hay que volver a otorgar ese permiso o las subidas de imágenes/archivos fallarán con "Permission denied" sin explicación clara.

---

## 5. Cómo correr el panel en local

```bash
cd admin-app
npm install
npm run dev
```

Abre `http://localhost:5173`. Usa las mismas credenciales del panel en producción (es el mismo proyecto Firebase, no hay entorno de pruebas separado).

---

## 6. Cómo desplegar cambios

**Cambios al sitio público** (`index.html`): edítalo directamente y despliega:
```bash
firebase deploy --only hosting --project insoamil-web
```

**Cambios al panel** (`admin-app/src/...`):
```bash
cd admin-app
npm run build          # compila y copia automáticamente a ../admin
cd ..
firebase deploy --only hosting --project insoamil-web
```

**Cambios a las reglas de seguridad o índices**:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project insoamil-web
```

**Todo junto**:
```bash
firebase deploy --project insoamil-web
```

No hay CI/CD automático: cada cambio requiere ejecutar `firebase deploy` manualmente (a diferencia de Render, que sí redesplegaba solo con cada `git push` — se decidió así al migrar a Firebase Hosting).

---

## 7. Variables de entorno / credenciales

**No hay archivo `.env` ni credenciales que configurar.** La configuración del SDK de Firebase Web (`apiKey`, `authDomain`, etc., en `admin-app/src/firebase.js` y en el `<script type="module">` de `index.html`) son **identificadores públicos, no secretos** — así están diseñados por Firebase. La seguridad real vive en `firestore.rules` y `storage.rules`, no en ocultar esa configuración.

**Confirmado: no hay contraseñas, claves privadas ni tokens de servicio en el repositorio.** La contraseña del superadministrador nunca se escribió en ningún archivo — se creó una vez mediante un script temporal (usando las credenciales OAuth ya autorizadas de Firebase CLI, sin generar ni guardar ninguna clave de cuenta de servicio) y ese script se descartó de inmediato tras usarse.

---

## 8. Usuarios y acceso

- El superadministrador (`insoamil@gmail.com`) puede crear más usuarios desde **Panel → Usuarios y Permisos**, asignando uno de 5 roles (Superadministrador, Administrador, Editor, Comercial, Solo lectura).
- Si alguna vez olvidas tu contraseña: pantalla de login → "¿Olvidaste tu contraseña?".
- Un usuario "eliminado" desde el panel pierde el acceso (su perfil se borra), pero su cuenta de correo en Firebase Authentication no se borra automáticamente — solo un superadmin puede borrarla manualmente desde la consola de Firebase si hace falta.

---

## 9. Decisiones deliberadas (simplificaciones conscientes, no descuidos)

- **Categorías de servicios** (Diagnóstico, Licenciamiento, Monitoreo, Desechos, Contingencia) son una lista fija en el código, no una colección administrable — la especificación original solo pedía que las categorías de *FAQ* fueran gestionables.
- **"Guardar borrador / Publicar"** no se implementó como un estado separado en Cómo Trabajamos ni Operadores — todos los módulos de contenido guardan y publican al instante, por consistencia entre módulos. Si esto se necesita de verdad en el futuro, es una fase adicional razonable.
- **`admins` y `users`** se unificaron en una sola colección `users` con un campo `role` — más simple que mantener dos colecciones paralelas.
- Ningún dato de ejemplo/ficticio quedó en producción: los 17 servicios, las FAQs, los pasos del proceso y los textos de sectores son el contenido real que proporcionaste; los campos que no llenaste (descripciones ampliadas, beneficios, requisitos de cada servicio) están vacíos a propósito, listos para que los completes desde el panel cuando quieras.

---

## 10. Verificación realizada

Cada fase se probó de punta a punta con un navegador real (no solo revisando el código): login, creación/edición/eliminación en cada módulo, subida real de imágenes y archivos, envío real de un mensaje de contacto, cambio y restauración segura del número de WhatsApp, auditoría de que no hay desbordamiento horizontal ni errores de consola en móvil/tablet/escritorio, y navegación por teclado en el acordeón de FAQ y los modales.
