// Editor de Código C++ Ligero con Números de Línea y Marcador de Línea Activa

export class CodeEditor {
  constructor(containerElement, initialCode = '') {
    this.container = containerElement;
    this.initialCode = initialCode;
    this.activeLine = -1;
    this.onChangeCallback = null;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="editor-wrapper">
        <div class="editor-gutter" id="editorGutter"></div>
        <div class="editor-input-container">
          <div class="editor-highlights" id="editorHighlights"></div>
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
    this.highlights = this.container.querySelector('#editorHighlights');

    this.setupEvents();
    this.updateGutter();
  }

  setupEvents() {
    // Sincronizar scroll entre gutter y textarea
    this.textarea.addEventListener('scroll', () => {
      this.gutter.scrollTop = this.textarea.scrollTop;
      this.highlights.scrollTop = this.textarea.scrollTop;
    });

    // Entrada de texto
    this.textarea.addEventListener('input', () => {
      this.updateGutter();
      this.updateHighlightOverlay();
      if (this.onChangeCallback) {
        this.onChangeCallback(this.getValue());
      }
    });

    // Manejo de la tecla TAB para indentar con 4 espacios
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        this.textarea.value = val.substring(0, start) + '    ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        this.updateGutter();
        this.updateHighlightOverlay();

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

  updateHighlightOverlay() {
    const lines = this.textarea.value.split('\n');
    let overlayHtml = '';

    for (let i = 1; i <= lines.length; i++) {
      const isCurLine = i === this.activeLine;
      overlayHtml += `<div class="code-line-layer ${isCurLine ? 'active-code-line' : ''}">&nbsp;</div>`;
    }

    this.highlights.innerHTML = overlayHtml;
  }

  setActiveLine(lineNum) {
    this.activeLine = lineNum;
    this.updateGutter();
    this.updateHighlightOverlay();

    if (lineNum > 0) {
      // Auto-scroll hacia la línea activa
      const lineHeight = 22; // px aproximado
      const targetScroll = Math.max(0, (lineNum - 5) * lineHeight);
      if (Math.abs(this.textarea.scrollTop - targetScroll) > 150) {
        this.textarea.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }

  clearActiveLine() {
    this.activeLine = -1;
    this.updateGutter();
    this.updateHighlightOverlay();
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(newCode) {
    this.textarea.value = newCode;
    this.updateGutter();
    this.updateHighlightOverlay();
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
