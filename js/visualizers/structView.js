// Visualizador de Structs e Instancias de Arreglos de Estructuras

export class StructView {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(snapshot) {
    if (!snapshot || !snapshot.structs || Object.keys(snapshot.structs).length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>No hay estructuras (<code>struct</code>) declaradas en este paso.</p>
          <small>Define y declara un struct como <code>struct Alumno { ... }; Alumno a;</code> para visualizarlo.</small>
        </div>
      `;
      return;
    }

    const { structs, activePointers } = snapshot;
    let html = '<div class="structs-container">';

    for (const [name, st] of Object.entries(structs)) {
      if (st.isArray) {
        // Arreglo de estructuras: Alumno lista[3];
        html += `
          <div class="struct-block">
            <div class="struct-header">
              <span class="struct-title">
                <span class="badge-type">struct ${st.typeName}</span>
                <strong>${name}[${st.items.length}]</strong>
                <span class="badge badge-info">Arreglo de Registros</span>
              </span>
            </div>

            <div class="struct-array-cards">
        `;

        for (let i = 0; i < st.items.length; i++) {
          const item = st.items[i];
          const pointingVars = [];
          for (const [vName, vVal] of Object.entries(activePointers)) {
            if (vVal === i) pointingVars.push(vName);
          }

          html += `
            <div class="struct-card">
              <div class="struct-card-header">
                <span class="struct-card-index">${name}[${i}]</span>
                ${pointingVars.length > 0 ? `<span class="pointer-badge-small">▼ ${pointingVars.join(',')}</span>` : ''}
              </div>
              <div class="struct-fields-table">
          `;

          for (const [fieldName, fieldVal] of Object.entries(item)) {
            html += `
              <div class="struct-field-row">
                <span class="field-key">.${fieldName}:</span>
                <span class="field-val">${this.formatVal(fieldVal)}</span>
              </div>
            `;
          }

          html += `
              </div>
            </div>
          `;
        }

        html += `
            </div>
          </div>
        `;
      } else {
        // Estructura individual: Alumno a;
        html += `
          <div class="struct-block">
            <div class="struct-header">
              <span class="struct-title">
                <span class="badge-type">struct ${st.typeName}</span>
                <strong>${name}</strong>
              </span>
            </div>

            <div class="struct-card single-struct-card">
              <div class="struct-fields-table">
        `;

        for (const [fieldName, fieldVal] of Object.entries(st.fields)) {
          html += `
            <div class="struct-field-row">
              <span class="field-key">.${fieldName}:</span>
              <span class="field-val">${this.formatVal(fieldVal)}</span>
            </div>
          `;
        }

        html += `
              </div>
            </div>
          </div>
        `;
      }
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  formatVal(val) {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (val === null || val === undefined) return '-';
    return String(val);
  }
}
