# 07 — Git y el control de versiones

---

## 1. ¿Qué es Git y por qué lo usamos?

Git es el sistema de **control de versiones** más usado del mundo.
Imagina que editaste un archivo y lo rompiste: Git te permite volver
a cualquier versión anterior, saber QUIÉN cambió QUÉ y CUÁNDO, y
trabajar con otras personas sin pisarse.

Este proyecto ya es un repositorio Git (lo inicializamos al crear la
carpeta con `git init -b main`). Todo el historial vive en la carpeta
oculta `.git/`.

```
El ciclo de vida de un archivo en Git:

┌──────────┐   git add   ┌──────────┐   git commit   ┌───────────┐
│ trabajado │ ──────────► │ staged   │ ─────────────► │  guardado │
│ (editado) │            │ (caja)   │                │ (historia)│
└──────────┘            └──────────┘                └───────────┘
```

- **Working directory**: tus archivos tal cual en la carpeta.
- **Staging area**: la "caja" donde preparas qué se va a guardar.
- **Commit**: la fotografía oficial del estado del proyecto, con un
  mensaje que explica qué cambió.

---

## 2. Los comandos que usarás todo el tiempo

```bash
# ¿Cómo está el repositorio? (archivos modificados, pendientes, rama)
git status

# Agregar archivos a la caja (staging)
git add .                     # todos
git add backend/ventas/       # solo una carpeta
git add backend/ventas/views.py   # solo un archivo

# Guardar la fotografía con un mensaje descriptivo
git commit -m "Agrego cálculo de IVA y registro de ventas"

# Ver el historial de commits (como un libro de bitácora)
git log --oneline

# Ver qué cambió exactamente en un archivo (diferencias línea por línea)
git diff

# Volver atrás a una versión anterior (no destructivo)
git log --oneline            # anota el hash del commit, ej: a1b2c3d
git checkout a1b2c3d -- backend/ventas/views.py
```

> ⚠️ **Regla de oro del commit**: un commit = un cambio lógico, con
> mensaje claro. "Arreglo bug del IVA" está bien; "cosas" está mal.

---

## 3. ¿Qué hay dentro de nuestro repositorio?

Tres zonas conviven en la carpeta del proyecto:

| Qué | ¿Versionado? | Por qué |
|---|---|---|
| `backend/` (código) | ✅ Sí | Es NUESTRO trabajo |
| `frontend/src/` (código) | ✅ Sí | Es NUESTRO trabajo |
| `docs/`, `scripts/` | ✅ Sí | Es NUESTRO trabajo |
| `backend/venv/` | ❌ No | 300 MB de librerías que se reinstalan con `pip` |
| `frontend/node_modules/` | ❌ No | 200 MB de paquetes que se instalan con `pnpm` |
| `mongodb/` (binario + datos) | ❌ No | Datos locales de desarrollo |
| `db.sqlite3` | ❌ No | Base de sistema de Django |

Quien los excluye es el archivo **`.gitignore`**: la lista de "esto no
se sube". Ábrelo y léelo: cada línea es una decisión de diseño.

---

## 4. El flujo de trabajo de un día de desarrollo (ejercicio real)

```bash
# 1. Antes de empezar: ¿hay algo suelto?
git status

# 2. Trabajaste, probaste, funciona. Hora de guardar:
git add .
git commit -m "Implemento reporte diario por vendedor"

# 3. Revisa tu historial:
git log --oneline
```

Haz este ejercicio AHORA: crea el **primer commit** del proyecto.
Es el commit "fundacional" y te servirá de punto de retorno siempre.

```bash
git add .
git commit -m "Primera versión: login con roles, ventas con IVA, control de día y reportes"
```

---

## 5. Ramas: los universos paralelos (cómo trabajan los equipos)

Una **rama** (branch) es una línea de trabajo independiente. El flujo
clásico de un equipo:

```
main (la versión estable)
 │
 ├── feature/login          ← trabajando en el login
 ├── feature/reportes       ← trabajando en los reportes
 │
 └── (cuando algo funciona bien, se FUSIONA)
     git merge feature/login
```

```bash
# Crear y entrar a una rama nueva
git checkout -b feature/reportes

# Trabajar... commitear... y volver a main
git checkout main

# Fusionar el trabajo terminado
git merge feature/reportes
```

Para un proyecto de una persona, basta con `main`, pero conocer las
ramas es obligatorio para trabajar en empresas.

---

## 6. Repositorios remotos: GitHub, GitLab, Bitbucket

Git funciona 100% local, pero su poder real aparece al subir el
repositorio a la nube (GitHub, GitLab, etc.): respaldo automático y
trabajo en equipo.

```bash
# Subir el proyecto a GitHub por primera vez:
git remote add origin https://github.com/TU_USUARIO/bazar-repuestos.git
git push -u origin main

# Bajar cambios de otros / desde otro computador:
git pull
```

**EJERCICIO OBLIGATORIO para la asignatura:** crea un repositorio
público o privado en GitHub (github.com → New repository → no marques
"inicializar con README", porque ya tienes uno), copia la URL y ejecuta
los comandos de arriba. Entrega el enlace como parte de tu trabajo:
el profesor podrá ver TODO el historial de tu proyecto.

---

## 7. Autoprueba

1. ¿Qué comando muestra el estado del repo? → `git status`
2. ¿Qué es el `.gitignore`? → La lista de archivos que Git ignora.
3. ¿Para qué sirve el `git log`? → Para ver el historial de commits.
4. ¿Qué pasa si borro un archivo importante? → `git checkout <commit> -- <archivo>` lo recupera, si estaba commiteado.

Finalmente, mira hacia adelante: [08-siguientes-pasos.md](08-siguientes-pasos.md).
