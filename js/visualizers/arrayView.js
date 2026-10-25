// Visualizador de Arreglos 1D con Celdas, Índices y Punteros de Variables de Control

export class ArrayView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot || !snapshot.arrays1D || Object.keys(snapshot.arrays1D).length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>No hay arreglos 1D declarados en este paso.</p>
          <small>Declara un arreglo como <code>int arr[5];</code> para visualizarlo.</small>
        </div>
      `;
      return;
    }

    const { arrays1D, activePointers } = snapshot;
    let html = '<div class="arrays-container">';

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
        
        // Punteros activos (ej: i = 2, pos = 2)
        const pointingVars = [];
        for (const [varName, varVal] of Object.entries(activePointers)) {
          if (varVal === i) {
            pointingVars.push(varName);
          }
        }

        // Resaltado de lectura o escritura
        let accessClass = '';
        if (lastAccess && lastAccess.index === i) {
          accessClass = lastAccess.type === 'write' ? 'cell-written' : 'cell-read';
        }

        html += `
          <div class="array-column">
            <!-- Indicador de variable apuntando al índice (ej: i = 2) -->
            <div class="pointer-slot top">
              ${pointingVars.length > 0 ? `
                <div class="pointer-badge" title="Variable(s): ${pointingVars.join(', ')}">
                  <span>${pointingVars.join(', ')}</span>
                  <div class="pointer-arrow">▼</div>
                </div>
              ` : ''}
            </div>

            <!-- Celda de memoria del arreglo -->
            <div class="array-cell ${accessClass}">
              <span class="cell-val">${val !== undefined ? val : '-'}</span>
            </div>

            <!-- Etiqueta de índice [0], [1], etc. -->
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
