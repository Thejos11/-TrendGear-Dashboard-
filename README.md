# TrendGear Dashboard — Entregable del Taller

Este paquete implementa las 3 fases de la guía metodológica:

## Fase I — Dataset sintético (`/data`, `generate_dataset.py`)
- `generate_dataset.py` sigue los 4 pasos (crear muestra → limpiar muestra →
  generación tipo "one-shot" → validación) y produce:
  - `data/trendgear_dataset.csv`
  - `data/trendgear_dataset.psv`
  - `data/trendgear_dataset.json` (con la forma `{ "customers": { "TG-0001": {...} } }`,
    igual a como lo entregaría Firebase Realtime Database)
- 40 registros, 11 columnas, y pasan el checklist de integridad de la guía
  (edades 13–100, montos ≥ 0, fechas ISO, `Purchase Date` ≤ `Last Login Date`,
  categorías normalizadas, IDs únicos, dominio de correo seguro `mailinator.com`).
- Para regenerar o escalar el dataset: `python3 generate_dataset.py`.

## Fase II — Maquetación (`/web`)
- `index.html`, `css/styles.css`, `js/script.js` están segregados en archivos
  independientes, tal como pide la guía.
- Especificaciones aplicadas: fondo `#1E1E1E`, tipografía Roboto, acento azul
  `#007BFF`, header/main/footer, menú que colapsa en "hamburguesa" en móvil,
  diseño responsive.

## Fase III — Integración con Firebase (`js/script.js`)
El script hace `fetch` a una URL y renderiza los datos con `forEach` +
Template Literals, tal como indica la guía. Por defecto usa el JSON local
(`data/trendgear_dataset.json`) para que el dashboard funcione sin
configuración adicional. Para conectarlo a tu propio Firebase Realtime
Database:

1. Crea una Realtime Database en la consola de Firebase.
2. Importa `data/trendgear_dataset.json` en la raíz de esa base de datos
   (Realtime Database → menú ⋮ → *Import JSON*).
3. Copia la URL REST de tu proyecto, con formato:
   `https://TU-PROYECTO-default-rtdb.firebaseio.com/customers.json`
4. Pégala en la constante `FIREBASE_URL` al inicio de `js/script.js`.
5. Si tus reglas de seguridad exigen autenticación, ajusta el `fetch` para
   incluir el token correspondiente.

## Cómo verlo
Abre `web/index.html` directamente en el navegador, o sirve la carpeta
`web/` con cualquier servidor estático (por ejemplo `python3 -m http.server`
desde dentro de `web/`).

## Auto-checklist contra la rúbrica de la guía
- **Uso de técnicas de IA**: dataset generado con lógica controlada
  (equivalente a one-shot prompting) + protocolo de depuración documentado.
- **Calidad del dataset**: 4 pasos completos + validación automática en
  `generate_dataset.py`.
- **Maquetación**: sigue las 7 especificaciones de diseño y las
  especificaciones técnicas de marca de TrendGear.
- **Integración JS/Firebase**: `fetch` asíncrono, `forEach` + Template
  Literals, manejo de errores en consola.
