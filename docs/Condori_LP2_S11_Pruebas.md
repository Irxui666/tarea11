# Condori - LP2 - Sesión 11

## Implementación

Rama: `feature/seguridad-frontend-condori`.
Login fuera del layout, sesión en signal y sessionStorage, expiración automática,
interceptores, guards de sesión y permisos, menú y acciones reactivas.
Clientes y Reportes conservan sus funcionalidades con permisos del backend.
Reto 02: página `/mi-cuenta` y aviso durante el último minuto de sesión.
Mi cuenta muestra los datos de la sesión; no realiza edición de usuarios.

## Validación realizada el 23/10/2026

- Compilación de producción: correcta.
- Suite completa: 17 archivos, 64 pruebas correctas (incluye las 24 de seguridad).
- Suite específica `src/app/core/auth/seguridad.spec.ts`: 24 pruebas correctas.
- La primera ejecución general falló al leer temporales del entorno restringido;
  la ejecución fuera de esa restricción pasó.
- Backend: se intentó iniciar `tarea05` con `mvnw.cmd spring-boot:run`.
  No inició: Oracle devolvió ORA-12541, sin listener en localhost:1522.
- No se modificaron fuentes ni configuración del backend.

Las pruebas unitarias usan HttpTestingController. No sustituyen las capturas
integradas con los usuarios y el token real del backend.

## Matriz de evidencias del paso 11

Estado integrado: pendiente de iniciar Oracle y el backend. No se atribuyen
capturas ni resultados reales a casos que aún no se ejecutaron.

| N.º | Acción | Resultado esperado | Evidencia pendiente |
| --- | --- | --- | --- |
| 1 | Sin sesión, abrir /ventas | Login con returnUrl=/ventas | 01-ruta-sin-sesion.png |
| 2 | Enviar login vacío | Dos validaciones y ninguna petición | 02-login-vacio.png |
| 3 | admin con clave incorrecta | Mensaje genérico 401, permanece en login | 03-clave-incorrecta.png |
| 4 | inactivo / Inactivo2026* | Mismo mensaje genérico | 04-inactivo.png |
| 5 | vendedor / Vendedor2026* | Vuelve a Ventas; nombre, rol y vencimiento | 05-vendedor.png |
| 6 | Revisar GET de Productos y POST de login en Red | Bearer en Productos; sin Bearer en login | 06-authorization.png |
| 7 | Revisar sessionStorage | pharmasoft.sesion con token, expiraEn y permisos | 07-session-storage.png |
| 8 | F5 en Productos | Mantiene sesión y página | 08-recarga.png |
| 9 | Productos como vendedor | Sin crear ni columna de acciones | 09-solo-lectura.png |
| 10 | Vendedor abre /productos/nuevo | Acceso denegado | 10-escritura-denegada.png |
| 11 | Abrir /login autenticado | Redirige a /inicio | 11-invitado-guard.png |
| 12 | Cerrar sesión | Login y almacenamiento eliminado | 12-cerrar-sesion.png |
| 13 | almacen / Almacen2026*, abrir /ventas | Sin menú Ventas y URL denegada | 13-almacen.png |
| 14 | supervisor / Supervisor2026* | Ventas y edición de catálogo | 14-supervisor.png |
| 15 | Manipular token guardado y F5 | 401, login con aviso de expiración | 15-token-manipulado.png |
| 16 | Expiración temporal del backend a 1 minuto | Aviso, cierre y regreso a la página tras login | 16-expiracion.png |

Para el caso 16 restaurar la expiración a 60 minutos al terminar.
Agregar también evidencia de `/mi-cuenta` y del aviso previo como Reto 02.
El PDF final debe llamarse `Condori_LP2_S11_Practica.pdf` y contener las capturas
reales. No se ha generado un PDF vacío ni simulado.

## Ejecución

1. Iniciar Oracle en el puerto configurado (1522, servicio freepdb1).
2. En `tarea05`: `mvnw.cmd spring-boot:run`.
3. En el frontend: `npm start` y abrir http://localhost:4200.
4. Pruebas de seguridad: `npm test -- --watch=false --include=src/app/core/auth/seguridad.spec.ts`.
5. Compilación: `npm run build`.

## Control de versiones

Los cambios previos de la sesión 9 se conservaron sin incorporarlos a los commits
de seguridad. La rama nació del checkout existente `feature/ventas-condori`,
que tenía trabajo sin guardar; no se cambió a develop para evitar interferir con él.
En app.routes.ts y menu.ts se versionaron únicamente los cambios de seguridad,
manteniendo las modificaciones previas de Reportes en el directorio de trabajo.
Antes de publicar la entrega completa, integrar el trabajo previo y comprobar
la comparación con develop. Push y solicitud de incorporación siguen pendientes.

