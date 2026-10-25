// Visualizador de Memoria: Variables Simples y Call Stack (Pila de Llamadas)

export class MemoryView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot) {
      this.container.innerHTML = '<div class="empty-state">No hay ejecución activa</div>';
      return;
    }

    const { callStack, variables, currentFunction } = snapshot;
    const varEntries = Object.entries(variables);

    let html = `
      <div class="memory-panel">
        <div class="section-title">
          <span>Pila de Llamadas (Call Stack)</span>
          <span class="badge badge-primary">${callStack.length} marco(s)</span>
        </div>
        <div class="call-stack-list">
    `;

    // Mostrar pila en orden inverso (arriba el marco activo)
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

    html += `
        </div>

        <div class="section-title mt-4">
          <span>Variables Locales en '${currentFunction}()'</span>
          <span class="badge badge-info">${varEntries.length} variables</span>
        </div>
    `;

    if (varEntries.length === 0) {
      html += `
        <div class="empty-state">No hay variables primitivas declaradas en este ámbito.</div>
      `;
    } else {
      html += `<div class="variables-grid">`;
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
    if (val === null || val === undefined) return '<em>no inicializado</em>';
    return String(val);
  }
}
