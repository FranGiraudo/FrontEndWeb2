# SmartAuto - Plataforma Inteligente de Compra y Venta de Autos Usados

Proyecto desarrollado para la cátedra de Ingeniería Web II. SmartAuto es un marketplace avanzado de vehículos que conecta a compradores y vendedores, destacándose por la integración de herramientas de Inteligencia Artificial para la tasación y evaluación automática de publicaciones.

## Arquitectura del Proyecto

El proyecto está diseñado con una arquitectura modular y escalable, dividida actualmente en una fase de prototipo frontend puro, con miras a integrarse con un backend real.

* **Frontend:** Vanilla HTML5, CSS3 y JavaScript (ES6+).
* **Estilos:** Arquitectura CSS modular. Uso estricto de unidades relativas (`rem`) y variables globales en `:root` para garantizar consistencia en la paleta de colores y facilitar el mantenimiento.
* **Mock Backend (Actual):** Uso avanzado de `localStorage` (`database.js`) para simular bases de datos relacionales, manejo de sesiones, persistencia de publicaciones, favoritos y sistema de mensajería bidireccional.
* **Backend (Fase 2):** Preparado para migrar la lógica de almacenamiento y autenticación a una API REST construida con NestJS.

## Estructura de Directorios

El código fue refactorizado aplicando el principio DRY (Don't Repeat Yourself), aislando componentes reutilizables y manteniendo la raíz del proyecto limpia.

/
├── index.html              # Punto de entrada y Home
├── README.md               # Documentación del proyecto
├── /pages                  # Vistas secundarias
│   ├── login.html          # Autenticación y registro
│   ├── profile.html        # Dashboard de usuario (Comprador/Vendedor)
│   ├── publish.html        # Formulario de publicación con IA
│   └── detail.html         # Vista de detalle del vehículo
├── /components             # Fragmentos HTML reutilizables
│   └── header.html         # Barra de navegación inyectada dinámicamente
├── /css                    # Hojas de estilo modularizadas
│   ├── style.css           # Variables :root y estilos base/modales
│   ├── components.css      # Clases globales (botones, cards, inputs)
│   └── ...                 # Estilos específicos por vista
└── /js                     # Lógica de negocio y controladores
    ├── main.js             # Lógica global, ruteo inteligente y filtros
    ├── database.js         # Mock de base de datos y esquemas
    ├── components.js       # Inyector de fragmentos HTML
    └── ...                 # Controladores específicos por vista

## Requerimientos Principales Implementados

### 1. Integración de Inteligencia Artificial (Req 4.5)
La vista de publicación (`publish.html` / `publish.js`) cuenta con un simulador de IA que procesa la imagen cargada por el vendedor (optimizada mediante un Canvas a formato WebP) y genera un análisis automático:
* **Detección de Carrocería:** Identifica si el vehículo es Sedán, Hatchback, SUV o Pickup basándose en el modelo.
* **Estado General y Daños:** Evalúa la condición (Excelente, Buen estado, Regular, Requiere reparación) y reporta daños visibles.
* **Rango de Precio Sugerido:** Calcula un margen de valor de mercado razonable basado en los datos ingresados.

### 2. Comparador Avanzado (Req 4.6)
Los compradores pueden seleccionar hasta 3 vehículos simultáneamente desde el catálogo. Una barra flotante persistente permite abrir un modal con una tabla comparativa dinámica que cruza especificaciones técnicas, precio y dictamen de la IA.

### 3. Gestión de Roles y Dashboard (Req 4.1 y 8)
El sistema diferencia entre `Comprador` y `Vendedor`. El perfil adapta su vista según el rol:
* **Vendedores:** Acceden a métricas (visitas, contactos) y gestión completa de sus publicaciones (CRUD).
* **Compradores:** Acceden a su lista de favoritos y estado de consultas enviadas.
* Ambos roles interactúan mediante un sistema de chat anidado persistente.

## Instrucciones de Instalación y Ejecución

Al ser un proyecto Vanilla, no requiere la instalación de dependencias mediante gestores de paquetes en esta etapa.

1. Clonar el repositorio en el entorno local.
2. Abrir la carpeta raíz del proyecto en un editor de código (como Visual Studio Code).
3. Iniciar un servidor local estático. Se recomienda utilizar la extensión **Live Server** de VS Code para evitar restricciones de CORS al momento de inyectar el `header.html` dinámicamente.
4. Navegar a `http://127.0.0.1:5500/index.html` (o el puerto asignado).
5. (Opcional) Para probar ambos roles, registrar una cuenta de Vendedor y otra de Comprador, o utilizar las credenciales por defecto configuradas en `database.js` si existiesen.

## Consideraciones Técnicas

* **Inyección de Dependencias (HTML):** El componente `header.html` es cargado mediante `fetch API` por `components.js`. El script detecta automáticamente el nivel de profundidad de la ruta (`pathname`) para ajustar los enlaces relativos de navegación.
* **Seguridad Simulada:** El registro de usuarios ofusca temporalmente las contraseñas en Base64. Esto es una representación arquitectónica que será reemplazada por algoritmos de hashing (ej. bcrypt) en la integración con el backend.