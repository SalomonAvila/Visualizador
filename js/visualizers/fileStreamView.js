// Visualizador de Flujos de Archivo (ifstream y ofstream), parseo por comas y conversiones atoi

export class FileStreamView {
  constructor(containerElement, onFileContentChange) {
    this.container = containerElement;
    this.onFileContentChange = onFileContentChange;
    this.activeTab = 'estudiantes.csv';
  }

  render(snapshot) {
    if (!snapshot || !snapshot.vfsState || snapshot.vfsState.openFiles.length === 0) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'block';
    const { openFiles, allFiles } = snapshot.vfsState;
    const fileNames = Object.keys(allFiles);

    if (!fileNames.includes(this.activeTab) && fileNames.length > 0) {
      this.activeTab = openFiles[0]?.filename || fileNames[0];
    }

    let html = `
      <div class="fstream-container visual-section-box">
        <div class="section-title">
          <span>📄 Archivos y Flujos (fstream)</span>
          <span class="badge badge-primary">${openFiles.length} flujo(s) abierto(s)</span>
        </div>

        <!-- Barra de Estado de Streams Abiertos -->
        <div class="stream-status-bar">
          <div class="status-label">Archivos en uso:</div>
    `;

    for (const stream of openFiles) {
      const modeBadge = stream.mode === 'in' 
        ? '<span class="badge badge-info">ifstream (Lectura)</span>' 
        : '<span class="badge badge-warning">ofstream (Escritura)</span>';

      html += `
        <div class="stream-tag">
          <span class="stream-icon">📄</span>
          <strong>${stream.filename}</strong>
          ${modeBadge}
          ${stream.eof ? '<span class="badge badge-danger">EOF (Fin)</span>' : ''}
          ${stream.lastToken ? `<span class="badge badge-success">Último token: "${stream.lastToken}"</span>` : ''}
        </div>
      `;
    }

    html += `
        </div>

        <!-- Pestañas de Archivos -->
        <div class="fstream-tabs">
    `;

    for (const name of fileNames) {
      const isSelected = name === this.activeTab;
      const isOpen = openFiles.some(f => f.filename === name);
      if (!isOpen && name.includes('datos') && !openFiles.some(f => f.filename === name)) {
        // Solo mostrar archivos relevantes si están abiertos o son de entrada activa
      }
      html += `
        <button class="file-tab-btn ${isSelected ? 'active' : ''}" data-file="${name}">
          ${isOpen ? '<span class="dot-open" title="Archivo abierto">●</span>' : ''}
          ${name}
        </button>
      `;
    }

    html += `
        </div>

        <!-- Visor del Contenido del Archivo con Cursor de Lectura -->
        <div class="file-viewer-box">
          <div class="file-viewer-header">
            <span>Contenido de <strong>${this.activeTab}</strong></span>
            <small class="text-muted">Archivo virtual en memoria</small>
          </div>
          <div class="file-content-area" id="activeFileContent">
            ${this.renderFileContentWithCursor(this.activeTab, allFiles[this.activeTab], openFiles)}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    const tabBtns = this.container.querySelectorAll('.file-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-file');
        this.render(snapshot);
      });
    });
  }

  renderFileContentWithCursor(filename, content, openFiles) {
    if (content === undefined || content === null) {
      return '<div class="empty-state">Archivo vacío o no creado aún.</div>';
    }

    const stream = openFiles.find(f => f.filename === filename);
    const cursor = stream ? stream.cursor : -1;
    const lastToken = stream ? stream.lastToken : '';

    const lines = content.split('\n');
    let html = '<div class="code-lines-display">';
    let charCounter = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];
      const lineStart = charCounter;
      const lineEnd = charCounter + lineText.length;
      charCounter += lineText.length + 1; // +1 por \n

      const isLineUnderCursor = stream && cursor >= lineStart && (cursor <= lineEnd || lineIdx === lines.length - 1);

      html += `
        <div class="file-line-row ${isLineUnderCursor ? 'line-reading' : ''}">
          <span class="file-line-num">${lineIdx + 1}</span>
          <span class="file-line-text">${this.highlightTokens(lineText, stream, isLineUnderCursor)}</span>
        </div>
      `;
    }

    html += '</div>';

    if (stream && stream.mode === 'in' && lastToken) {
      const parsedInt = parseInt(lastToken.trim(), 10);
      const isNum = !isNaN(parsedInt);

      html += `
        <div class="token-conversion-banner">
          <div class="token-step">
            <span class="token-label">Token extraído con getline:</span>
            <span class="token-badge">"${lastToken}"</span>
          </div>
          ${isNum ? `
            <div class="token-arrow">➔ <code>atoi()</code> ➔</div>
            <div class="token-step">
              <span class="token-label">Entero convertido:</span>
              <span class="number-badge">${parsedInt}</span>
            </div>
          ` : `
            <div class="token-step">
              <span class="token-note">(Texto alfanumérico)</span>
            </div>
          `}
        </div>
      `;
    }

    return html;
  }

  highlightTokens(lineText, stream, isLineUnderCursor) {
    if (!lineText) return '&nbsp;';

    const parts = lineText.split(',');
    return parts.map((part, idx) => {
      const isLastToken = isLineUnderCursor && stream && stream.lastToken === part.trim();
      return `
        <span class="csv-token ${isLastToken ? 'active-token-highlight' : ''}">${this.escapeHtml(part)}</span>
        ${idx < parts.length - 1 ? '<span class="csv-comma">,</span>' : ''}
      `;
    }).join('');
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
