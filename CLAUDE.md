# CLAUDE.md — Red social gastronómica para Venezuela

> Documento maestro del proyecto. Contiene el contexto de negocio, el alcance del MVP, la arquitectura técnica y las reglas de desarrollo. Claude Code: lee este archivo completo antes de empezar cualquier tarea.
>
> Estado actual: **fase de validación + construcción del MVP**. Desarrollador único (fundador), con experiencia en Next.js, TypeScript, React y Supabase.
>
> Nombre del producto: **crumbz**. Mantenlo centralizado en `packages/shared/src/config.ts` (nombre visible, identificador `com.getcrumbz.app`, dominio `getcrumbz.com`) y usa el alcance `@crumbz/*` para los paquetes del monorepo.

---

## 0. Instrucciones para el agente (léelas primero)

1. **Idiomas:** el código, los nombres de tablas, variables, funciones, commits y comentarios técnicos van en **inglés**. Todo el texto visible para el usuario va en **español de Venezuela**, cercano y natural (tuteo).
2. **No sobreingeniería.** Es un MVP de una sola persona. Monolito modular, nada de microservicios. Si dudas entre algo simple y algo "escalable a futuro", elige lo simple y deja una nota `// TODO(scale):`.
3. **Seguridad primero:** RLS activado en todas las tablas. Nunca uses la secret key (antes `service_role`) en el cliente. Nunca subas secretos al repositorio; usa `.env.local` y documenta las variables en `.env.example`.
4. **Migraciones:** nunca edites una migración ya aplicada. Crea siempre un archivo nuevo en `supabase/migrations/`. Después de cada cambio de esquema, regenera los tipos (ver sección 9).
5. **Rendimiento en gama baja:** asume teléfonos Android modestos y conexiones lentas o intermitentes. Comprime imágenes en el dispositivo, usa listas virtualizadas y evita dependencias pesadas.
6. **Integridad de los rankings:** ninguna funcionalidad puede permitir que un pago altere rankings o reseñas orgánicas. Todo contenido pagado debe marcarse como "Patrocinado". Si una tarea parece violar esto, detente y pregunta.
7. **Antes de tareas grandes**, propón un plan breve y espera confirmación. Para tareas pequeñas, procede directamente.
8. **Al terminar una tarea**, ejecuta typecheck y lint, y resume qué cambiaste y qué falta.
9. Si algo de este documento parece desactualizado o contradictorio con el código, señálalo en lugar de asumir.
10. **Toda tarea que cree o modifique UI** (pantallas móviles, páginas web, componentes, tokens, textos visibles) usa las skills de diseño según la sección 10.1. Al resumir la tarea, indica qué skills se usaron.

---

## 1. Visión del producto

Una red social de comida enfocada en Venezuela donde los usuarios:

- Marcan los restaurantes y lugares que visitaron, **incluidos emprendimientos sin local** que solo hacen delivery o pick-up.
- Publican sus visitas con fotos, puntuación, platos probados y gasto por persona.
- Arman rankings personales de sus lugares y platos favoritos.
- Descubren qué comer siguiendo a otras personas y explorando rankings por ciudad, zona y categoría.

Referente internacional más cercano: **Beli** (Estados Unidos), que prácticamente no tiene presencia en Venezuela. Otras referencias: Yelp, TripAdvisor, Google Maps, Foursquare/Swarm, Mapstr, TheFork, Vivino, Untappd.

### Problema que resolvemos

En Venezuela hay un boom gastronómico (Caracas, Valencia, Maracaibo, Lechería), pero el descubrimiento de dónde comer ocurre de forma desordenada en Instagram, TikTok y WhatsApp. No hay una plataforma local que lo organice, y las preguntas prácticas se resuelven por mensaje directo.

### Diferenciador: información práctica local

Además de reseñas y fotos, cada lugar muestra información que hoy la gente pregunta por DM:

- Precios y gasto por persona en **dólares**.
- **Métodos de pago** aceptados: efectivo en divisas o bolívares, Pago Móvil, punto de venta, Zelle, Binance, transferencia.
- Si tiene **planta eléctrica**.
- **Estacionamiento** y sensación de seguridad al llegar.
- Modalidades: en el local, pick-up, delivery, y **zonas de cobertura** del delivery.
- Botón directo a **WhatsApp** e Instagram.

### Competencia real

El competidor principal no es otra app, sino el hábito de buscar en Instagram, TikTok y Google Maps. Estrategia: **integrarse con esas plataformas** (compartir hacia ellas, traer a los foodies con sus listas y rankings) en lugar de competir de frente.

---

## 2. Modelo de negocio

### Principio central: la confianza

El activo más valioso es la confianza en las recomendaciones. Reglas no negociables:

- Las reseñas y rankings de usuarios **nunca** se venden, ocultan ni alteran.
- Los dueños pueden responder y reportar reseñas falsas (que revisa la plataforma), pero no borrarlas.
- Todo contenido pagado se identifica claramente como "Patrocinado".
- Si una marca patrocina un ranking, los ganadores salen de votos reales.

### Actores del ecosistema

| Actor | Rol | Qué aporta | Qué recibe |
|---|---|---|---|
| Usuarios | Generan valor | Reseñas, fotos, rankings | Descubrimiento, beneficios, reconocimiento |
| Creadores (foodies) | Generan valor | Audiencia desde TikTok/Instagram | Portafolio con métricas, colaboraciones pagadas |
| Restaurantes y emprendimientos | Pagan | Dinero, promociones | Visibilidad, clientes, estadísticas |
| Marcas y bancos | Pagan | Presupuesto de campañas, descuentos | Audiencia segmentada, resultados medibles |

### Ciclo de crecimiento (flywheel)

Más usuarios publicando → más contenido útil → más usuarios → tráfico atrae restaurantes → restaurantes pagan y ofrecen promociones → beneficios atraen más usuarios. Los creadores aceleran el ciclo trayendo audiencia externa.

### Fuentes de ingreso

1. **Restaurantes:** suscripciones con herramientas y estadísticas, más destacados pagados por zona (idealmente por resultado, ej. por clic a WhatsApp).
2. **Emprendimientos de delivery/pick-up:** plan económico o pago por resultado; para ellos el perfil es su "local".
3. **Marcas y bancos:** rutas y rankings patrocinados, retos, beneficios por pago con un banco o billetera, eventos.
4. **Eventos gastronómicos:** semanas temáticas y festivales donde la app es mapa, pasaporte y sistema de votación.
5. **Mercado de creadores:** restaurantes contratan foodies a través de la plataforma; la plataforma cobra comisión.
6. **Comisiones por transacción** (fase avanzada): pedidos y reservas.
7. **Datos agregados y anónimos** (fase avanzada): tendencias de platos, zonas y precios para quienes abren negocios o lanzan productos.

Los usuarios finales no pagan. Se incentivan con gamificación (fase 2) y beneficios reales financiados por restaurantes como canal de adquisición.

### Planes para restaurantes (precios = hipótesis a validar)

| | Gratis | Emprendedor | Pro | Multi-sede / Premium |
|---|---|---|---|---|
| Precio estimado | $0 | ~$8–12/mes | ~$25–40/mes | ~$70–120/mes |
| Para quién | Todos | Delivery, pick-up, pequeños | Restaurantes con local | Cadenas y alto volumen |
| Perfil reclamado y verificado | ✓ | ✓ | ✓ | ✓ |
| Menú con precios y fotos | Básico | Completo | Completo | Completo, por sede |
| Botón WhatsApp / pedido | ✓ | ✓ | ✓ | ✓ |
| Responder reseñas | — | ✓ | ✓ | ✓ |
| Estadísticas | Visitas totales | Visitas y clics | Detalladas | Comparativas entre sedes |
| Promociones activas | — | 1 | Ilimitadas | Ilimitadas |
| Créditos para destacados | — | — | Algunos | Más |
| Acceso a creadores | — | — | Puede contratar | Prioridad |

Complementos por resultado: destacados por clic, participación en campañas, contratación de creadores con comisión.

Recomendaciones comerciales:

- **Precio fundador** (ej. Pro a mitad de precio de por vida) para los primeros 20 restaurantes.
- Facilitar **pago adelantado** de 3 o 6 meses con descuento (cobrar mes a mes en Venezuela es engorroso).
- Cobros iniciales por Pago Móvil, Zelle, Binance o efectivo, con verificación manual desde un panel de administración.
- Los planes se contratan y pagan **en la web**, no dentro de la app móvil, para evitar las reglas de compras integradas de Apple y Google (revisar directrices vigentes antes del lanzamiento).

### Venta a marcas y bancos

Momento: cuando haya audiencia demostrable (referencia: decenas de miles de usuarios activos en una ciudad con buena interacción). Antes, pilotos baratos o gratuitos con marcas medianas para construir casos de éxito.

Formatos, de simple a complejo:

1. **Rutas y rankings patrocinados** ("La ruta de las mejores pizzas de Caracas, presentada por X"). Formato estrella: beneficia a marca, restaurantes y usuarios.
2. **Retos** ("Visita 5 lugares de la ruta y gana premios"): actividad medible.
3. **Beneficios bancarios** ("Paga con X y obtén 15%"): el banco puede financiar el descuento.
4. **Eventos** gastronómicos.
5. **Contenido con creadores** amplificado en TikTok e Instagram.

Sectores objetivo: bebidas (cerveceras, refrescos, rones y licores), alimentos de consumo masivo, bancos, fintechs, billeteras digitales, servicios de crédito en cuotas, delivery, telecomunicaciones. Las agencias de publicidad y de medios son un atajo para llegar a varias marcas.

Herramientas de venta: **media kit** de 6–10 páginas (audiencia, alcance, formatos, casos, precios) y **reportes de resultados** (vistas, participantes, visitas verificadas, fotos). Cobro: tarifa fija por campaña + componente variable por resultados.

> Implicación técnica: diseñar desde el inicio los **eventos de analítica** (vista de perfil, plato guardado, clic a WhatsApp, check-in), porque esos datos son el producto que se vende a restaurantes y marcas.

### Orden de monetización

1. **Fase 1 — Densidad:** todo gratis, una ciudad (Caracas: Las Mercedes, Altamira, Chacao), sembrar contenido con foodies.
2. **Fase 2 — Restaurantes:** reclamar perfil, planes, destacados.
3. **Fase 3 — Marcas, eventos, creadores.**
4. **Fase 4 — Transacciones y datos agregados.**

---

## 3. Plan de validación (en curso)

- Entrevistar a **15–20 dueños** de restaurantes y emprendimientos: cuánto gastan hoy en publicidad e influencers, qué les frustra, qué pagarían por saber de dónde vienen sus clientes. Ese gasto actual es el techo de precio realista.
- Piloto con 5–10 restaurantes usando **enlaces rastreables de WhatsApp** y un reporte manual mensual, antes de programar estadísticas.
- Probar el **precio fundador**.
- Aprovechar la prueba cerrada de Google Play (12 personas, 14 días) como validación con usuarios reales.
- Arranque en frío: lanzar en pocas zonas de Caracas y sembrar contenido propio y de foodies antes de abrir al público.

---

## 4. Contexto venezolano (restricciones de diseño)

- **Conectividad** lenta e intermitente; **cortes de luz**. → Cola local de publicaciones pendientes, reintentos automáticos, la app nunca debe perder una reseña.
- **Datos móviles costosos.** → Imágenes comprimidas en el dispositivo, miniaturas en el feed, carga diferida.
- **Mayoría Android de gama baja**, poco almacenamiento. → App liviana, listas virtualizadas.
- **SMS poco confiable.** → Login con Google y Apple; verificación por WhatsApp como alternativa futura.
- **Economía dolarizada** con múltiples métodos de pago. → Precios en USD; métodos de pago como dato estructurado.
- **Restricciones regulatorias y sanciones:** algunos proveedores en la nube, tiendas y pasarelas tienen limitaciones para cuentas o usuarios en Venezuela. Verificar cada proveedor antes de adoptarlo.
- Cultura de compartir por **WhatsApp**: todo lugar, lista y perfil debe tener un enlace web compartible con buena vista previa (Open Graph).

---

## 5. Alcance del MVP

### Incluido

1. **Registro y perfil:** login con Google y Apple, nombre de usuario, foto, bio, ciudad.
2. **Buscar o crear un lugar:** Google Places para lugares con local; creación manual para emprendimientos de solo delivery/pick-up (con Instagram, WhatsApp y zonas de cobertura).
3. **Publicar una visita** (acción central): fotos, puntuación 1–10, platos probados con "recomendado", gasto por persona en USD, modalidad (en el local / pick-up / delivery), texto opcional.
4. **Perfil del lugar:** fotos, platos más recomendados, puntuación, rango de gasto, información práctica (pagos, planta, estacionamiento, zonas de delivery), botón WhatsApp/Instagram.
5. **Explorar:** cerca de mí, por zona, por categoría.
6. **Rankings** por ciudad y categoría (promedio bayesiano, precalculado).
7. **Listas:** top personal de lugares o platos (ordenable) y "quiero ir".
8. **Social básico:** seguir, feed de seguidos, "me gusta".
9. **Seguridad (obligatorio para las tiendas):** reportar contenido, bloquear usuarios, eliminar cuenta desde la app.
10. **Páginas web públicas** (Next.js) de lugares, listas y perfiles, compartibles e indexables.
11. **Moderación inicial** desde el panel de Supabase (sin panel propio aún).

### Fuera del MVP (no implementar todavía)

Panel pago para restaurantes, reclamar perfil, promociones, campañas de marcas, mercado de creadores, comentarios, mensajería, pedidos y reservas, insignias y gamificación, ranking por comparaciones estilo Beli, notificaciones avanzadas (solo push básico si sobra tiempo).

---

## 6. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Lenguaje | TypeScript (strict) | En todo el monorepo |
| Monorepo | pnpm + Turborepo | Código compartido entre apps |
| App móvil | React Native + **Expo** (Expo Router) | Android + iOS; EAS Build/Submit/Update |
| Web | **Next.js** (App Router) + Tailwind | Páginas públicas, SEO, PWA de validación |
| Backend | **Supabase** | Postgres, Auth, Storage, Edge Functions |
| Base de datos | PostgreSQL + **PostGIS** | Consultas geográficas con índices GiST |
| Validación | Zod | Esquemas compartidos en `packages/shared` |
| Datos en cliente | TanStack Query + supabase-js | Caché y reintentos |
| Listas móviles | FlashList | Rendimiento en gama baja |
| Imágenes móviles | expo-image + expo-image-manipulator | Caché y compresión antes de subir |
| Almacenamiento de fotos | Supabase Storage (inicio) → Cloudflare R2 + CDN | R2 no cobra transferencia de salida |
| Mapas y lugares | Google Places (búsqueda) + catálogo propio | Guardar solo `google_place_id` según términos de Google; evaluar Mapbox/OSM para mostrar mapas por costo |
| Búsqueda | Postgres (pg_trgm) → Meilisearch/Typesense | Migrar cuando haga falta tolerancia a errores |
| Analítica | PostHog | Base de las estadísticas vendibles |
| Notificaciones | Expo Notifications / Firebase Cloud Messaging | |
| Rankings | Vista materializada + pg_cron | Refresco cada 15 min |
| Hosting web | Vercel (inicio) | Posible autoalojamiento si crece el costo; no usar su optimización de imágenes para fotos de usuarios |

### Escalabilidad: puntos a vigilar

- **Rankings:** nunca calcular en vivo; siempre precalculados.
- **Feed:** empezar con consulta directa indexada; migrar a feed pre-generado por usuario cuando crezca.
- **Consultas geográficas:** siempre con índice GiST y `ST_DWithin`.
- **Imágenes:** compresión en dispositivo, varios tamaños, CDN.
- **Consultas N+1:** usar joins de Supabase (`select('*, profile:profiles(*)')`), vistas o RPC.
- **RLS:** políticas simples, columnas indexadas.
- **Realtime:** solo donde aporte; no para todo el feed.
- **Contadores con triggers:** pueden generar contención con mucho tráfico; pasarlos a lotes cuando ocurra.
- Supabase es Postgres estándar: se puede migrar o autoalojar si deja de convenir.

---

## 7. Estructura del monorepo

```
crumbz/
├── CLAUDE.md
├── docs/                       # guías para humanos: inicio, arquitectura, stack, BD, móvil, problemas
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
│   ├── mobile/                 # Expo (React Native) — app de usuarios
│   │   ├── src/
│   │   │   ├── app/            # Expo Router (convención de Expo SDK 55+: rutas dentro de src/)
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (tabs)/     # feed, explorar, publicar, listas, perfil
│   │   │   │   ├── place/[slug].tsx
│   │   │   │   ├── post/[id].tsx
│   │   │   │   └── user/[username].tsx
│   │   │   ├── components/
│   │   │   ├── features/       # auth, places, posts, lists, social, safety
│   │   │   ├── lib/            # supabase client, query client, upload queue
│   │   │   └── hooks/
│   │   └── app.config.ts
│   └── web/                    # Next.js — páginas públicas (+ panel en fase 2)
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── [city]/[placeSlug]/page.tsx
│       │   │   ├── u/[username]/page.tsx
│       │   │   ├── l/[listId]/page.tsx
│       │   │   ├── privacidad/page.tsx
│       │   │   ├── terminos/page.tsx
│       │   │   └── eliminar-cuenta/page.tsx
│       │   └── (admin)/        # fase 2: panel de restaurantes y admin
│       └── src/
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── app-identity.json   # nombre, identificador, scheme, dominio (lo lee también app.config.ts)
│   │       ├── config.ts       # constantes de la app (reexporta app-identity.json)
│   │       ├── database.types.ts   # generado, no editar a mano
│   │       ├── schemas/        # Zod
│   │       └── utils/          # slugs, formato de precios USD, etc.
│   └── ui/                     # (opcional) tokens de diseño compartidos
└── supabase/
    ├── config.toml
    ├── migrations/             # <timestamp>_<nombre>.sql; historial en docs/database.md
    │   ├── 20261025184418_schema_mvp.sql
    │   └── …
    ├── functions/
    │   ├── places/             # búsqueda e importación desde Google Places (la clave no sale del servidor)
    │   └── delete-account/     # Edge Function de eliminación de cuenta (fase 7)
    └── seed.sql
```

---

## 8. Modelo de datos

El esquema completo está en `supabase/migrations/20261025184418_schema_mvp.sql` (archivo `schema_mvp.sql` entregado junto a este documento). Resumen:

| Tabla | Propósito |
|---|---|
| `cities`, `areas` | Ciudades y zonas (con polígono opcional) |
| `profiles` | Perfil público del usuario, ligado a `auth.users` |
| `admins` | Administradores (tabla aparte para evitar autopromoción) |
| `tags` | Categorías: hamburguesas, pizza, arepas… |
| `places` | Lugares; `location` nulo permitido solo si no atiende en el local |
| `place_tags` | Categorías de cada lugar |
| `place_service_areas` | Zonas de cobertura del delivery |
| `place_members` | Dueños/personal (fase 2: reclamar perfil) |
| `dishes` | Platos por lugar (único por nombre sin distinguir mayúsculas) |
| `posts` | **Visitas**: puntuación 1–10, modalidad, gasto USD, texto |
| `post_dishes` | Platos probados en la visita, con "recomendado" |
| `post_photos` | Fotos de la visita, opcionalmente ligadas a un plato |
| `lists`, `list_items` | Rankings personales (indexación fraccionaria para reordenar) |
| `saves` | "Quiero ir" (privado) |
| `follows`, `post_likes` | Social |
| `blocks`, `reports` | Seguridad y moderación |
| `place_rankings` | Vista materializada con promedio bayesiano |

Decisiones clave:

- La **visita** es la unidad central. Un usuario puede visitar un lugar varias veces, pero en los rankings solo cuenta su visita más reciente.
- **Promedio bayesiano:** `score = (n × promedio_lugar + 5 × promedio_global) / (n + 5)`. Evita que un lugar con una sola calificación alta supere a uno con muchas.
- Funciones RPC: `places_nearby(lat, lng, radius_m, max_results)` y `top_places(city_id, tag_slug, min_raters, max_results)`.
- **Contadores** mantenidos por triggers; las columnas de contadores están protegidas contra escritura desde el cliente. Ojo: en Supabase `anon`/`authenticated` tienen UPDATE a nivel de tabla, y un `revoke update (columna)` **no** lo restringe. La forma correcta (ver `…_column_update_privileges.sql`) es `revoke update on tabla` + `grant update (columnas editables)`. Toda columna nueva editable por el usuario debe añadirse a ese `grant`.
- **Eliminación de cuenta:** Edge Function con `service_role` que borra el usuario en `auth.users` (cascada sobre sus datos) y sus archivos del almacenamiento.
- **Bloqueos:** filtrar en consultas de feed y visitas con `not exists (select 1 from blocks ...)`.

---

## 9. Comandos y flujo de desarrollo

```bash
# Instalar dependencias
pnpm install

# Supabase (en la nube; la CLI es devDependency del monorepo, no hace falta Docker)
pnpm supabase login                              # una vez por máquina
pnpm supabase link --project-ref <ref>           # enlaza con crumbz-dev (pide la clave de la BD)

# Nueva migración
pnpm supabase migration new <nombre>

# Aplicar migraciones pendientes al proyecto enlazado
pnpm supabase db push                            # --include-seed para cargar seed.sql

# Regenerar tipos después de cambiar el esquema
pnpm db:types                     # = supabase gen types typescript --project-id <ref> > packages/shared/src/database.types.ts

# Desarrollo
pnpm dev                          # todas las apps vía Turborepo
pnpm --filter mobile start        # solo Expo
pnpm --filter web dev             # solo Next.js

# Calidad
pnpm typecheck
pnpm lint
pnpm test

# Builds móviles (Expo EAS)
eas build --platform android --profile preview
eas build --platform ios --profile preview
eas submit --platform android
eas submit --platform ios
eas update --branch production    # solo correcciones y cambios menores
```

> Si alguno de estos scripts aún no existe en `package.json`, créalo como parte de la configuración inicial.

### Entornos de Supabase y MCP

- **`crumbz-dev`**: proyecto de desarrollo en la nube. Es el único al que se conecta el MCP de Supabase de Claude Code (`.mcp.json`, con `project_ref` fijo).
- **`crumbz-prod`** (cuando exista): solo recibe cambios vía `supabase db push` desde la CLI o CI. Nunca se conecta al MCP.
- La fuente de verdad del esquema son los archivos de `supabase/migrations/`. El MCP se usa para inspeccionar, revisar *advisors* (seguridad y rendimiento), ver logs y consultar datos; no para aplicar cambios de esquema que no queden en una migración.
- `supabase start` / Docker local es opcional y no forma parte del flujo actual.
- **Plan B si `supabase db push` se queda en "Initialising login role…"** (la red bloquea la conexión directa a Postgres, ver `docs/troubleshooting.md`): aplicar la migración con la herramienta `apply_migration` del MCP usando el **mismo SQL del archivo**, consultar la versión asignada con `list_migrations` y renombrar el archivo local a `<version>_<nombre>.sql` para que el historial local y remoto coincidan. Los comandos que usan la API HTTP (`gen types`, `link`) sí funcionan.

### Variables de entorno (`.env.example`)

Cada app lee su propio archivo: `apps/mobile/.env.local` y `apps/web/.env.local`. Los secretos de servidor van en `.env.local` de la raíz (o en los secrets de Edge Functions). Supabase usa las llaves nuevas: **publishable** (`sb_publishable_…`, reemplaza a la *anon key*) y **secret** (`sb_secret_…`, reemplaza a la *service_role*).

```
# Públicas
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SITE_URL=

# Solo servidor / Edge Functions (NUNCA en el cliente)
SUPABASE_SECRET_KEY=
GOOGLE_PLACES_API_KEY=
```

Las variables se validan con Zod al arrancar (`apps/*/src/lib/env.ts`).

La búsqueda en Google Places debe hacerse desde una Edge Function o ruta de servidor, nunca exponiendo la API key en la app.

---

## 10. Convenciones de código

- TypeScript `strict`. Prohibido `any` salvo justificación en comentario.
- Validar toda entrada con **Zod** (esquemas en `packages/shared/src/schemas`), tanto en cliente como en Edge Functions.
- Organización por **features** (`features/posts`, `features/places`…), no por tipo de archivo.
- Acceso a datos mediante hooks de TanStack Query (`usePlace`, `useCreatePost`…), nunca llamadas sueltas a Supabase dentro de componentes.
- Componentes pequeños y funcionales. Estilos consistentes con tokens compartidos.
- Accesibilidad: etiquetas en botones de solo ícono, contraste adecuado, tamaños táctiles ≥ 44 px.
- Precios siempre en USD con formato `$12,50` (coma decimal, convención venezolana). Centralizar en `utils/format.ts`.
- Fechas en zona horaria `America/Caracas`.
- Commits con Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Tests: priorizar lógica crítica (cola de subida, cálculo de rankings, validaciones) sobre tests de UI.

### Manejo de imágenes

- Redimensionar en el dispositivo a máx. ~1600 px de lado largo, calidad ~0,7, formato WebP o JPEG.
- Generar y servir miniatura para el feed.
- Ruta en el bucket: `posts/{user_id}/{post_id}/{photo_id}.webp`.
- Políticas de Storage: el usuario solo escribe en su propia carpeta; lectura pública.

### Cola de publicación offline

- Al publicar, guardar la visita y las fotos en almacenamiento local con estado `pending`.
- Subir en segundo plano con reintentos exponenciales cuando haya conexión.
- Mostrar al usuario el estado ("Publicando…", "Se publicará cuando vuelva la conexión").
- Nunca descartar una publicación pendiente sin confirmación del usuario.

### Analítica (PostHog) — eventos desde el día uno

`place_viewed`, `place_saved`, `whatsapp_clicked`, `instagram_clicked`, `post_created`, `post_viewed`, `dish_recommended`, `list_created`, `list_shared`, `user_followed`, `search_performed`, `ranking_viewed`. Incluir siempre `place_id`, `city_id` y `area_id` cuando aplique.

### 10.1 Diseño y UI/UX: skills del proyecto (`.claude/skills/`)

| Skill | Cuándo usarla | Rol |
|---|---|---|
| `impeccable` | **Siempre** en trabajo de UI. `init` una vez (genera `PRODUCT.md`); `shape` antes de construir cada pantalla o flujo; leer `reference/craft-floor.md` antes de editar UI; `audit` + `polish` al cerrar cada fase con UI (variantes `.native` para la app móvil) | Proceso y control de calidad. Su hook revisa automáticamente los archivos de UI tras cada edición |
| `ui-ux-pro-max` | Al decidir paletas, tipografías, patrones de UX, gráficos y buenas prácticas por stack (React Native, Next.js) | Base de datos de referencia para decisiones de diseño |
| `design-system` | Al crear o cambiar tokens (color, espaciado, tipografía, radios) | Arquitectura de tokens primitivo → semántico → componente, compartidos en `packages/ui` entre móvil y web |
| `brand` | Identidad visual, voz y tono, textos de marketing | Voz de crumbz: español de Venezuela, cercano, tuteo |
| `ui-styling` | **Solo web** (Next.js + Tailwind, shadcn/ui) | Componentes accesibles en las páginas públicas. No aplica a React Native |
| `slides` | Media kit, presentaciones a restaurantes y marcas | Fuera del desarrollo de la app |
| `design`, `banner-design` | Logo, íconos, banners, imágenes para redes y fichas de tienda | Fuera del desarrollo de la app. Requieren claves de IA externas (Gemini) y otras skills no instaladas; consultar antes de usarlas |

Reglas:

- Fuentes de diseño vigentes: `PRODUCT.md` (contexto), `DESIGN.md` (sistema visual «Dicho y probado») y `packages/ui/src/tokens.ts` (tokens). El verde es solo para prueba y WhatsApp.
- Si las skills se contradicen, manda este documento (rendimiento en gama baja, accesibilidad ≥ 44 px, español de Venezuela), luego `PRODUCT.md`/`DESIGN.md` y por último las recomendaciones genéricas de las skills.
- Nada de dependencias pesadas de animación o UI por sugerencia de una skill sin evaluar el impacto en el tamaño de la app.

---

## 11. Hoja de ruta de desarrollo

Cada fase debe quedar funcional y probada antes de pasar a la siguiente.

- **Fase 0 — Configuración:** monorepo (pnpm + Turborepo), apps Expo y Next.js, `packages/shared`, Supabase en la nube (`crumbz-dev`) + MCP, migración inicial, generación de tipos, ESLint/Prettier, `.env.example`.
- **Fase 1 — Auth y perfil:** login con Google y Apple, creación de perfil (username único), edición de perfil.
- **Fase 2 — Lugares:** búsqueda vía Edge Function con Google Places, creación manual (incluido solo delivery), categorías, zonas de cobertura.
- **Fase 3 — Publicar visita:** formulario completo, selección/creación de platos, compresión y subida de fotos, cola offline.
- **Fase 4 — Perfil del lugar y explorar:** página del lugar, cerca de mí (`places_nearby`), filtros por zona y categoría.
- **Fase 5 — Rankings y listas:** `top_places`, refresco con pg_cron, listas personales ordenables, "quiero ir".
- **Fase 6 — Social:** seguir, feed de seguidos, me gusta, perfiles públicos.
- **Fase 7 — Seguridad:** reportar, bloquear (y filtrar contenido bloqueado), eliminación de cuenta (Edge Function + página web).
- **Fase 8 — Web pública:** páginas de lugar, perfil y lista con metadatos Open Graph; privacidad, términos y eliminar cuenta.
- **Fase 9 — Publicación:** EAS Build, pruebas internas (TestFlight / prueba cerrada en Play), fichas de tienda.

### Fase 2 del producto (post-MVP, referencia)

Reclamar perfil de restaurante, panel web para restaurantes con estadísticas, planes y pagos manuales, promociones, destacados marcados como "Patrocinado", gamificación, comentarios, mercado de creadores, campañas de marcas, rutas y eventos.

---

## 12. Publicación en tiendas

| | Google Play | Apple App Store |
|---|---|---|
| Costo | US$25, pago único | US$99/año |
| Cuenta de empresa | Requiere D-U-N-S | Requiere D-U-N-S |
| Pruebas | Internas y cerradas | TestFlight |

- Se publicará inicialmente con **cuenta personal**. Las cuentas personales nuevas de Google Play requieren una **prueba cerrada con al menos 12 personas durante 14 días** antes de publicar.
- Las apps pueden transferirse después a la cuenta de la empresa en ambas tiendas.
- **Identificador de la app** neutral, basado en la marca (`com.getcrumbz.app`, derivado del dominio `getcrumbz.com`), nunca en el nombre personal: no se puede cambiar después de publicar. Los clientes OAuth de Google y Apple se registran con él.
- Configurar la app **solo para iPhone** (no iPad) en el MVP.

Requisitos obligatorios:

- Política de privacidad y términos publicados en la web.
- Formulario de **Seguridad de los datos** (Google) y **etiquetas de privacidad** (Apple), coherentes con los servicios usados (Supabase, PostHog, Google, Firebase).
- **Eliminación de cuenta** dentro de la app (Apple) y enlace web (Google).
- Mensajes claros y específicos al pedir permisos de ubicación, cámara y galería.
- Contenido generado por usuarios: **reportar, bloquear, moderación y contacto visible** (requisito de Apple).
- **Iniciar sesión con Apple** si se ofrece login con Google.
- Sin compras dentro de la app móvil en el MVP; los planes B2B se pagan en la web.
- Ficha: nombre, descripciones, ícono, capturas, categoría "Comida y bebida", clasificación por edad, correo y web de soporte.

Flujo con Expo: configurar identificador y permisos → EAS Build → EAS Submit → pruebas → revisión → EAS Update solo para correcciones y cambios menores (las funciones grandes pasan por revisión).

---

## 13. Aspectos legales y operativos

> Información orientativa, no asesoría legal ni contable. Consultar con un abogado o contador antes de decisiones definitivas.

- **Fase inicial como persona natural.** Constituir empresa al alcanzar un hito: primer cliente que pague, socio formal, conversación seria con marca o inversionista, o lanzamiento público.
- Beneficios de la empresa: responsabilidad limitada, facturación formal (exigida por marcas y bancos), credibilidad, entrada de socios e inversión, finanzas separadas, sin prueba obligatoria en Google Play.
- Opciones: compañía anónima (C.A.) en Venezuela; empresa en el exterior (LLC en EE. UU., Panamá, España); o estructura combinada (empresa extranjera dueña de la tecnología + empresa local que factura).
- Hacer ya: **registro de marca** ante el SAPI, dominio web y usuarios en redes.
- Usar **cuentas dedicadas al proyecto** (correo con dominio propio) para todos los servicios; crear organizaciones/equipos en Supabase, Expo y Vercel aunque haya un solo miembro. Activar verificación en dos pasos.
- Repositorio en **GitHub personal, privado**, por ahora. Se podrá transferir a una organización de GitHub conservando el historial; luego reconectar integraciones (Vercel, Expo, Actions).
- Si se suman colaboradores o socios, dejar por escrito qué aporta y qué recibe cada uno.
- Llevar registro de gastos e ingresos desde el inicio.

---

## 14. Notas y supuestos

- El conocimiento de mercado (apps, empresas, condiciones de tiendas y regulaciones) refleja información disponible hasta mediados de 2026. Verificar precios, términos de Google Places, directrices de las tiendas y restricciones de proveedores antes de comprometerse.
- Todos los precios de planes son **hipótesis** a validar con entrevistas.
- Este documento debe actualizarse cuando cambien decisiones de producto o arquitectura.
