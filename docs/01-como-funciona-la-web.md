# 01 — ¿Cómo funciona la web? (El ABC de todo sistema web)

Antes de mirar el código de este proyecto, necesitas entender el modelo
fundamental sobre el que se construye TODO internet. Esto no es teoría
aburrida: es la base de lo que verás en cada archivo del proyecto.

---

## 1. El modelo Cliente-Servidor

Un sistema web tiene **dos partes** que se comunican a través de la red:

```
┌──────────────────┐        HTTP        ┌──────────────────┐
│   CLIENTE        │  ────────────────► │   SERVIDOR       │
│   (navegador)    │                    │   (Django)       │
│                  │  ◄──────────────── │                  │
│  Muestra cosas   │       respuesta    │  Hace la lógica  │
│  con HTML/CSS/JS │                    │  y guarda datos  │
└──────────────────┘                    └──────────────────┘
```

| | Cliente | Servidor |
|---|---|---|
| **¿Qué es?** | Tu navegador (Chrome, Firefox) | Una computadora en internet (o tu PC, en desarrollo) |
| **¿Qué hace?** | Muestra la interfaz, recoge lo que el usuario escribe, pinta los resultados | Ejecuta la lógica de negocio: valida, calcula, guarda en la base de datos |
| **En este proyecto** | React (frontend, puerto 5173) | Django (backend, puerto 8000) |
| **¿Cuántos hay?** | Muchísimos (todos los vendedores del bazar) | Uno solo (el sistema central) |

**Regla de oro:** el cliente NUNCA guarda datos importantes. Solo muestra.
Todo lo valioso (ventas, dinero, usuarios) vive en el servidor y su base
de datos.

---

## 2. HTTP: el idioma de la comunicación

Cuando el navegador y el servidor hablan, lo hacen en **HTTP**
(HyperText Transfer Protocol). Una conversación HTTP es una **petición**
seguida de una **respuesta**:

### La petición (lo que manda el cliente)

```
POST /api/auth/login HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Token 3f2a9c1b-...

{"usuario": "vendedor", "password": "vendedor123"}
```

- **POST** = el "verbo" (qué quieres hacer)
- **/api/auth/login** = la "dirección" (a quién se lo pides)
- **Cabeceras** = información adicional (qué tipo de contenido, tu token de sesión)
- **Cuerpo** = los datos (en JSON)

### Los verbos HTTP (los usas todos los días sin darte cuenta)

| Verbo | Significado | Ejemplo en este proyecto |
|---|---|---|
| `GET` | "Dame información" | Consultar el reporte diario |
| `POST` | "Crea algo nuevo" | Iniciar sesión, registrar una venta |
| `PUT` / `PATCH` | "Actualiza algo" | Abrir/cerrar el día |
| `DELETE` | "Borra algo" | (no usado) |

### Los códigos de respuesta (el "estado de ánimo" del servidor)

| Código | Significado | Ejemplo |
|---|---|---|
| `200` | ¡Todo OK! | Login exitoso |
| `201` | ¡Creado! | Venta guardada |
| `400` | Pediste mal las cosas | Faltan datos de la factura |
| `401` | No estás autenticado | Sin token, o token inválido |
| `403` | Autenticado pero sin permiso | Un vendedor abre el día |
| `404` | La ruta no existe | URL mal escrita |
| `500` | Error interno del servidor | Bug en el código |

> 💡 **Ejercicio**: en la consola del navegador (F12 → pestaña Network),
> abre la aplicación, inicia sesión y mira las peticiones. Vas a VER
> cada `POST /api/auth/login` con su código 200 y su respuesta JSON.

---

## 3. JSON: el formato de los datos

Los datos viajan entre cliente y servidor en **JSON** (JavaScript Object
Notation). Es un formato de texto que cualquier lenguaje entiende:

```json
{
  "token": "3f2a9c1b-8d7e-4f5a-9b2c-1d0e2f3a4b5c",
  "rol": "vendedor",
  "rol_nombre": "Vendedor",
  "nombre": "Camila Rojas Pérez"
}
```

Fíjate que JSON es literalmente un diccionario de Python o un objeto de
JavaScript escrito en texto. Por eso la comunicación es tan simple:

- JavaScript (frontend) escribe `JSON.stringify(objeto)` → texto
- Python (backend) recibe el texto → `json.loads()` → diccionario
- Y al revés para las respuestas.

**Ejercicio:** haz `python3 -c "import json; print(json.loads('{\"a\": 1}'))"`
y mira cómo Python lee JSON sin esfuerzo.

---

## 4. APIs REST: la organización de las URLs

Una **API** (Application Programming Interface) es el "menú de servicios"
que un servidor ofrece a los clientes. **REST** es un estilo de diseño
de APIs que organiza las URLs alrededor de los **recursos** (sustantivos).

En este proyecto, nuestra API es:

```
/api/auth/login            POST   -> iniciar sesión
/api/auth/logout           POST   -> cerrar sesión
/api/auth/me               GET    -> quién soy (mi token)
/api/ventas/dia            GET    -> estado del día
/api/ventas/dia/abrir      POST   -> abrir el día (solo jefe)
/api/ventas/dia/cerrar     POST   -> cerrar el día (solo jefe)
/api/ventas/               POST   -> registrar una venta (vendedor)
/api/ventas/vista-previa   POST   -> calcular comprobante sin guardar
/api/ventas/reporte/diario GET    -> reporte del día (solo jefe)
```

Consejos para leer una URL de API:
1. La primera parte `/api/` es el "distrito" de nuestra API.
2. Después viene el recurso: `/ventas/` o `/auth/`.
3. La última parte es la acción concreta: `/login`, `/abrir`, `/reporte/diario`.

Las URLs describen QUÉ, los verbos describen QUÉ HACER.

---

## 5. ¿Qué significa que la web sea "stateless" (sin estado)?

HTTP es sin memoria: el servidor no recuerda entre petición y petición
quién eres. "Hola" ... "¿quién?" ... "Soy yo, el mismo de antes".

Por eso existe el **token de sesión** (lo verás en el documento 03):
tú te identificas UNA vez con tu usuario y contraseña, y el servidor
te entrega un token. De ahí en adelante, mandas ese token en cada
petición como tu identificación:

```
Authorization: Token 3f2a9c1b-...
```

El servidor lo revisa, sabe quién eres (y qué rol tienes) y te responde.
Cierra la sesión → el token se borra → tu identificación ya no sirve.

---

## Resumen en una frase

> El navegador (cliente) manda peticiones HTTP a Django (servidor),
> Django valida y calcula, guarda en MongoDB, y responde con JSON;
> el navegador pinta ese JSON como una pantalla bonita.

Ahora sí: pasemos al [02-arquitectura.md](02-arquitectura.md) para ver
cómo está organizado nuestro sistema.
