# Auditoría de Software, Testing y Aseguramiento de Calidad Comercial

Este documento técnico establece las directrices fundamentales de auditoría, control de calidad, mitigación de vulnerabilidades de seguridad y el plan de refactorización por fases para la Plataforma Inteligente de Compra y Venta de Autos Usados (Cátedra de Ingeniería Web II - 2026). Su propósito es certificar que la solución cumpla con los estándares más rigurosos de la industria de software, asegurando un producto modular, escalable y con viabilidad comercial directa.

---

## 1. Estándares de Calidad y Métricas de Código (Análisis Estático)

Para garantizar un código limpio, legible y con alta mantenibilidad, se imponen restricciones automáticas a nivel de análisis estático.

### Reglas de Arquitectura Estrictas

* **Límite de Extensión (Regla de las 200 líneas):** Ningún archivo de script en el Frontend (`main.js`, `detail.js`, `publish.js`, `profile.js`) ni componentes del Backend (Controllers, Services, Modules) puede superar las 200 líneas de código. Esto anula por completo el antipatrón de archivos gigantes (God Files). Si una clase o script se aproxima a este límite, debe delegar responsabilidades en funciones utilitarias en `utils.js` o submódulos especializados.
* **Complejidad Ciclomática y Cognitiva:** Se establece un umbral máximo de 10 por función. Se prohíbe el anidamiento excesivo de estructuras de control (`if/else`, `switch`, bucles anidados). Cada bloque de código debe cumplir una única responsabilidad (Single Responsibility Principle).
* **Higiene del Código:** 
  * Queda estrictamente prohibido el uso de tipos flojos (`any`) en TypeScript. Todo dato debe estar firmemente tipado mediante interfaces o DTOs.
  * No se permite la persistencia de código muerto, funciones comentadas o comentarios redundantes que expliquen "qué hace" el código en lugar de "por qué" se tomó esa decisión arquitectónica.
  * Está terminantemente prohibido incluir caracteres emoji en comentarios, cadenas de strings del código fuente o inyecciones de texto en el DOM.

### Configuración Automática de Entorno

Para estandarizar el código en el equipo, se integran los siguientes archivos de configuración en la raíz del espacio de trabajo:

#### `.eslintrc.json`
```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "max-lines": ["error", { "max": 200, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["error", { "max": 40, "skipBlankLines": true, "skipComments": true }],
    "no-explicit-any": "error",
    "complexity": ["error", 10],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

#### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## 2. Seguridad a Nivel de Producción y Protección de Datos

Un software comercializable debe proteger el capital financiero de las llamadas a la API de Inteligencia Artificial (Gemini) y blindar la información confidencial de los usuarios.

### OWASP Top 10 Aplicado al Stack Tecnológico

* **Inyección (SQLi y comandos):** Al utilizar Prisma ORM acoplado a PostgreSQL, todas las consultas y mutaciones de datos se ejecutan a través de consultas parametrizadas de forma nativa. Esto evita inyecciones de SQL directo, aislando la capa de datos de vulnerabilidades externas.
* **Secuencias de Comandos en Sitios Cruzados (XSS):** Dado que el Frontend interactúa directamente con el DOM a través de Vanilla JavaScript, se prohíbe taxativamente el uso de `element.innerHTML` al inyectar datos suministrados por el usuario (como comentarios, descripciones de autos o consultas). Es obligatorio el uso de `element.textContent` o la instanciación segura de nodos mediante `document.createElement()`.
* **Exposición de Datos Sensibles y Gestión de Secretos:** Queda estrictamente prohibido hardcodear cadenas de conexión a bases de datos o llaves privadas de la API de Google Gemini en el código fuente. Toda credencial se encapsula en un archivo `.env` excluido del control de versiones mediante `.gitignore`. El backend consume estas variables exclusivamente a través del módulo de configuración centralizado de NestJS (`ConfigService`).

### Auditoría de Dependencias

Se exige la ejecución sistemática del motor de análisis de vulnerabilidades en el empaquetador del proyecto mediante el comando:

```bash
npm audit
```

Cualquier alerta clasificada como "Moderate", "High" o "Critical" bloqueará automáticamente el flujo de integración hasta que sea corregida actualizando las dependencias a versiones estables y firmadas.

## 3. Arquitectura de Testing Automatizado (Estrategia TDD)

La modularización de archivos densos para cumplir la regla de las 200 líneas requiere una red de seguridad que verifique que el comportamiento del negocio no sufra regresiones.

### Backend Testing (NestJS + Jest)

#### Pruebas Unitarias (`*.spec.ts`)
Se enfocan en aislar la lógica pura de los servicios mediante la simulación (mocking) de dependencias externas.

En el caso de `AiService`, se simula la respuesta de red del SDK de Gemini 2.5 Flash, forzando escenarios donde el LLM devuelve estructuras de datos correctas y escenarios de fallo donde el JSON está corrupto.

Ejemplo de estructura conceptual de prueba unitaria en NestJS:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock_api_key') },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('debe estructurar y validar la respuesta json de gemini sin alterar el flujo', async () => {
    // Simulación del comportamiento interno de generación de contenido
    const mockResponse = { brand: 'Ford', model: 'Focus', confidence: 0.95 };
    jest.spyOn(service, 'generateJsonReply').mockResolvedValue(mockResponse);

    const result = await service.generateJsonReply('prompt_test');
    expect(result).toHaveProperty('brand', 'Ford');
    expect(result.confidence).toBeGreaterThan(0.6);
  });
});
```

#### Pruebas de Integración y Extremo a Extremo (`*.e2e-spec.ts`)
Validan el comportamiento transaccional del software levantando una instancia real de la aplicación bajo contenedores o bases de datos de testing. Se realizan peticiones directas HTTP mediante `supertest`.

Se audita que `POST /auctions/:id/bid` rechace ofertas que sean inferiores al precio actual con un código de estado 400 (Bad Request), y acepte ofertas válidas respondiendo con un código 201 (Created) e impactando de manera atómica la base de datos en PostgreSQL.

### Frontend Testing (Vanilla JS DOM Integration)

Las pruebas de cliente verifican de manera aislada que las funciones modulares del Frontend procesen correctamente las respuestas de la API y alteren los nodos semánticos sin depender de un navegador completo. Se ejecutan bajo un entorno virtualizado como JSDOM.

Se audita que al pasarle un objeto JSON de respuesta a la función encargada del estimador de precio, esta inyecte en el DOM un elemento contenedor cuyas dimensiones estén expresadas puramente en `rem` y cuyos colores de fondo provengan de las variables declaradas en `:root`.

## 4. Automatización de Pipelines (CI/CD Workflow)

Cada cambio realizado en el código fuente debe pasar por un riguroso proceso de certificación automatizado en la nube antes de considerarse apto para la fase de producción o entrega comercial.

A continuación, se detalla la configuración del pipeline para GitHub Actions (`.github/workflows/ci.yml`):

```yaml
name: Evaluacion de Calidad e Integracion Continua

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  auditoria_calidad:
    runs-on: ubuntu-latest

    services:
      postgres_test:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: marketplace_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Clonar Codigo Fuente
      uses: actions/checkout@v3

    - name: Configurar Entorno Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'

    - name: Instalacion Limpia de Dependencias
      run: npm ci

    - name: Auditoria Estatica y Control de Lineas (Linter)
      run: npm run lint

    - name: Validar Consistencia de Estilos (Prettier)
      run: npm run format:check

    - name: Inicializar Esquema de Base de Datos (Prisma Migrate)
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/marketplace_test

    - name: Ejecutar Suite de Pruebas Unitarias
      run: npm run test

    - name: Ejecutar Suite de Pruebas Extremo a Extremo (E2E)
      run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/marketplace_test
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

    - name: Validar Compilacion de Produccion (Build)
      run: npm run build
```

## 5. Hoja de Ruta de Implementación por Fases (Clean Code)

Para asegurar un desarrollo incremental sin introducir deuda técnica, el backlog pendiente de los 20 requisitos opcionales se organiza en las siguientes fases críticas de refactorización:

### 🏁 Fase 1: Sólidez de Infraestructura y Modelado de Datos
**Enfoque:** Configurar los cimientos globales del servidor para soportar las llamadas asíncronas y las relaciones complejas de persistencia.

**Acciones:**
* Compilar el archivo `schema.prisma` definitivo. Mapear de forma integrada los 10 modelos opcionales restantes (PriceHistory, Favorite, SearchHistory, Review, Report, Auction, Bid, Notification, AiRecommendation), declarando claves foráneas con restricciones estrictas de borrado e índices compuestos únicos.
* Implementar e inicializar el módulo global `AiModule` y el servicio encapsulado `AiService`. Asegurar el manejo estricto de variables de entorno mediante `ConfigService` e implementar el método genérico que configure las opciones del SDK de Gemini para asegurar que las respuestas del LLM se limiten a objetos estructurados JSON sin texto formateado adicional.

### 🚀 Fase 2: Desacoplamiento de UI y Modularización de Vistas
**Enfoque:** Intervenir los scripts del Frontend que tiendan al crecimiento excesivo de líneas y acoplar los componentes funcionales interconectados con las variables globales del diseño.

**Acciones:**
* Desacoplar el archivo `detail.js`. Ninguna lógica secundaria puede convivir dentro del mismo script. El archivo base solo coordina las llamadas iniciales; el Mapa interactivo de Leaflet, la Calculadora de costos en `rem`, la línea de tiempo del Historial de precios y el bloque de reputación del Vendedor Destacado se deben empaquetar en funciones independientes de manipulación limpia del DOM aisladas en submódulos específicos.
* Refactorizar el archivo `publish.js`. Aislar por completo el manejador de eventos del input de archivos. El proceso de envío de FormData hacia el endpoint de pre-completado inteligente mediante IA debe encapsularse en una función independiente que inhabilite transitoriamente los campos de texto, manejando los estados visuales en base a variables de `:root`.
* Desplegar los servicios de despacho para el Sistema de Notificaciones. Codificar tanto la persistencia en base de datos como las funciones en `utils.js` encargadas de renderizar las alertas en el frontend (bajas de precios de favoritos y nuevas consultas) con dimensiones en `rem` y sin emojis.

### 📈 Fase 3: Cobertura de Pruebas y Certificación de Producción
**Enfoque:** Validar la estabilidad del ecosistema completo bajo entornos controlados y ejecutar el cierre técnico del software para su venta.

**Acciones:**
* Desarrollar las clases de prueba `.spec.ts` para todos los controladores y servicios del backend, asegurando una cobertura mínima de líneas del 80% sobre el código de negocio.
* Implementar la tarea asíncrona semanal (`@nestjs/schedule`) para procesar las recomendaciones personalizadas del Asesor Inteligente por fuera del hilo de peticiones de la API principal, optimizando los tiempos de respuesta del sitio.
* Someter el proyecto completo a un escaneo en SonarQube, depurando cualquier indicador de duplicidad de código o vulnerabilidades OWASP para certificar la calificación de máxima calidad en producción.
