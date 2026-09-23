# 05 — MongoDB: la base de datos del sistema

---

## 1. ¿Qué es MongoDB?

MongoDB es una base de datos **NoSQL orientada a documentos**. Olvídate
de las tablas de Excel: en MongoDB guardas **documentos JSON** en
**colecciones**.

| Concepto SQL (MySQL) | Concepto MongoDB | Analogía |
|---|---|---|
| Base de datos | Base de datos | El edificio del archivo |
| Tabla | **Colección** | La caja donde van los expedientes |
| Fila | **Documento** | Un expediente |
| Columna | Campo | Un dato del expediente |
| PRIMARY KEY | `_id` (ObjectId) | El número del expediente |

Nuestro MongoDB: `tienda_repuestos`

```
tienda_repuestos/
├── usuarios   →  cada vendedor o jefe
├── tokens     →  las sesiones activas
├── ventas     →  cada venta registrada (el corazón del sistema)
├── dia        →  el estado del día (abierto/cerrado)
└── folios     →  contadores de boletas y facturas
```

---

## 2. Ejemplo real: cómo se ve una venta guardada

Cuando el vendedor confirma una venta, `crear_venta()` guarda este
documento en la colección `ventas`:

```json
{
  "_id": "ObjectId('66a1b2c3d4e5f60718293a0b')",
  "folio": "B-0002",
  "fecha": "2026-08-17",
  "hora": "18:36:57",
  "tipo_documento": "boleta",
  "codigo_producto": "A-001",
  "producto": "Neumático 120/90-18",
  "cantidad": 3,
  "precio_unitario": 25000,
  "neto": 75000,
  "iva": 14250,
  "total": 89250,
  "cliente": null,
  "vendedor": {
    "usuario": "vendedor",
    "nombre": "Camila Rojas Pérez"
  },
  "creado_en": "2026-08-17T18:36:57.387468-04:00"
}
```

Fíjate en los detalles de diseño:

- **El documento guarda TODO junto** (el producto, los cálculos, el
  vendedor). En SQL esto exigiría varias tablas unidas con llaves
  foráneas; en Mongo, la venta es una unidad autocontenida. Por eso
  MongoDB es tan natural para esta aplicación: **los datos de la venta
  se leen de una sola vez**.
- **Los valores de dinero van calculados y guardados**. Nunca se
  vuelven a calcular "sobre la marcha": el reporte solo suma.
- **`_id` es automático** (ObjectId). MongoDB lo agrega a todo
  documento si no lo especificas. Recuerda: hay que quitarlo antes
  de devolver JSON al frontend (lo vimos en el error del backend).

---

## 3. Las operaciones que usa nuestro backend

### `insert_one` — guardar

```python
db().ventas.insert_one(venta)          # crear_venta()
db().tokens.insert_one({'token': token, 'usuario_id': ...})   # login
db().usuarios.insert_one({...})        # seed
```

### `find_one` — buscar el primero que calce

```python
db().usuarios.find_one({'usuario': usuario})          # login
db().tokens.find_one({'token': token})                # validar sesión
db().dia.find_one({'fecha': '2026-08-17'})            # estado del día
```

### `find` — buscar todos los que calcen

```python
db().ventas.find({'fecha': '2026-08-17'})   # todas las ventas del día
```

Devuelve un cursor (una lista "flojita"); lo convertimos a lista con
`list(...)`.

### `update_one` + `upsert` — actualizar o crear

```python
db().dia.update_one(
    {'fecha': '2026-08-17'},               # qué documento busco
    {'$set': {'estado': 'abierto'}},       # qué cambios aplico
    upsert=True,                           # si no existe, créalo
)
```

### `find_one_and_update` — actualizar y devolver (nuestro contador)

```python
doc = db().folios.find_one_and_update(
    {'tipo': 'boleta'},
    {'$inc': {'secuencia': 1}},   # $inc = incrementar en 1
    upsert=True,
)
```

Esta operación es **atómica**: dos vendedores vendiendo al mismo tiempo
no pueden recibir el mismo folio. (Sí, Mongo ya maneja esto por ti:
es otra ventaja frente a un contador en el código.)

---

## 4. ¿Por qué MongoDB para este proyecto?

| Ventaja | En nuestro caso |
|---|---|
| **Documentos = JSON** | Lo que guardamos es literalmente lo que el backend devuelve. Cero conversión |
| **Flexible** | Una boleta no tiene "cliente"; una factura sí. En Mongo, cada documento tiene los campos que necesita. En SQL habrías llenado columnas vacías o creado tablas extra |
| **Escalable** | El "documento venta" se replica naturalmente |
| **Rápido de empezar** | No hay que diseñar esquemas ni migraciones para empezar |

Contras honestas (ninguna tecnología es perfecta):

- **Sin joins**: si necesitas relaciones complejas, la pasas peor que
  en SQL.
- **Consistencia**: en algunas operaciones la consistencia es "eventual".
- **Para reportes complejos** (sumas por mes, análisis), SQL suele
  ser más cómodo.

Por eso en la industria es común el patrón **políglota**: SQL para el
dinero y la contabilidad, Mongo para lo operativo. Tú decidiste Mongo
para aprenderlo; el código de este proyecto te lo hace fácil.

---

## 5. Cómo inspeccionar la base de datos a mano

Dos formas:

### Opción A: desde Python (ya tienes todo)

```bash
cd backend
venv/bin/python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from database import db
for venta in db().ventas.find():
    print(venta['folio'], venta['producto'], venta['total'])
"
```

### Opción B: instalar MongoDB Compass (interfaz gráfica)

Compass es la herramienta visual oficial de MongoDB. Puedes descargarla
desde la web de MongoDB, conectar a `localhost:27017` y **ver, editar y
borrar documentos con clics**. Es la mejor forma de "sentir" la base
de datos. (Recomendadísima para el trabajo de la asignatura: saca
capturas de pantalla de tus colecciones para el informe.)

---

## 6. Autoprueba

1. ¿En qué colección se guardan los datos de una factura?
   → En `ventas`; el documento lleva `tipo_documento: "factura"` y un
     subdocumento `cliente`.
2. ¿Qué pasa si dos vendedores venden a la misma milésima de segundo?
   → `find_one_and_update` con `$inc` garantiza folios distintos
     (operación atómica).
3. ¿Cómo sabría el jefe cuántas boletas hubo el lunes pasado?
   → `reporte_diario(fecha)` hace `find({'fecha': '...'})` y cuenta
     los `tipo_documento`.
4. ¿Por qué el `_id` de Mongo da error al devolver JSON?
   → Porque `ObjectId` no es un tipo JSON estándar; por eso hacemos
     `venta.pop('_id', None)` antes de responder.

Ahora el momento de la verdad: [06-el-viaje-de-una-venta.md](06-el-viaje-de-una-venta.md).
