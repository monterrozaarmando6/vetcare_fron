# Frontend VetCare

Frontend estático, responsive y sin dependencias, integrado con la API Java incluida en `../backend-veterinaria-java`.

## Conexión local

1. Inicie el backend en el puerto `8080`.
2. Mantenga en `config.js` la URL `http://localhost:8080/api`.
3. Publique esta carpeta con un servidor estático. Por ejemplo, desde esta carpeta:

```powershell
python -m http.server 5173
```

4. Abra `http://localhost:5173`.

El usuario se crea desde `POST /api/auth/register`, como se describe en el README del backend. El inicio de sesión y todas las operaciones posteriores utilizan rutas reales de la API; no hay datos simulados.

## Configuración en la nube

Antes de publicar el frontend, cambie el valor de `API_BASE_URL` en `config.js` por la URL pública del backend, por ejemplo:

```js
window.APP_CONFIG = { API_BASE_URL: "https://vetcare-api.onrender.com/api" };
```

Configure en el backend la variable `CORS_ORIGIN` con la URL exacta del frontend. Ejemplo:

```text
CORS_ORIGIN=https://vetcare.pages.dev
```

## Funcionalidades implementadas

- Inicio de sesión y recuperación de contraseña mediante la API.
- Gestión de sesión con token enviado en `Authorization: Bearer`.
- Navegación condicionada por el rol recibido del backend.
- Dashboard con indicadores consultados en `/reports/dashboard`.
- Listado, creación y eliminación autorizada de todos los recursos disponibles.
- Búsqueda local sobre los resultados reales de la API.
- Estados de carga, errores de servidor, confirmaciones y notificaciones.
- Tema claro/oscuro, navegación móvil y preferencias de movimiento reducido.

## Endpoints integrados

- `GET /health`
- `POST /auth/login`
- `POST /auth/recover`
- `GET /reports/dashboard`
- CRUD de `owners`, `pets`, `appointments`, `consultations`, `vaccines`, `treatments`, `allergies`, `medications`, `inventory`, `services`, `payments`, `invoices`, `notifications`, `hospitalizations` y `users`.

## Pendientes de una evolución del backend

- Carga de fotografías y documentos.
- Filtros, paginación y calendario especializados en servidor.
- Restablecimiento real de contraseñas por correo.
- Exportación de reportes y descarga de facturas.
- Base de datos relacional gestionada para producción.
