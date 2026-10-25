// Editor de Código C++ Ligero con Resaltado de Sintaxis, Guías Visuales y Autocompletado
import { CppHighlighter } from './highlighter.js';
import { Autocomplete, AUTOCOMPLETE_CATALOG } from './autocomplete.js';

export class CodeEditor {
  constructor(containerElement, initialCode = '') {
    this.container = containerElement;
    this.initialCode = initialCode;
    this.activeLine = -1;
    this.onChangeCallback = null;

    this.render();
    this.autocomplete = new Autocomplete(this);
  }

  render() {
    this.container.innerHTML = `
      <!-- Barra Superior de Snippets y Asistente de Código -->
      <div class="editor-quick-bar">
        <span class="quick-bar-label">⚡ Asistente C++:</span>
        <button type="button" class="quick-chip" data-snip="for" title="Insertar ciclo for con contador">+ for</button>
        <button type="button" class="quick-chip" data-snip="for-matriz" title="Insertar recorrido de matriz 2D">+ for 2D</button>
        <button type="button" class="quick-chip" data-snip="while-getline" title="Insertar lectura CSV con comas y atoi">+ getline CSV</button>
        <button type="button" class="quick-chip" data-snip="struct" title="Insertar estructura struct">+ struct</button>
        <button type="button" class="quick-chip" data-snip="ifstream" title="Insertar apertura de archivo ifstream">+ ifstream</button>
        <button type="button" class="quick-chip" data-snip="cout" title="Insertar cout estándar">+ cout</button>
        <span class="quick-bar-hint">Tips: Ctrl+Espacio para autocompletar</span>
      </div>

      <div class="editor-wrapper">
        <div class="editor-gutter" id="editorGutter"></div>
        <div class="editor-input-container">
          <!-- Capa de resaltado de sintaxis y guías visuales detrás del textarea -->
          <pre class="editor-syntax-layer" id="editorSyntaxLayer" aria-hidden="true"></pre>
          
          <!-- Textarea transparente para edición nativa con cursor -->
          <textarea 
            class="editor-textarea" 
            id="editorTextarea" 
            spellcheck="false" 
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="off">${this.escapeHtml(this.initialCode)}</textarea>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('#editorTextarea');
    this.gutter = this.container.querySelector('#editorGutter');
    this.syntaxLayer = this.container.querySelector('#editorSyntaxLayer');

    this.setupEvents();
    this.setupQuickChips();
    this.updateGutter();
    this.updateSyntaxHighlight();
  }

  setupEvents() {
    // Sincronizar scroll entre gutter, syntaxLayer y textarea
    this.textarea.addEventListener('scroll', () => {
      this.gutter.scrollTop = this.textarea.scrollTop;
      this.syntaxLayer.scrollTop = this.textarea.scrollTop;
      this.syntaxLayer.scrollLeft = this.textarea.scrollLeft;
    });

    // Entrada de texto
    this.textarea.addEventListener('input', () => {
      this.updateGutter();
      this.updateSyntaxHighlight();
      if (this.onChangeCallback) {
        this.onChangeCallback(this.getValue());
      }
    });

    // Manejo de la tecla TAB para indentar con 4 espacios
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (this.autocomplete && this.autocomplete.isOpen) return;

        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        this.textarea.value = val.substring(0, start) + '    ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        this.updateGutter();
        this.updateSyntaxHighlight();

        if (this.onChangeCallback) {
          this.onChangeCallback(this.getValue());
        }
      }
    });
  }

  setupQuickChips() {
    const chips = this.container.querySelectorAll('.quick-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const snipType = chip.getAttribute('data-snip');
        this.insertSnippet(snipType);
      });
    });
  }

  insertSnippet(snipType) {
    let snippetCode = '';
    if (snipType === 'for') {
      snippetCode = `    for (int i = 0; i < n; i++) {\n        \n    }\n`;
    } else if (snipType === 'for-matriz') {
      snippetCode = `    for (int f = 0; f < filas; f++) {\n        for (int c = 0; c < columnas; c++) {\n            \n        }\n    }\n`;
    } else if (snipType === 'while-getline') {
      snippetCode = `    while (getline(archivo, campo, ',')) {\n        getline(archivo, valorStr);\n        int valor = atoi(valorStr.c_str());\n    }\n`;
    } else if (snipType === 'struct') {
      snippetCode = `struct Alumno {\n    string nombre;\n    int edad;\n    float nota;\n};\n`;
    } else if (snipType === 'ifstream') {
      snippetCode = `    ifstream archivo("datos.csv");\n    if (!archivo.is_open()) {\n        cout << "Error al abrir archivo" << endl;\n        return 1;\n    }\n`;
    } else if (snipType === 'cout') {
      snippetCode = `    cout << "Resultado: " << valor << endl;\n`;
    }

    if (!snippetCode) return;

    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const val = this.textarea.value;

    this.textarea.value = val.substring(0, start) + snippetCode + val.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + snippetCode.length;
    this.textarea.focus();

    this.updateGutter();
    this.updateSyntaxHighlight();

    if (this.onChangeCallback) {
      this.onChangeCallback(this.getValue());
    }
  }

  updateGutter() {
    const lines = this.textarea.value.split('\n');
    const totalLines = lines.length;
    let gutterHtml = '';

    for (let i = 1; i <= totalLines; i++) {
      const isCurLine = i === this.activeLine;
      gutterHtml += `
        <div class="gutter-line ${isCurLine ? 'gutter-active-line' : ''}">
          <span class="gutter-arrow">${isCurLine ? '▶' : ''}</span>
          <span class="gutter-number">${i}</span>
        </div>
      `;
    }

    this.gutter.innerHTML = gutterHtml;
  }

  updateSyntaxHighlight() {
    const code = this.textarea.value;
    const highlightedHtml = CppHighlighter.highlight(code, this.activeLine);
    this.syntaxLayer.innerHTML = highlightedHtml;
  }

  setActiveLine(lineNum) {
    this.activeLine = lineNum;
    this.updateGutter();
    this.updateSyntaxHighlight();

    if (lineNum > 0) {
      const lineHeight = 22; // px
      const targetScroll = Math.max(0, (lineNum - 5) * lineHeight);
      if (Math.abs(this.textarea.scrollTop - targetScroll) > 150) {
        this.textarea.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }

  clearActiveLine() {
    this.activeLine = -1;
    this.updateGutter();
    this.updateSyntaxHighlight();
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(newCode) {
    this.textarea.value = newCode;
    this.updateGutter();
    this.updateSyntaxHighlight();
    if (this.onChangeCallback) {
      this.onChangeCallback(newCode);
    }
  }

  onChange(callback) {
    this.onChangeCallback = callback;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
