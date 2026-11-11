# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

Una sola identidad de crumbz en Android y iPhone (decisión del fundador, 2026-10-25): estructura e interacción según Material 3, con la marca expresada a través de su theming. En iPhone se respetan las garantías del sistema: safe area, edge-swipe back, Reduce Motion, objetivos táctiles de 44 pt. La web pública (`apps/web`, Next.js) es otra superficie con plataforma `web`. Este archivo es el contexto compartido de ambas apps.

## Users

- **Comensales en Venezuela**, empezando por Caracas (Las Mercedes, Altamira, Chacao). Buscan dónde comer y hoy resuelven lo práctico por DM: precio en dólares, métodos de pago, estacionamiento, planta eléctrica, si hay delivery a su zona. Usan Instagram, TikTok y WhatsApp a diario.
- **Foodies y creadores** que ya tienen audiencia en Instagram/TikTok. Publican visitas, arman rankings y traen a su comunidad.
- **Emprendimientos sin local** (solo delivery o pick-up), para quienes el perfil en crumbz es su "local".
- Fase 2 (fuera del MVP): dueños de restaurantes que reclaman su perfil, marcas y bancos que patrocinan.

## Product Purpose

Red social de comida enfocada en Venezuela. Los usuarios marcan los lugares que visitaron (incluidos emprendimientos sin local) y publican visitas con fotos, puntuación del 1 al 10, platos probados con "recomendado", gasto por persona en USD y modalidad. También arman rankings personales y descubren qué comer siguiendo a otras personas y explorando rankings por ciudad, zona y categoría.

Éxito en la fase 1: densidad de contenido útil en pocas zonas de Caracas, de modo que buscar en crumbz sea más rápido que preguntar por DM.

## Positioning

- Ordena el descubrimiento que hoy ocurre disperso en Instagram, TikTok y WhatsApp.
- Muestra la **información práctica local** que nadie más estructura: precios en USD, métodos de pago venezolanos (efectivo en divisas o bolívares, Pago Móvil, punto, Zelle, Binance, transferencia), planta eléctrica, estacionamiento y zonas de delivery.
- Incluye **emprendimientos sin local** como ciudadanos de primera clase.
- Referente más cercano: Beli (EE. UU.), sin presencia en Venezuela.
- Se integra con Instagram, TikTok y WhatsApp (compartir hacia ellas), no compite de frente.

## Operating Context

- Teléfonos Android de gama baja, poco almacenamiento, datos móviles caros.
- Conexión lenta o intermitente y cortes de luz. Una reseña nunca se pierde: queda en cola local y se publica al volver la conexión.
- Todo lugar, lista y perfil tiene un enlace web con buena vista previa para compartir por WhatsApp.
- Economía dolarizada: precios siempre en USD con formato `$12,50`; fechas en hora de Caracas.
- Login con Google y Apple (el SMS es poco confiable).

## Capabilities and Constraints

- MVP: perfil, buscar o crear lugar (Google Places o manual para solo delivery), publicar visita, perfil del lugar, explorar (cerca, zona, categoría), rankings por ciudad y categoría (promedio bayesiano), listas y "quiero ir", seguir, feed y me gusta, reportar, bloquear y eliminar cuenta, páginas web públicas.
- Fuera del MVP: panel de restaurantes, promociones, comentarios, mensajería, pedidos y reservas, gamificación.
- Terminología: **visita** (no "reseña" ni "post") es la acción central; **lugar** cubre restaurantes y emprendimientos; **quiero ir** para guardados.
- Stack: Expo (React Native) y Next.js en un monorepo; Supabase. Tokens de diseño compartidos entre móvil y web.
- Rendimiento: listas virtualizadas, miniaturas en el feed, imágenes comprimidas en el dispositivo, nada de dependencias pesadas.
- Pendiente de decidir: logo e identidad visual (se crean en la fase 0.5).

## Brand Commitments

- Nombre: **crumbz**, en minúsculas. Dominio `getcrumbz.com`.
- Voz: español de Venezuela, cercano y natural, con tuteo.
- Confianza ante todo: las reseñas y rankings nunca se venden, ocultan ni alteran. Todo contenido pagado se marca claramente como "Patrocinado".
- No hay logo, colores ni tipografía previos.

## Evidence on Hand

- No hay usuarios, testimonios, métricas, casos ni prensa todavía (fase de validación). No inventar ninguno.
- Datos reales sembrados: Caracas, 5 zonas y 11 categorías (hamburguesas, pizza, sushi, arepas, café, postres, parrilla, comida venezolana, pollo, tacos, desayunos).
- Las fotos de comida serán de los usuarios: calidad, encuadre y luz variables.

## Product Principles

1. **Lo práctico primero.** Cuánto cuesta, cómo se paga, si hay luz y estacionamiento, si llega a mi zona: visible sin tener que preguntar.
2. **La confianza no se compra.** Nada pagado altera rankings ni reseñas; lo patrocinado siempre se ve como tal.
3. **Funciona en la Venezuela real.** Teléfono modesto, datos caros, conexión que se cae: la app sigue siendo rápida y nunca pierde lo que escribiste.
4. **Publicar una visita es el centro.** Todo lo demás (rankings, listas, descubrimiento) se alimenta de esa acción, así que debe ser rápida y agradable.
5. **Hecho para compartirse.** Cada lugar, lista y perfil tiene que verse bien al compartirlo por WhatsApp, Instagram o TikTok.

## Accessibility & Inclusion

- Objetivos táctiles de al menos 48 dp en Android y 44 pt en iOS; etiquetas en botones de solo ícono; contraste adecuado.
- El texto sigue el tamaño de fuente del sistema (sp / Dynamic Type).
- Uso frecuente en exteriores, con sol: el contraste debe aguantar pantallas de bajo brillo.
