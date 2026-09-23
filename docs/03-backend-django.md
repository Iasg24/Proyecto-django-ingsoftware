# 03 — El backend (Django): cada pieza explicada

Esta es la visita guiada al `backend/`. Leerás cada archivo con lo que
hace y, más importante, **por qué** lo hace.

---

## 1. El árbol del backend

```
backend/
├── manage.py          El "control remoto" de Django (migrate, runserver...)
├── requirements.txt   La lista de dependencias (lo que instalamos con pip)
├── database.py        ⭐ El puente con MongoDB (pymongo)
├── config/            La configuración central
│   ├── settings.py    ⭐ Centro de mando: apps, base de datos, CORS, hora
│   └── urls.py        ⭐ El mapa maestro de rutas
├── authapp/           La app de autenticación
│   ├── helpers.py     ⭐ Tokens, roles, hashing de contraseñas
│   ├── views.py       Login, logout, "quién soy"
│   └── urls.py        El mapa de rutas de authapp
├── ventas/            La app del negocio
│   ├── calculos.py    ⭐ El cálculo del IVA (regla de oro del negocio)
│   ├── views.py       Día, ventas, vista previa, reportes
│   └── urls.py        El mapa de rutas de ventas
├── scripts/seed.py    Crea los usuarios de prueba
└── venv/              El entorno virtual (NO se versiona)
```

---

## 2. `database.py` — el puente con MongoDB

```python
from pymongo import MongoClient
from django.conf import settings

_cliente = MongoClient(settings.MONGO_URI)   # conexión a localhost:27017
_base = _cliente[settings.MONGO_DB_NAME]     # la base "tienda_repuestos"

def db():            # las apps usan esto para leer/escribir
    return _base
```

Es el único archivo que sabe cómo conectarse. Las apps solo llaman
`db().ventas.insert_one(...)` o `db().usuarios.find_one(...)`. Si
mañana la base se mueve a la nube, cambiamos UNA línea en settings.

---

## 3. `authapp/helpers.py` — seguridad: contraseñas y tokens

### Contraseñas NUNCA en texto plano

```python
make_password(password)   # 'vendedor123' -> 'pbkdf2_sha256$...' (hash ilegible)
check_password(password, hash_guardado)   # compara sin revelar nada
```

Un **hash** es una función de un solo sentido: puedes convertir
"vendedor123" en un texto ilegible, pero no al revés. Si alguien roba
la base de datos, no puede leer las contraseñas. Esto es la regla #1
de seguridad web y verás que en Mongo el campo se llama `password_hash`.

### El token: tu carnet digital

```
login exitoso
   │
   ▼
generar_token(user) → uuid4() → "3f2a9c1b-8d7e-4f5a-9b2c-1d0e2f3a4b5c"
   │
   ├─► se guarda en la colección "tokens" (junto al usuario)
   └─► se entrega al frontend
```

Cada petición posterior llega con `Authorization: Token 3f2a9c1b-...`
y `usuario_actual(request)` busca a qué usuario pertenece.

### El decorador de roles: la puerta con llave

```python
@api_view(['POST'])
@requiere_rol('jefe')          # <-- LA PUERTA
def abrir_dia(request, user):
    ...
```

`requiere_rol` es un **decorador**: una función que envuelve a otra
para agregarle comportamiento. Piensa en él como un guardia en la
puerta de una discoteca: revisa tu token (que exista) y tu rol (que
seas el permitido) antes de dejarte entrar. Si el rol no calza,
responde 403 sin ejecutar la función.

> ⚠️ Lección importante: la protección **también** va en el servidor.
> El frontend oculta botones, pero el backend es quien de verdad
> impide la acción. Un vendedor astuto podría modificar el JavaScript
> de su navegador para ver el botón "Abrir día", pero el backend lo
> frenaría con 403. **Toda regla de negocio crítica vive en el servidor.**

---

## 4. `ventas/calculos.py` — la regla de oro del negocio

```python
TASA_IVA = Decimal('0.19')

def calcular_venta(cantidad, precio_unitario):
    neto  = cantidad * precio_unitario
    iva   = neto * 0.19
    total = neto + iva
    return {'neto': ..., 'iva': ..., 'total': ...}
```

Tres decisiones de senior aquí:

1. **`Decimal`, no `float`**: los números de coma flotante tienen
   errores de redondeo (`0.1 + 0.2 == 0.30000000000000004`). Para
   dinero, usamos matemática decimal exacta. Prueba en Python:
   `0.1 + 0.2` y alucina.
2. **Redondeo explícito** a 2 decimales (centavos).
3. **Un solo lugar donde se calcula**: tanto la vista previa como la
   venta real llaman a la MISMA función. Imposible que difieran.

---

## 5. `ventas/views.py` — los tres módulos del enunciado

### 5.1 Control del día (módulo 4)

```python
db().dia.update_one(
    {'fecha': fecha},
    {'$set': {'estado': 'abierto', ...}},
    upsert=True,
)
```

- `update_one` = "busca y actualiza". `upsert=True` = "si no existe, créalo".
- El estado del día es **un documento por fecha**: `{fecha: "2026-08-17",
  estado: "abierto"}`. La fecha es la llave.
- Si no hay documento para hoy → el día está **cerrado** (estado por
  defecto). El jefe debe abrirlo explícitamente.

### 5.2 Registrar venta (módulo 2) — el orden de las validaciones

```
crear_venta()
 │
 ├─ 1. ¿Día abierto?  ──► 403 si está cerrado   (requisito 4.2)
 ├─ 2. ¿Campos presentes?  (código, nombre, cantidad, precio)
 ├─ 3. ¿Factura?  →  ¿RUT, razón social, giro, dirección?  (requisito 2.4)
 ├─ 4. CALCULAR con calcular_venta()  (el servidor recalcula SIEMPRE)
 ├─ 5. siguiente_folio()  →  B-0003 / F-0001  (contador en MongoDB)
 └─ 6. insert_one() en "ventas"  →  guardado en la base
```

Observa el paso 4: el servidor **ignora** los totales que mande el
frontend y los recalcula. Si alguien intentara mandar "total: 1", el
sistema lo ignora y cobra lo correcto.

### 5.3 Vista previa (módulo 3)

```python
@api_view(['POST'])
def vista_previa(request, user):
    ...
    calculos = calcular_venta(cantidad, precio)   # misma función
    return Response({'vista_previa': {...}})      # NO guarda nada
```

Cero escrituras en la base: solo calcula y devuelve. El vendedor
revisa el documento "impreso" y solo al confirmar se llama a
`crear_venta()`.

### 5.4 Reporte diario (módulo 5)

```python
ventas = list(db().ventas.find({'fecha': fecha}))
resumen = _resumen_ventas(ventas)          # boletas/facturas, neto/IVA/total
desglose = _desglose_por_vendedor(ventas)  # por cada vendedor
```

- Se lee de la base (requisito 5.5: nada de datos inventados).
- `_resumen_ventas` cuenta y suma con comprensiones de listas.
- `_desglose_por_vendedor` agrupa con un diccionario `usuario → datos`.
- La fecha llega como parámetro: `/api/ventas/reporte/diario?fecha=2026-08-17`.

---

## 6. `config/settings.py` — lo que configuramos y por qué

| Configuración | Valor | ¿Por qué? |
|---|---|---|
| `INSTALLED_APPS` | `rest_framework`, `corsheaders`, `authapp`, `ventas` | Cada pieza debe declararse |
| `MONGO_URI` | `mongodb://localhost:27017/` | Dónde está la base |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | El frontend puede llamarnos |
| `TIME_ZONE` | `America/Santiago` | "Hoy" es hoy en Chile |
| `DATABASES` | SQLite (de sistema) | Django lo pide; nosotros usamos Mongo |
| `DEBUG` | `True` | Muestra errores detallados (solo desarrollo) |

---

## 7. Autoprueba: responde estas preguntas

1. ¿Qué pasa si un vendedor llama a `POST /api/ventas/dia/abrir`?
   → 403: el decorador `requiere_rol('jefe')` lo detiene.
2. ¿Dónde se guarda la venta ANTES de que el usuario la confirme?
   → En ninguna parte: la vista previa no escribe en la base.
3. ¿Por qué la vista previa y la venta guardada muestran los mismos montos?
   → Ambas usan `calcular_venta()` (un solo lugar, cero desvíos).
4. ¿Qué pasa si Mongo está apagado y alguien intenta vender?
   → Django falla con un error 500. Por eso el script `todo.sh`
     enciende Mongo PRIMERO.

Ahora veamos el otro lado: [04-frontend-react.md](04-frontend-react.md).
