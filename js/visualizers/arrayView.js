// Visualizador de Arreglos 1D con Celdas, Índices y Punteros de Variables de Control

export class ArrayView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot || !snapshot.arrays1D || Object.keys(snapshot.arrays1D).length === 0) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'block';
    const { arrays1D, activePointers } = snapshot;
    let html = '<div class="arrays-container visual-section-box">';
    html += `
      <div class="section-title">
        <span>📊 Arreglos Unidimensionales (1D)</span>
        <span class="badge badge-primary">${Object.keys(arrays1D).length} arreglo(s)</span>
      </div>
    `;

    for (const [name, arr] of Object.entries(arrays1D)) {
      const lastAccess = arr.lastAccess;

      html += `
        <div class="array-block">
          <div class="array-header">
            <span class="array-title">
              <span class="badge-type">${arr.type}</span>
              <strong>${name}[${arr.size}]</strong>
            </span>
            <span class="badge badge-info">${arr.size} posiciones</span>
          </div>

          <div class="array-cells-wrapper">
      `;

      for (let i = 0; i < arr.size; i++) {
        const val = arr.values[i];
        
        const pointingVars = [];
        for (const [varName, varVal] of Object.entries(activePointers)) {
          if (varVal === i) {
            pointingVars.push(varName);
          }
        }

        let accessClass = '';
        if (lastAccess && lastAccess.index === i) {
          accessClass = lastAccess.type === 'write' ? 'cell-written' : 'cell-read';
        }

        html += `
          <div class="array-column">
            <div class="pointer-slot top">
              ${pointingVars.length > 0 ? `
                <div class="pointer-badge" title="Variable(s): ${pointingVars.join(', ')}">
                  <span>${pointingVars.join(', ')}</span>
                  <div class="pointer-arrow">▼</div>
                </div>
              ` : ''}
            </div>

            <div class="array-cell ${accessClass}">
              <span class="cell-val">${val !== undefined ? val : '-'}</span>
            </div>

            <div class="cell-index">[${i}]</div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    html += '</div>';
    this.container.innerHTML = html;
  }
}
