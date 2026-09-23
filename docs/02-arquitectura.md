# 02 — Arquitectura: cómo se conectan las piezas

Este es el mapa completo de nuestro sistema. Léelo con calma y vuelve
a él cada vez que te pierdas.

---

## 1. El mapa general

```
                          TU COMPUTADORA (modo desarrollo)
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  PUERTO 5173                      PUERTO 8000      PUERTO 27017  │
│  ┌──────────────┐                 ┌─────────────┐   ┌─────────┐ │
│  │   FRONTEND   │                 │   BACKEND   │   │  MONGO  │ │
│  │   React      │                 │   Django    │   │    DB    │ │
│  │   (Vite)     │                 │             │   │         │ │
│  │              │    /api/...     │             │   │         │ │
│  │  Tu navegador│ ───────────────►│  URLs →     │   │         │ │
│  │  abre:       │    (proxy)      │  Vistas     │   │         │ │
│  │  localhost:  │ ◄───────────────│  JSON       │◄─►│ ventas  │ │
│  │  5173        │                 │             │   │ usuarios│ │
│  │              │                 │             │   │ tokens  │ │
│  └──────────────┘                 └─────────────┘   │ dia     │ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Los roles de cada pieza

| Pieza | Tecnología | Puerto | ¿Qué hace? |
|---|---|---|---|
| **Frontend** | React + Vite | 5173 | La cara del sistema. Dibuja pantallas y manda peticiones al backend |
| **Backend** | Django + DRF | 8000 | El cerebro. Valida, calcula el IVA, controla permisos, genera reportes |
| **MongoDB** | MongoDB 8 | 27017 | La memoria. Guarda usuarios, ventas, tokens y el estado del día |

### El flujo en 5 pasos (cuando el vendedor hace clic en "Guardar venta")

```
1. NAVEGADOR:   el vendedor llena el formulario y hace clic.
                JavaScript (api.js) arma la petición JSON.

2. VITE:        recibe /api/ventas/ en el puerto 5173 y la reenvía
                (proxy) a Django en el 8000.

3. DJANGO:      config/urls.py ve "/api/ventas/" y delega a
                ventas/urls.py, que llama a la vista crear_venta().
                La vista valida los datos, recalcula el IVA y verifica
                que el día esté abierto.

4. MONGO:       Django guarda el documento de la venta en la
                colección "ventas" mediante database.py.

5. NAVEGADOR:   Django responde con JSON ("venta guardada, folio B-0003").
                El proxy la devuelve y React muestra "¡Venta registrada!".
```

> 💡 Lo más importante de este viaje: los datos **solo** viajan como
> JSON y solo se guardan en MongoDB. El navegador es un simple mensajero
> con buena memoria visual.

---

## 2. Por qué separamos frontend y backend (arquitectura en capas)

Separar el sistema en capas tiene 3 ventajas enormes:

1. **Roles de especialistas**: un diseñador puede trabajar solo en el
   frontend sin tocar las matemáticas del IVA; un programador puede
   arreglar la lógica del backend sin romper el diseño.

2. **Reutilización**: la misma API REST sirve para esta web, para una
   app de celular del vendedor y hasta para la tienda en línea. El
   backend no sabe (ni le importa) quién lo usa.

3. **Seguridad**: la lógica crítica vive en el servidor, donde el
   usuario NO puede tocarla. Si el cálculo del IVA viviera en el
   navegador, cualquiera podría cambiarlo con las herramientas de
   desarrollador (F12).

---

## 3. Cómo sabe Django dónde está todo (el enrutamiento)

Todo pedido que llega al backend pasa por una cadena de "mapas":

```
Petición:  POST http://localhost:8000/api/ventas/

config/urls.py (el mapa maestro)
│  path('api/auth/',   include('authapp.urls'))   <- peticiones de login
│  path('api/ventas/', include('ventas.urls'))    <- peticiones de ventas ✔
│
└──► ventas/urls.py (el mapa de ventas)
     │  path('',                  crear_venta)
     │  path('vista-previa',      vista_previa)
     │  path('dia',               consultar_dia)
     │  path('dia/abrir',         abrir_dia)
     │  path('dia/cerrar',        cerrar_dia)
     │  path('reporte/diario',    reporte_diario)  ✔ "se encontró la ruta"
     │
     └──► llama a la vista (función Python) con la petición
```

En Django, cada "app" (carpeta) tiene responsabilidad única:

| App | Responsabilidad | Archivos clave |
|---|---|---|
| `authapp` | Quién puede entrar y qué puede hacer | `helpers.py` (tokens, roles), `views.py` (login/logout/me) |
| `ventas` | El negocio: ventas, día, reportes | `views.py`, `calculos.py` (IVA) |

Y `database.py` es el puente compartido que ambas apps usan para
hablar con MongoDB.

---

## 4. El "bucle" de datos del sistema (cómo circula la información)

```
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │   USUARIO                                          │
  │   (escribe, hace clic)                             │
  │        │                                           │
  │        ▼                                           │
  │   REACT (frontend)  estado en JSX                  │
  │        │  fetch()                                  │
  │        ▼                                           │
  │   JSON sobre HTTP  ─────────────────────────────┐  │
  │                                                │  │
  │   DJANGO (backend)                             │  │
  │   1. Autentica (token)                         │  │
  │   2. Valida datos                              │  │
  │   3. Calcula IVA / totales                     │  │
  │   4. Lee/escribe en MongoDB                    │  │
  │        │                                       │  │
  │        ▼                                       │  │
  │   MONGO (base de datos)  ◄─────────────────────┘  │
  │        │                                          │
  │        ▼                                          │
  │   Respuesta JSON al frontend                      │
  │        │                                          │
  │        ▼                                          │
  │   REACT actualiza la pantalla                     │
  └────────────────────────────────────────────────────┘
```

Todo lo que el usuario ve en pantalla es, al final, **JSON que el
backend le entregó**. Cuando no hay petición pendiente, la pantalla
es solo "cáscara" esperando datos.

---

## 5. ¿Por qué tres puertos? (y qué son los puertos)

Una computadora puede correr muchos programas a la vez. Cada programa
en red usa un **puerto**: un número que identifica "la puerta" por la
que escucha.

| Puerto | Programa | Analogía |
|---|---|---|
| 27017 | MongoDB | El sótano del edificio donde está el archivo |
| 8000 | Django | La oficina del personal que hace los trámites |
| 5173 | Vite/React | La vitrina donde te atienden |

Cuando en desarrollo todo vive en tu misma PC, los puertos son lo que
permite que los tres "se hablen" sin pisarse. En producción (documento
08) todo se sube a servidores en la nube, pero la lógica de puertos y
la comunicación es exactamente la misma.

---

## 6. ¿Y el proxy? (el puente del frontend)

Como viste en el diagrama, el navegador NO habla directo con Django:
habla con Vite (5173), y Vite reenvía a Django (8000). Esto es el
**proxy de desarrollo** (configurado en `frontend/vite.config.js`).

¿Por qué? Por la regla de seguridad **CORS**: el navegador bloquea
peticiones entre "orígenes" distintos (otro puerto cuenta como otro
origen). El proxy hace creer al navegador que todo viene del mismo
lugar. En producción, frontend y backend suelen quedar bajo el mismo
dominio y el problema desaparece.

> En el backend también configuramos CORS (`settings.py`) por si
> algún día el frontend se sirve desde otro dominio. Las dos
> configuraciones son "cinturón y tirantes".

Sigue con el detalle de cada capa: [03-backend-django.md](03-backend-django.md).
