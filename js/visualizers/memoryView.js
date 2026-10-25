// Visualizador de Memoria: Variables Simples y Call Stack (Pila de Llamadas)

export class MemoryView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }

    const { callStack, variables, currentFunction } = snapshot;
    const varEntries = Object.entries(variables);

    // Si no hay variables ni funciones activas adicionales, no mostrar nada
    if (varEntries.length === 0 && callStack.length <= 1) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'block';
    let html = '<div class="memory-panel visual-section-box">';

    // 1. Mostrar Pila de Llamadas si hay más de 1 marco (llamada a función secundaria)
    if (callStack.length > 1) {
      html += `
        <div class="section-title">
          <span>Pila de Llamadas (Call Stack)</span>
          <span class="badge badge-primary">${callStack.length} marco(s)</span>
        </div>
        <div class="call-stack-list">
      `;

      for (let i = callStack.length - 1; i >= 0; i--) {
        const frame = callStack[i];
        const isActive = i === callStack.length - 1;
        html += `
          <div class="stack-frame ${isActive ? 'active-frame' : ''}">
            <div class="frame-header">
              <span class="frame-fn">${frame.functionName}()</span>
              ${isActive ? '<span class="badge badge-success">En ejecución</span>' : ''}
            </div>
          </div>
        `;
      }

      html += `</div>`;
    }

    // 2. Mostrar Variables si existen
    if (varEntries.length > 0) {
      html += `
        <div class="section-title ${callStack.length > 1 ? 'mt-3' : ''}">
          <span>🧠 Variables Primitivas (${currentFunction})</span>
          <span class="badge badge-info">${varEntries.length} variable(s)</span>
        </div>
        <div class="variables-grid">
      `;

      for (const [name, val] of varEntries) {
        let typeBadge = 'int';
        if (typeof val === 'number') {
          typeBadge = Number.isInteger(val) ? 'int' : 'float';
        } else if (typeof val === 'boolean') {
          typeBadge = 'bool';
        } else if (typeof val === 'string') {
          typeBadge = val.length === 1 ? 'char' : 'string';
        }

        html += `
          <div class="var-card" data-var="${name}">
            <div class="var-meta">
              <span class="var-type badge-type">${typeBadge}</span>
              <span class="var-name">${name}</span>
            </div>
            <div class="var-value">${this.formatValue(val)}</div>
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `</div>`;
    this.container.innerHTML = html;
  }

  formatValue(val) {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (val === null || val === undefined) return '<em>-</em>';
    return String(val);
  }
}
