// Autocompletado C++ enfocado exclusivamente en palabras reservadas y tipos de datos

export const AUTOCOMPLETE_CATALOG = [
  // Tipos de datos primitivos y streams
  { label: 'int', type: 'tipo', detail: 'Tipo de dato entero', insertText: 'int' },
  { label: 'float', type: 'tipo', detail: 'Tipo decimal simple', insertText: 'float' },
  { label: 'double', type: 'tipo', detail: 'Tipo decimal doble precisión', insertText: 'double' },
  { label: 'char', type: 'tipo', detail: 'Tipo carácter', insertText: 'char' },
  { label: 'bool', type: 'tipo', detail: 'Tipo booleano', insertText: 'bool' },
  { label: 'string', type: 'tipo', detail: 'Cadena de texto C++', insertText: 'string' },
  { label: 'void', type: 'tipo', detail: 'Tipo de retorno vacío', insertText: 'void' },
  { label: 'ifstream', type: 'tipo', detail: 'Flujo de lectura de archivos', insertText: 'ifstream' },
  { label: 'ofstream', type: 'tipo', detail: 'Flujo de escritura de archivos', insertText: 'ofstream' },
  { label: 'fstream', type: 'tipo', detail: 'Flujo de archivo general', insertText: 'fstream' },

  // Palabras reservadas del lenguaje
  { label: 'struct', type: 'clave', detail: 'Palabra reservada struct', insertText: 'struct' },
  { label: 'for', type: 'clave', detail: 'Palabra reservada for', insertText: 'for' },
  { label: 'while', type: 'clave', detail: 'Palabra reservada while', insertText: 'while' },
  { label: 'do', type: 'clave', detail: 'Palabra reservada do', insertText: 'do' },
  { label: 'if', type: 'clave', detail: 'Palabra reservada if', insertText: 'if' },
  { label: 'else', type: 'clave', detail: 'Palabra reservada else', insertText: 'else' },
  { label: 'return', type: 'clave', detail: 'Palabra reservada return', insertText: 'return' },
  { label: 'break', type: 'clave', detail: 'Palabra reservada break', insertText: 'break;' },
  { label: 'continue', type: 'clave', detail: 'Palabra reservada continue', insertText: 'continue;' },
  { label: 'true', type: 'clave', detail: 'Valor booleano true', insertText: 'true' },
  { label: 'false', type: 'clave', detail: 'Valor booleano false', insertText: 'false' },

  // Flujos I/O y funciones estándar del curso
  { label: 'cout', type: 'io', detail: 'Flujo de salida estándar', insertText: 'cout' },
  { label: 'cin', type: 'io', detail: 'Flujo de entrada estándar', insertText: 'cin' },
  { label: 'endl', type: 'io', detail: 'Fin de línea de flujo', insertText: 'endl' },
  { label: 'getline', type: 'función', detail: 'Función getline para texto/CSV', insertText: 'getline' },
  { label: 'atoi', type: 'función', detail: 'Conversión string a int', insertText: 'atoi' },
  { label: 'atol', type: 'función', detail: 'Conversión string a long', insertText: 'atol' },
  { label: 'atof', type: 'función', detail: 'Conversión string a float', insertText: 'atof' },
  { label: 'stoi', type: 'función', detail: 'Conversión de string a int', insertText: 'stoi' },
  { label: 'is_open', type: 'función', detail: 'Método comprobación de archivo', insertText: 'is_open()' },
  { label: 'close', type: 'función', detail: 'Método cierre de archivo', insertText: 'close()' },
  { label: 'c_str', type: 'función', detail: 'Método c_str() de string', insertText: 'c_str()' }
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
    this.textarea.addEventListener('keydown', (e) => {
      if (!this.isOpen) {
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

    this.textarea.addEventListener('input', () => {
      this.triggerAutocomplete(false);
    });

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

    // Filtrar únicamente palabras reservadas y tipos de dato del catálogo
    this.items = AUTOCOMPLETE_CATALOG.filter(item => {
      return item.label.toLowerCase().startsWith(this.query) ||
             (this.query.length >= 2 && item.label.toLowerCase().includes(this.query));
    }).slice(0, 7);

    if (this.items.length === 0) {
      this.close();
      return;
    }

    this.selectedIndex = 0;
    this.renderMenu();
    this.positionMenu(cursor);
  }

  positionMenu(cursor) {
    const textBefore = this.textarea.value.substring(0, cursor);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;

    const lineHeight = 22; // px
    const charWidth = 8.1; // px aproximado para monospace

    const rawTop = (lineIndex + 1) * lineHeight - this.textarea.scrollTop;
    const left = Math.min(this.textarea.clientWidth - 260, Math.max(10, colIndex * charWidth - this.textarea.scrollLeft + 14));

    const containerHeight = this.textarea.clientHeight;
    let finalTop = rawTop;
    if (rawTop > containerHeight - 140 && rawTop > 160) {
      finalTop = (lineIndex * lineHeight) - this.textarea.scrollTop - 160;
    }

    this.menu.style.top = `${Math.max(5, finalTop)}px`;
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
      else if (item.type === 'función') badgeClass = 'ac-badge-fn';

      html += `
        <div class="ac-item ${isSel ? 'ac-selected' : ''}" data-idx="${idx}">
          <span class="ac-badge ${badgeClass}">${item.type}</span>
          <span class="ac-label">${item.label}</span>
          <span class="ac-detail">${item.detail}</span>
        </div>
      `;
    });

    this.menu.innerHTML = html;

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

    const newCursor = this.wordStart + insert.length;
    this.textarea.selectionStart = this.textarea.selectionEnd = newCursor;

    this.close();
    this.editor.updateGutter();
    this.editor.updateSyntaxHighlight();

    if (this.editor.onChangeCallback) {
      this.editor.onChangeCallback(this.textarea.value);
    }
  }

  close() {
    this.isOpen = false;
    this.menu.style.display = 'none';
  }
}
