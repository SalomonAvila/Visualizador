// Visualizador de Matrices 2D con Cuadrícula, Coordenadas [fila][columna] y Resaltado Dinámico

export class MatrixView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot || !snapshot.matrices2D || Object.keys(snapshot.matrices2D).length === 0) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'block';
    const { matrices2D, activePointers } = snapshot;
    let html = '<div class="matrices-container visual-section-box">';
    html += `
      <div class="section-title">
        <span>🔲 Matrices Bidimensionales (2D)</span>
        <span class="badge badge-primary">${Object.keys(matrices2D).length} matriz/ces</span>
      </div>
    `;

    for (const [name, mat] of Object.entries(matrices2D)) {
      const lastAccess = mat.lastAccess;

      html += `
        <div class="matrix-block">
          <div class="matrix-header">
            <span class="matrix-title">
              <span class="badge-type">${mat.type}</span>
              <strong>${name}[${mat.rows}][${mat.cols}]</strong>
            </span>
            <span class="badge badge-info">${mat.rows} filas × ${mat.cols} columnas</span>
          </div>

          <div class="matrix-table-wrapper">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="matrix-corner">F \\ C</th>
      `;

      for (let c = 0; c < mat.cols; c++) {
        const colPointers = [];
        for (const [vName, vVal] of Object.entries(activePointers)) {
          if (['c', 'col', 'j', 'columna'].includes(vName.toLowerCase()) && vVal === c) {
            colPointers.push(vName);
          }
        }

        html += `
          <th class="col-header">
            ${colPointers.length > 0 ? `<div class="col-pointer-badge">${colPointers.join(',')} ▼</div>` : ''}
            <span>col [${c}]</span>
          </th>
        `;
      }

      html += `
                </tr>
              </thead>
              <tbody>
      `;

      for (let r = 0; r < mat.rows; r++) {
        const rowPointers = [];
        for (const [vName, vVal] of Object.entries(activePointers)) {
          if (['f', 'fila', 'i', 'row', 'r'].includes(vName.toLowerCase()) && vVal === r) {
            rowPointers.push(vName);
          }
        }

        html += `
          <tr>
            <th class="row-header">
              <span>fila [${r}]</span>
              ${rowPointers.length > 0 ? `<span class="row-pointer-badge">▶ ${rowPointers.join(',')}</span>` : ''}
            </th>
        `;

        for (let c = 0; c < mat.cols; c++) {
          const val = mat.values[r] ? mat.values[r][c] : 0;
          let cellClass = '';

          if (lastAccess && lastAccess.row === r && lastAccess.col === c) {
            cellClass = lastAccess.type === 'write' ? 'cell-written' : 'cell-read';
          }

          html += `
            <td class="matrix-cell ${cellClass}" title="${name}[${r}][${c}] = ${val}">
              <span class="cell-val">${val !== undefined ? val : '-'}</span>
              <span class="cell-coords">${r},${c}</span>
            </td>
          `;
        }

        html += `</tr>`;
      }

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    html += '</div>';
    this.container.innerHTML = html;
  }
}
