// Motor de Autocompletado C++ Inteligente y Ligero para Estudiantes

export const AUTOCOMPLETE_CATALOG = [
  // Tipos de datos
  { label: 'int', type: 'tipo', detail: 'Tipo entero (ej. int x = 10;)', insertText: 'int ' },
  { label: 'float', type: 'tipo', detail: 'Decimal simple (ej. float nota = 8.5;)', insertText: 'float ' },
  { label: 'double', type: 'tipo', detail: 'Decimal doble precisión', insertText: 'double ' },
  { label: 'char', type: 'tipo', detail: 'Carácter simple (ej. char c = \'A\';)', insertText: 'char ' },
  { label: 'bool', type: 'tipo', detail: 'Booleano (true o false)', insertText: 'bool ' },
  { label: 'string', type: 'tipo', detail: 'Cadena de texto C++', insertText: 'string ' },
  { label: 'void', type: 'tipo', detail: 'Retorno vacío para funciones', insertText: 'void ' },
  { label: 'ifstream', type: 'tipo', detail: 'Lectura de archivos de texto', insertText: 'ifstream ' },
  { label: 'ofstream', type: 'tipo', detail: 'Escritura de archivos de texto', insertText: 'ofstream ' },

  // Palabras clave
  { label: 'struct', type: 'clave', detail: 'Definición de estructura/registro', insertText: 'struct ' },
  { label: 'for', type: 'clave', detail: 'Ciclo for con contador', insertText: 'for ' },
  { label: 'while', type: 'clave', detail: 'Ciclo repetitivo while', insertText: 'while ' },
  { label: 'do', type: 'clave', detail: 'Ciclo do-while', insertText: 'do ' },
  { label: 'if', type: 'clave', detail: 'Condicional if', insertText: 'if ' },
  { label: 'else', type: 'clave', detail: 'Rama alternativa else', insertText: 'else ' },
  { label: 'return', type: 'clave', detail: 'Retorno de función', insertText: 'return ' },
  { label: 'break', type: 'clave', detail: 'Interrumpir ciclo', insertText: 'break;' },
  { label: 'continue', type: 'clave', detail: 'Siguiente iteración del ciclo', insertText: 'continue;' },

  // Flujos I/O y funciones estándar
  { label: 'cout', type: 'io', detail: 'Salida por pantalla estándar', insertText: 'cout << ' },
  { label: 'cin', type: 'io', detail: 'Entrada desde teclado', insertText: 'cin >> ' },
  { label: 'endl', type: 'io', detail: 'Salto de línea en consola', insertText: 'endl;' },
  { label: 'getline(..., \',\')', type: 'función', detail: 'Leer campo delimitado por comas', insertText: 'getline(archivo, token, \',\')' },
  { label: 'getline(...)', type: 'función', detail: 'Leer línea completa', insertText: 'getline(archivo, linea)' },
  { label: 'atoi', type: 'función', detail: 'Convertir string a entero (atoi(str.c_str()))', insertText: 'atoi(.c_str())' },
  { label: 'atol', type: 'función', detail: 'Convertir string a long', insertText: 'atol(.c_str())' },
  { label: 'atof', type: 'función', detail: 'Convertir string a float/double', insertText: 'atof(.c_str())' },
  { label: 'stoi', type: 'función', detail: 'Convertir string a int C++', insertText: 'stoi()' },
  { label: 'is_open()', type: 'función', detail: 'Verificar si el archivo abrió bien', insertText: 'is_open()' },
  { label: 'close()', type: 'función', detail: 'Cerrar flujo de archivo', insertText: 'close();' },

  // Plantillas de código completas (Snippets)
  {
    label: 'for (ciclo i)',
    type: 'snippet',
    detail: 'Ciclo for clásico de 0 a n',
    insertText: `for (int i = 0; i < n; i++) {\n    \n}`
  },
  {
    label: 'for-matriz (2D)',
    type: 'snippet',
    detail: 'Recorrido de matriz por fila y columna',
    insertText: `for (int f = 0; f < filas; f++) {\n    for (int c = 0; c < columnas; c++) {\n        \n    }\n}`
  },
  {
    label: 'while-getline (CSV)',
    type: 'snippet',
    detail: 'Recorrer archivo CSV línea por línea',
    insertText: `while (getline(archivo, nombre, \',\')) {\n    getline(archivo, valorStr);\n    int valor = atoi(valorStr.c_str());\n}`
  },
  {
    label: 'struct (modelo)',
    type: 'snippet',
    detail: 'Plantilla de estructura',
    insertText: `struct Alumno {\n    string nombre;\n    int edad;\n    float nota;\n};`
  },
  {
    label: 'ifstream (abrir)',
    type: 'snippet',
    detail: 'Abrir archivo con verificación de error',
    insertText: `ifstream archivo("datos.csv");\nif (!archivo.is_open()) {\n    cout << "Error: no se pudo abrir el archivo" << endl;\n    return 1;\n}`
  },
  {
    label: 'main()',
    type: 'snippet',
    detail: 'Función principal int main()',
    insertText: `int main() {\n    \n    return 0;\n}`
  }
];

export class Autocomplete {
  constructor(editor) {
    this.editor = editor;
    this.textarea = editor.textarea;
    this.container = editor.container;

    this.isOpen = false;
    this.items = [];
    this.selectedIndex = 0;
    this.query = '';
    this.wordStart = 0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.menu = document.createElement('div');
    this.menu.className = 'autocomplete-menu';
    this.menu.style.display = 'none';
    this.container.querySelector('.editor-input-container').appendChild(this.menu);
  }

  bindEvents() {
    // Escuchar teclas especiales en el textarea
    this.textarea.addEventListener('keydown', (e) => {
      if (!this.isOpen) {
        // Atajo opcional Ctrl + Espacio para forzar apertura
        if (e.ctrlKey && e.code === 'Space') {
          e.preventDefault();
          this.triggerAutocomplete(true);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrev();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        this.applySelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    // Detectar escritura para filtrar
    this.textarea.addEventListener('input', () => {
      this.triggerAutocomplete(false);
    });

    // Cerrar al hacer clic fuera o scroll
    this.textarea.addEventListener('blur', () => {
      setTimeout(() => this.close(), 150);
    });
    this.textarea.addEventListener('scroll', () => {
      if (this.isOpen) this.close();
    });
  }

  triggerAutocomplete(forced = false) {
    const cursor = this.textarea.selectionStart;
    const text = this.textarea.value;

    // Obtener la palabra actual que se está escribiendo antes del cursor
    let start = cursor;
    while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
      start--;
    }

    const currentWord = text.substring(start, cursor);
    this.query = currentWord.toLowerCase();
    this.wordStart = start;

    if (!forced && this.query.length < 1) {
      this.close();
      return;
    }

    // 1. Extraer identificadores del código del usuario
    const userSymbols = this.extractUserSymbols(text);

    // 2. Combinar con catálogo base
    const allCandidates = [...userSymbols, ...AUTOCOMPLETE_CATALOG];

    // 3. Filtrar por el prefijo escrito
    this.items = allCandidates.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(this.query);
      return matchLabel;
    }).slice(0, 8); // Máximo 8 sugerencias

    if (this.items.length === 0) {
      this.close();
      return;
    }

    this.selectedIndex = 0;
    this.renderMenu();
    this.positionMenu(cursor);
  }

  extractUserSymbols(code) {
    const symbols = [];
    const seen = new Set();
    const regex = /\b([a-zA-Z_]\w*)\b/g;
    let match;

    const reserved = new Set([
      'int', 'float', 'double', 'char', 'bool', 'void', 'string', 'ifstream', 'ofstream', 'fstream',
      'struct', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'return',
      'cout', 'cin', 'endl', 'getline', 'atoi', 'atol', 'atof', 'stoi', 'include', 'using', 'namespace', 'std'
    ]);

    while ((match = regex.exec(code)) !== null) {
      const word = match[1];
      if (!reserved.has(word) && !seen.has(word) && word.length > 2) {
        seen.add(word);
        symbols.push({
          label: word,
          type: 'variable',
          detail: 'Símbolo del código',
          insertText: word
        });
      }
    }
    return symbols;
  }

  positionMenu(cursor) {
    const textBefore = this.textarea.value.substring(0, cursor);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;

    const lineHeight = 22; // px
    const charWidth = 8.1; // px aproximado para monospace

    const rawTop = (lineIndex + 1) * lineHeight - this.textarea.scrollTop + 38; // +38 por la barra de chips
    const left = Math.min(this.textarea.clientWidth - 280, Math.max(10, colIndex * charWidth - this.textarea.scrollLeft + 14));

    // Si se sale por abajo, mostrar hacia arriba
    const containerHeight = this.textarea.clientHeight;
    let finalTop = rawTop;
    if (rawTop > containerHeight - 160 && rawTop > 200) {
      finalTop = (lineIndex * lineHeight) - this.textarea.scrollTop - 180 + 38;
    }

    this.menu.style.top = `${Math.max(10, finalTop)}px`;
    this.menu.style.left = `${left}px`;
    this.menu.style.display = 'block';
    this.isOpen = true;
  }

  renderMenu() {
    let html = '';
    this.items.forEach((item, idx) => {
      const isSel = idx === this.selectedIndex;
      let badgeClass = 'ac-badge-clave';
      if (item.type === 'tipo') badgeClass = 'ac-badge-tipo';
      else if (item.type === 'snippet') badgeClass = 'ac-badge-snippet';
      else if (item.type === 'función') badgeClass = 'ac-badge-fn';
      else if (item.type === 'variable') badgeClass = 'ac-badge-var';

      html += `
        <div class="ac-item ${isSel ? 'ac-selected' : ''}" data-idx="${idx}">
          <span class="ac-badge ${badgeClass}">${item.type}</span>
          <span class="ac-label">${item.label}</span>
          <span class="ac-detail">${item.detail}</span>
        </div>
      `;
    });

    this.menu.innerHTML = html;

    // Clic con mouse
    const itemElements = this.menu.querySelectorAll('.ac-item');
    itemElements.forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectedIndex = parseInt(el.getAttribute('data-idx'), 10);
        this.applySelected();
      });
    });
  }

  selectNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.renderMenu();
  }

  selectPrev() {
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    this.renderMenu();
  }

  applySelected() {
    if (!this.isOpen || this.items.length === 0) return;

    const item = this.items[this.selectedIndex];
    const cursor = this.textarea.selectionStart;
    const text = this.textarea.value;

    const before = text.substring(0, this.wordStart);
    const after = text.substring(cursor);
    const insert = item.insertText;

    this.textarea.value = before + insert + after;

    // Colocar el cursor después del texto insertado
    const newCursor = this.wordStart + insert.length;
    this.textarea.selectionStart = this.textarea.selectionEnd = newCursor;

    this.close();
    this.editor.updateGutter();
    this.editor.updateHighlightOverlay();

    if (this.editor.onChangeCallback) {
      this.editor.onChangeCallback(this.textarea.value);
    }
  }

  close() {
    this.isOpen = false;
    this.menu.style.display = 'none';
  }
}
