# 08 — De esto a producción: los siguientes pasos

Este proyecto funciona en tu PC, pero el enunciado pide un sistema
accesible desde cualquier navegador. Aquí tienes el mapa de cómo
llegar ahí — con la explicación de cada decisión.

---

## 1. ¿Qué falta entre "funciona en mi PC" y "está en producción"?

| Aspecto | En desarrollo (ahora) | En producción |
|---|---|---|
| Backend | `runserver` de Django | Un servidor WSGI robusto (Gunicorn) detrás de Nginx |
| Frontend | Vite dev server | `pnpm build` → archivos estáticos servidos por Nginx |
| Base de datos | MongoDB local | MongoDB Atlas (nube) o un servidor propio |
| Seguridad | `DEBUG=True`, claves visibles | `DEBUG=False`, `SECRET_KEY` en variables de entorno, HTTPS |
| Dominio | localhost:5173 | mibazar.cl con certificado SSL |

---

## 2. El despliegue clásico (y cómo se conecta todo)

```
                    INTERNET
                        │ HTTPS (puerto 443)
                        ▼
                   ┌──────────┐
                   │  NGINX   │  → sirve el frontend (archivos estáticos)
                   │          │  → y reenvía /api/ al backend
                   └────┬─────┘
                        │ http://localhost:8000
                        ▼
                   ┌──────────┐
                   │ GUNICORN │  → ejecuta Django (código Python)
                   └────┬─────┘
                        │ mongodb://atlas
                        ▼
                   ┌──────────┐
                   │  MongoDB │  → en la nube (Atlas, MongoDB Cloud)
                   └──────────┘
```

Puntos clave:

- **Nginx** es el "portero": atiende al público, sirve las páginas y
  deja pasar solo lo que corresponde (`/api/...`) al backend. Nuestro
  proxy de Vite era el ensayo de esto.
- **Gunicorn** es un servidor de aplicaciones que ejecuta Django como
  un servicio estable (el `runserver` de desarrollo no es apto para
  producción).
- **HTTPS** se obtiene gratis con Let's Encrypt; el puerto 443 con TLS
  reemplaza al 80/5173 de desarrollo.

---

## 3. La nube: AWS, Azure u OCI (como pide el enunciado)

Las plataformas de nube ofrecen máquinas virtuales (y servicios
gestionados). Un camino práctico para este proyecto:

| Proceso | AWS | Azure | OCI |
|---|---|---|---|
| Crear una VM Linux | EC2 (gratis 1 año) | VM de Linux | VM Compute |
| Subir el código | `git push` + `git pull` en la VM | igual | igual |
| Base de datos gestionada | DocumentDB (compatible con Mongo) | Cosmos DB | MongoDB en OCI |
| O (más simple) | **MongoDB Atlas** (cualquier nube) | | |

**El camino más corto y barato:** 1 VM pequeña (gratis en las tres
plataformas) + **MongoDB Atlas Free Tier** (500 MB gratis, 100%
compatible con MongoDB). Son dos "servidores": uno corre tu app y el
otro tu base de datos.

### Qué cambia en NUESTRO código para subir a la nube

Solo **una línea** en `backend/config/settings.py`:

```python
# MONGO_URI = 'mongodb://localhost:27017/'        # antes (local)
MONGO_URI = 'mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/'   # nube
```

Y en `frontend/vite.config.js`, el proxy desaparece (Nginx lo
reemplaza). Todo lo demás — las vistas, las validaciones, el cálculo
del IVA, los reportes — **funciona igual**, porque la comunicación es
por HTTP y JSON.

> Este es el superpoder de separar frontend y backend: el código no
> sabe (ni le importa) dónde vive cada pieza.

---

## 4. Seguridad en producción (checklist obligatoria)

- [ ] `DEBUG = False` en settings.
- [ ] `SECRET_KEY` leída de una variable de entorno, no escrita en el código.
- [ ] `ALLOWED_HOSTS = ['mibazar.cl']` (no `*`).
- [ ] HTTPS obligatorio (Let's Encrypt).
- [ ] Contraseñas siempre hasheadas (ya lo hacemos con `make_password`).
- [ ] MongoDB Atlas con acceso solo desde la IP de tu servidor.
- [ ] Backups automáticos de la base de datos.
- [ ] Nunca subir claves ni `.env` a Git (ya está en el `.gitignore`).

---

## 5. Mejoras que podrías implementar (ideas para nota)

Cada una es un mini-proyecto con el que puedes subir tu nota:

1. **Catálogo de productos**: una colección `productos` con stock, y
   que el formulario los liste en vez de escribirlos a mano.
2. **Anular ventas**: un endpoint para marcar una venta como anulada
   (con rol y motivo).
3. **Reporte semanal/mensual**: agregar `$group` de MongoDB o hacer
   la suma por rango de fechas.
4. **Imprimir / PDF del comprobante**: el botón "Imprimir" del
   navegador ya funciona con la vista previa; con `jsPDF` o el
   headless de Django puedes generar el PDF real.
5. **Tests automatizados**: Django tiene `django.test` para probar
   las vistas sin navegador (te enseñaría en la próxima sesión).
6. **Login con sesión segura**: expiración de tokens, bloqueo tras
   5 intentos fallidos, contraseñas con requisitos.

---

## 6. El mapa de conocimientos (dónde estás parado)

```
HAS APRENDIDO HOY                            LO QUE VIENE DESPUÉS
────────────────────                         ──────────────────────
Cliente vs servidor                          DevOps: Docker, CI/CD
HTTP, métodos, códigos                       Seguridad ofensiva/defensiva
APIs REST + JSON                             Testing automatizado
React: componentes, estado, contextos        Arquitectura de microservicios
Django: URLs, vistas, decoradores            Caché, colas, Redis
MongoDB: colecciones, documentos             Bases relacionales (SQL)
Git: commits, ramas, remotos                 Performance y monitoreo
```

Estás en el camino correcto. **Los fundamentos que aprendiste hoy son
los mismos que usan los sistemas más grandes del mundo.** La diferencia
con los profesionales es solo el volumen de práctica.

---

## Epílogo

Este documento, junto con el `README.md`, es tu **guía de estudio para
la asignatura**. Relee el [documento 06](06-el-viaje-de-una-venta.md)
antes de la evaluación: si puedes explicar el viaje de una venta de
memoria, entiendes el sistema completo.

Éxito en el proyecto. 🏍️
