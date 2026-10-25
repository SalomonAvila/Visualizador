# C++ VisualLab - Introducción a la Programación

Plataforma educativa web interactiva, moderna y **100% estática (Zero-Build / Vanilla)** diseñada específicamente para apoyar la enseñanza y el aprendizaje en cursos de **Introducción a la Programación en C++**.

No requiere instalación de librerías ni dependencias pesadas (`node_modules = 0 MB`), y corre directamente en **GitHub Pages** o en cualquier navegador web moderno.

---

## 🎯 Contenidos y Alcance Pedagógico

El simulador está diseñado estrictamente para el subconjunto introductorio de C++:

- **Tipos Primitivos y `string`:** `int`, `float`, `double`, `char`, `bool` y `std::string`.
- **Estructuras de Control:** `if`, `else if`, `else`, `switch`, `while`, `for`, `do-while`, `break`, `continue`.
- **Arreglos Unidimensionales (1D):**
  - Declaración (`int arr[5];`, `int arr[3] = {10, 20, 30};`).
  - Recorrido con ciclos, búsqueda de mayor/menor, acumulación.
  - **Visualizador:** Celdas de memoria contiguas con índices `[0]`, `[1]`, animaciones de lectura/escritura y flechas indicadoras para variables de control (ej. `i`).
- **Matrices Bidimensionales (2D):**
  - Declaración (`int mat[3][3];`).
  - Recorrido por filas y columnas mediante ciclos anidados.
  - **Visualizador:** Cuadrícula con encabezados de fila y columna, coordenadas `[fila][columna]` y resaltado de la celda activa.
- **Estructuras (`struct`):**
  - Definición de registros tipo `struct`.
  - Acceso a campos con el operador punto (`.`): `alumno.nombre`, `alumno.nota`.
  - **Arreglos de Structs:** Manejo de listas de registros con visualización en tarjetas estructuradas.
- **Funciones Básicas:**
  - Funciones con retorno primitivo o `void`.
  - Parámetros por valor y referencia básica.
  - Visualización de la **Pila de Llamadas (Call Stack)** y variables locales.
- **Flujos de Archivos (`<fstream>`):**
  - `ifstream` para lectura y `ofstream` para escritura.
  - Comprobación `archivo.is_open()`, `archivo.close()`.
  - **Lectura por comas:** `getline(archivo, token, ',')` y `getline(archivo, linea)`.
  - **Conversión de texto a número:** `atoi(token.c_str())`, `atol`, `atof`, `stoi`.
  - **Visualizador de Archivos:** Cursor interactivo que muestra cómo se va extrayendo cada token delimitado por comas de archivos CSV y cómo `atoi` lo convierte en número.
- **Consola Interactiva:** Entrada con `cin >>` y salida con `cout << ... << endl;`.
- **Cero Punteros:** No se incluyen punteros (`*`), aritmética de punteros ni memoria dinámica (`new`/`delete`), manteniendo el enfoque 100% amigable para principiantes.

---

## 🚀 Despliegue en GitHub Pages

Dado que esta aplicación es 100% estática (HTML5 + CSS + JavaScript ES Modules), puedes publicarla en GitHub Pages en menos de 1 minuto:

### Opción 1: Despliegue Directo desde la Rama (Recomendada)
1. Sube este repositorio a GitHub.
2. Ve a tu repositorio en GitHub y haz clic en **Settings** (Configuración) -> **Pages**.
3. En **Build and deployment** -> **Source**, selecciona **Deploy from a branch**.
4. En **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`.
5. Haz clic en **Save**. ¡Listo! En segundos tu sitio estará en vivo en `https://<tu-usuario>.github.io/<tu-repositorio>/`.

### Opción 2: Mediante GitHub Actions
El repositorio incluye el archivo `.github/workflows/deploy.yml`. Si activas **GitHub Actions** en **Settings** -> **Pages** -> **Source: GitHub Actions**, se desplegará automáticamente con cada `git push`.

---

## 💻 Ejecución Local

Para probarlo localmente en tu computadora:

### Con Python:
```bash
python3 -m http.server 8080
```
Luego abre tu navegador en `http://localhost:8080`.

### Con Bun:
```bash
bun run --hot index.html
```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite de pruebas para verificar el analizador léxico, sintáctico y el motor de ejecución sobre todos los ejemplos y retos:

```bash
node tests/run_tests.js
```

---

## 📁 Estructura del Código

```
├── index.html                   # Página principal de la plataforma
├── css/
│   ├── style.css                # Estilos generales, layout y temas
│   ├── editor.css               # Estilos del editor C++, gutter y consola
│   └── visualizer.css           # Estilos de arreglos, matrices, structs y fstream
├── js/
│   ├── app.js                   # Orquestador principal y eventos de UI
│   ├── interpreter/
│   │   ├── lexer.js             # Tokenizador para C++ básico
│   │   ├── parser.js            # Analizador sintáctico (AST)
│   │   ├── runtime.js           # Motor de snapshots paso a paso
│   │   └── vfs.js               # Sistema de archivos virtual para ifstream/ofstream
│   ├── visualizers/
│   │   ├── memoryView.js        # Call stack y variables
│   │   ├── arrayView.js         # Arreglos 1D animados
│   │   ├── matrixView.js        # Matrices 2D animadas con cuadrícula
│   │   ├── structView.js        # Structs y colecciones de registros
│   │   └── fileStreamView.js    # fstream, delimitación por comas y atoi
│   ├── data/
│   │   ├── examples.js          # Ejemplos precargados por tema del curso
│   │   └── challenges.js        # Retos prácticos con autoevaluación
│   └── utils/
│       └── editor.js            # Editor de código con marcador de línea activa
├── tests/
│   └── run_tests.js             # Suite de validación automatizada
└── .github/
    └── workflows/
        └── deploy.yml          # Flujo de GitHub Pages
```
