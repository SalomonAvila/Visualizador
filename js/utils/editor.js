// Editor de Código C++ Ligero con Resaltado de Sintaxis, Guías Visuales y Autocompletado
import { CppHighlighter } from './highlighter.js';
import { Autocomplete } from './autocomplete.js';

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
        // Si el menú de autocompletado está abierto, lo gestiona el módulo Autocomplete
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
