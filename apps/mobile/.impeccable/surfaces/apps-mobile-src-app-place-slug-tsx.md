---
version: 1
slug: "apps-mobile-src-app-place-slug-tsx"
primary_target: "apps/mobile/src/app/place/[slug].tsx"
related_targets: []
---

# Perfil del lugar (app móvil)

## Scope
- Surface: perfil de un lugar en la app móvil (`apps/mobile/src/app/place/[slug].tsx`). Ancla del mundo visual de crumbz: sus tokens se aplican a todas las pantallas y a la web.
- Mode: Operate. El visitante decide si ir, pedir o guardar el lugar.
- Audience/job: comensal en Caracas que quiere saber, sin preguntar por DM, cuánto cuesta, cómo se paga, si hay planta y estacionamiento, si llega a su zona y si el puntaje es de fiar.
- Success: confía en el puntaje y le dan ganas de publicar su visita.
- Must not feel like: app de delivery (vitrinas, promos, urgencia), algo frío o corporativo, ni la UX genérica de redes sociales.
- Content: datos de ejemplo («Smash Club», sintéticos) hasta la fase 4; luego datos reales de Supabase.

## Direction contract

THESIS: Nada se afirma sin prueba. Cada dato del lugar (puntaje, gasto, planta, pagos) va pegado a la evidencia de visitas reales que lo respalda. Rechaza la ficha de estrellas + chips + carrusel que entrega toda la categoría.

OWN-WORLD: Escala neutra cálida fina (piedra: #FAFAF9 → #1C1917) con un solo acento verde (#1F7A4D) reservado para la prueba: cuentas de personas, confirmaciones y la acción de WhatsApp. Manrope en dos pesos (500/800), cifras tabulares. Superficies planas con radios suaves; filetes de 1 px en vez de tarjetas; sin sombras decorativas. Fotos de usuarios en placas fijas 4:5. Raised (orientación): colores fijos para el terreno (modalidad, estado) y uno reservado solo para lo activo. Raised (folio botánico): placas de foto con proporción y encuadre fijos para comparar visitas.

STORY: El visitante ve el nombre y su puesto en el ranking, entiende de inmediato de dónde sale el 8,6 (47 personas, distribución, solo la última visita de cada una), recorre los datos prácticos con su prueba y escribe por WhatsApp o publica su visita.

FIRST VIEWPORT: Top app bar (volver, quiero ir, compartir). Nombre a 32 sp 800 y línea de categoría · zona · puesto. Bloque de puntaje: cifra de 52 sp a la izquierda, distribución en tres barras a la derecha y la línea de prueba en verde. Fila de 4 placas de foto 4:5. Lista de pares afirmación → prueba separados por filetes. Barra inferior fija: WhatsApp (verde, lleno) y Publicar visita (contorno).

FORM: Monochrome product marketing (dicho y probado), opción 1 de la mano atrevida, elegida por el usuario. seed:741d6d599944a46d

Signature move: el par afirmación → prueba. Toda afirmación lleva a su derecha, en verde y en cifras tabulares, cuántas visitas la respaldan; al tocarla se despliega en su sitio la evidencia (miniaturas, fechas).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
