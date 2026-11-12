# Documentación de crumbz

Guías para trabajar en el proyecto. Las reglas de negocio, el alcance del MVP y las convenciones obligatorias están en [`CLAUDE.md`](../CLAUDE.md); aquí está el "cómo".

| Guía                                        | Para qué                                                        |
| ------------------------------------------- | --------------------------------------------------------------- |
| [Primeros pasos](getting-started.md)        | Instalar, configurar variables y levantar la app móvil y la web |
| [Arquitectura](architecture.md)             | Cómo se conectan las piezas del monorepo y por qué              |
| [Stack tecnológico](tech-stack.md)          | Qué usamos, en qué versión y por qué                            |
| [Base de datos](database.md)                | Esquema, migraciones, seguridad (RLS) y tipos                   |
| [App móvil](mobile.md)                      | Expo, Expo Go, builds de desarrollo y EAS                       |
| [Inicio de sesión y perfil](auth.md)        | Google/Apple, guardas de rutas, perfil y su configuración       |
| [Lugares](places.md)                        | Buscar y crear lugares, Google Places y su configuración        |
| [Decisiones técnicas](decisions.md)         | Registro de decisiones y su motivo                              |
| [Solución de problemas](troubleshooting.md) | Errores conocidos y cómo resolverlos                            |

Diseño: el contexto de producto está en [`PRODUCT.md`](../PRODUCT.md) y el sistema visual (colores, tipografía, componentes y sus reglas) en [`DESIGN.md`](../DESIGN.md). Los tokens viven en `packages/ui`.

Mantén estas guías al día cuando cambie algo que describen. Si una guía contradice a `CLAUDE.md`, manda `CLAUDE.md` y hay que corregir la guía.
