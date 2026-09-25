# 12 — Guía de preparación: Interrogación Oral (para subir nota)

**Contexto**: la profe notó texto generado por IA en el informe (66,32/100) y ofrece
subir nota con una interrogación oral. Esta guía tiene las preguntas más probables,
con respuestas en palabras simples para que las digas con las tuyas.

**Consejo clave**: NO niegues haber usado IA. El enunciado dice que los informes con
IA "serán revisados con el grupo" — lo que la profe quiere es comprobar que TÚ
entiendes lo que entregaste. Muestra dominio y calma. Practica en voz alta.

---

## Bloque 1: Tu proyecto (contexto y negocio)

**1. ¿Cuál es tu proyecto y qué problema resuelve?**
> "Un sistema web de ventas para una tienda de repuestos de motocicletas. La tienda
> registraba todo a mano en cuadernos: errores de cálculo, sin reportes y sin control
> del día. Mi sistema digitaliza las ventas, calcula el IVA automáticamente, emite
> boletas y facturas, controla la apertura/cierre del día y genera reportes."

**2. ¿Cómo calcula el sistema una venta? (LA pregunta más probable)**
> "Con la fórmula chilena: neto = cantidad × precio unitario. IVA = neto × 0,19.
> Total = neto + IVA. Ejemplo: 3 neumáticos a $25.000 → neto 75.000, IVA 14.250,
> total 89.250. Y ese cálculo lo hace el SERVIDOR, no el navegador, para que nadie
> pueda alterarlo."

**3. ¿Por qué el cálculo se hace en el servidor y no en el navegador?**
> "Porque el navegador es del usuario: alguien podría abrir las herramientas de
> desarrollador, modificar el JavaScript y mandar un total falso. El servidor
> recalcula siempre y guarda su propio resultado. Es la regla de oro con dinero."

**4. ¿Qué diferencia hay entre boleta y factura en tu sistema?**
> "La boleta es para consumidor final y no pide datos del cliente. La factura sirve
> para crédito fiscal y el sistema EXIGE RUT, razón social, giro y dirección antes
> de guardar. Además, si el cliente está registrado, el vendedor escribe el RUT y
> los datos se autocompletan."

**5. ¿Qué hace el control del día?**
> "El Jefe de Ventas abre o cierra el día. Si está cerrado, el sistema bloquea
> nuevas ventas con un error 403 — y el bloqueo real está en el backend, no solo
> esconder el botón."

**6. ¿Qué módulos extra le agregaste al enunciado?**
> "Catálogo público con fotos reales, registro opcional de clientes, carrito de
> compras con localStorage, pedidos online con estados (pendiente/confirmado/
> rechazado) y pago con tarjeta con Stripe en modo prueba."

---

## Bloque 2: Arquitectura y tecnología

**7. ¿Qué tecnologías usaste y por qué?**
> "Frontend: React con Vite, porque la interfaz se arma con componentes
> reutilizables. Backend: Python con Django y Django REST Framework, que me da la
> API. Base de datos: MongoDB, porque las boletas y facturas son documentos que
> conviene guardar completos en JSON. Pagos: Stripe en modo prueba."

**8. ¿Por qué MongoDB y no MySQL?**
> "El enunciado permitía las dos. Elegí MongoDB porque una venta es un documento
> autocontenido (producto, cálculos, vendedor, cliente) que se guarda y se lee de
> una vez, y el catálogo puede cambiar sin migraciones de esquema. Si me preguntan,
> también sé usar MySQL: lo usé en una versión anterior del proyecto."

**9. ¿Cómo se comunican el frontend y el backend?**
> "Por HTTP con JSON. El frontend hace fetch a la API (por ejemplo POST
> /api/ventas/), manda el token de sesión en la cabecera Authorization, y el
> backend responde con JSON. En desarrollo, Vite hace de proxy del puerto 5173
> al 8000."

**10. ¿Qué es un token y cómo funciona tu login?**
> "Al iniciar sesión, el servidor valida las credenciales y entrega un token, como
> un carnet. El frontend lo guarda y lo manda en cada petición. Las contraseñas se
> guardan hasheadas: nunca en texto plano. Si cierras sesión, el token se borra."

**11. ¿Qué es una API REST?**
> "Es el menú de servicios del servidor organizado por recursos. Por ejemplo:
> GET /api/ventas/reporte/diario pide el reporte; POST /api/ventas/ crea una venta.
> Los verbos HTTP dicen qué hacer: GET leer, POST crear, PUT editar, DELETE borrar."

**12. ¿Cómo funciona el pago con Stripe?**
> "El backend crea una sesión de pago con el total que ÉL calculó y redirige al
> cliente a la página de Stripe. Stripe procesa la tarjeta en su página segura.
> Al volver, el backend le PREGUNTA a Stripe si el pago fue exitoso, y solo
> entonces marca el pedido como pagado. Nunca guardamos el número de la tarjeta,
> solo la marca y los últimos 4 dígitos. Sin llaves configuradas, hay una
> simulación local con validación Luhn."

---

## Bloque 3: UML (45 puntos del informe — lo más probable aquí)

**13. ¿Qué es un diagrama de casos de uso y qué muestras en el tuyo?**
> "Muestra QUÉ puede hacer cada actor en el sistema. Tengo 4 actores: Cliente
> Visitante, Cliente Registrado, Vendedor y Jefe. El cliente ve el catálogo, arma
> el carrito y pide en línea. El vendedor registra ventas y administra productos.
> El jefe controla el día y ve reportes. Uso include para comportamiento
> obligatorio (iniciar sesión, calcular IVA) y extend para lo opcional (emitir
> factura, pagar con tarjeta)."

**14. Explica tu diagrama de clases.**
> "Modela las entidades del dominio. Usuario es abstracta y de ella heredan
> Vendedor, JefeVentas y Cliente. Venta se asocia a un Vendedor (1 a muchas) y a
> un Cliente opcional (0..1). Pedido se COMPONE de LineaPedido y de un Pago: si
> borras el pedido, se borran sus partes. Tarjeta solo guarda marca y últimos 4
> dígitos. Cada atributo tiene su tipo y visibilidad."

**15. ¿Qué es la composición y en qué se diferencia de una asociación?**
> "La composición es un 'tiene' fuerte: el todo es dueño de las partes. Si el
> Pedido desaparece, sus LineaPedido también. La asociación es una relación entre
> objetos independientes, como Venta con Cliente: la venta referencia al cliente,
> pero no lo posee."

**16. Explica tu diagrama de secuencia.**
> "Modela el flujo de registrar una venta con factura en orden temporal: el
> vendedor llena el formulario, el frontend pide la vista previa a la API, la API
> consulta el día a MongoDB; si está cerrado responde 403; si está abierto calcula
> el IVA, y al confirmar guarda la venta con su folio. Cada flecha es un mensaje
> entre capas."

**17. Explica tu diagrama de componentes.**
> "Muestra la arquitectura en capas: la SPA de React (con api.js como fachada), la
> API de Django con sus 5 módulos, la capa de acceso a datos (database.py) y la
> base MongoDB, más Stripe como servicio externo. Las interfaces conectan las
> capas: REST/HTTP entre frontend y backend, y el protocolo de MongoDB hacia la
> base."

**18. Explica tu diagrama de despliegue.**
> "Muestra la infraestructura en la nube: el navegador del cliente habla por HTTPS
> con Nginx, que sirve la app y reenvía al servidor de aplicación Gunicorn+Django
> (puerto 8000 interno). La base vive en MongoDB Atlas (puerto 27017 con TLS) y
> los pagos van a Stripe por HTTPS. También anoto el despliegue de desarrollo
> local."

**19. Nombra patrones de diseño que usaste y dónde.**
> "MVT de Django (separación modelo-vista), Repository en database.py (todo el
> acceso a datos en un solo módulo), Singleton en la conexión a Mongo (se crea una
> sola vez), Façade en api.js (los componentes no usan fetch directo), Decorator
> en el control de roles (requiere_rol envuelve las vistas) y Estrategia en los
> métodos de pago."

---

## Bloque 4: Scrum y planificación

**20. ¿Por qué elegiste Scrum?**
> "Porque tengo plazos fijos e iteraciones semanales, y los requerimientos fueron
> cambiando (agregué catálogo, carrito y pagos después). Scrum maneja ese cambio
> con el backlog priorizado. Kanban sirve para flujo continuo sin fechas, que no
> era mi caso."

**21. ¿Cuáles son los roles de Scrum y cómo los aplicaste con un solo integrante?**
> "Product Owner (el comercio/docente define qué priorizar), Scrum Master
> (organizo los sprints y elimino impedimentos) y Developer (diseño, código y
> pruebas). Como somos uno, yo asumo todos los roles técnicos, pero cada
> responsabilidad tiene dueño claro."

**22. ¿Qué es una historia de usuario y qué formato usaste?**
> "Es un requerimiento contado desde el usuario: 'Como vendedor, necesito X, para
> Y'. Usé la plantilla del curso con criterios de aceptación BDD: 'En caso que...
> cuando... el sistema...'. Ejemplo: HU-VENT-002, el cálculo automático del IVA."

**23. ¿Cómo priorizas el backlog?**
> "Por valor de negocio: las historias del enunciado (login, ventas, control de
> día) son prioridad Alta; los extras como el registro de clientes son Media."

**24. Explica tu Carta Gantt.**
> "Seis sprints desde el 10 de agosto hasta el 07 de octubre: arquitectura y
> backlog, login y ventas, control de día y reportes, pruebas y servidor, tienda
> en línea (catálogo, carrito, pagos) y cierre con informe. Cada sprint termina
> con review e hitos."

---

## Bloque 5: Git y práctica

**25. ¿Cómo usaste Git?**
> "GitHub Flow: la rama main siempre estable, y cada módulo terminado se versiona
> con un commit en formato Conventional Commits (feat, docs, release). El
> .gitignore excluye credenciales y dependencias. Mi repositorio en GitHub tiene
> el historial completo."

**26. ¿Qué es un commit y cuál es su formato en tu proyecto?**
> "Una fotografía del proyecto en un punto funcional. Uso 'tipo(scope): mensaje',
> por ejemplo 'feat(ventas): registro de ventas con IVA 19%'. Cada commit es un
> módulo probado, nunca código roto."

**27. Pregunta práctica: ¿qué pasa si el vendedor intenta vender con el día cerrado?**
> "La API responde 403 con el mensaje 'El día está cerrado' y la venta no se
> guarda. En la pantalla, el formulario aparece deshabilitado y con una alerta."

**28. ¿Dónde se guardan los datos del sistema?**
> "En MongoDB, en colecciones: usuarios, tokens, ventas, productos, clientes,
> pedidos, dia y folios. El reporte diario lee directamente de la colección
> ventas: nada se inventa en la interfaz."

**29. ¿Qué harías si tuvieras 1 semana más?**
> "Agregaría tests automatizados, anulación de ventas, reporte semanal y el
> despliegue real en la nube con Nginx y Gunicorn como está descrito en el
> informe."

**30. (Trampa) ¿Entendiste todo lo del informe?**
> Respuesta honesta y segura: "Sí. Fue un proceso largo, usé herramientas de
> apoyo como cualquier desarrollador, pero cada sección la revisé y la puedo
> explicar. El proyecto completo lo construí y lo probé yo, y tengo el código y
> el repositorio como evidencia."
