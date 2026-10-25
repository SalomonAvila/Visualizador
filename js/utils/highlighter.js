// Resaltador de Sintaxis C++ Ultraligero y Rápido con Guías de Indentación

export class CppHighlighter {
  static highlight(code, activeLine = -1) {
    if (!code) return '';

    const lines = code.split('\n');
    let inMultiComment = false;

    const highlightedLines = lines.map((line, lineIdx) => {
      const lineNum = lineIdx + 1;
      const isCurLine = lineNum === activeLine;

      // 1. Manejo de indentación y guías visuales
      let leadingSpacesCount = 0;
      while (leadingSpacesCount < line.length && line[leadingSpacesCount] === ' ') {
        leadingSpacesCount++;
      }

      const indentLevel = Math.floor(leadingSpacesCount / 4);
      let indentGuidesHtml = '';
      for (let i = 0; i < indentLevel; i++) {
        indentGuidesHtml += '<span class="indent-guide"><span class="guide-pipe">│</span>   </span>';
      }
      const leftoverSpaces = ' '.repeat(leadingSpacesCount % 4);

      // 2. Resaltado de tokens del resto de la línea
      const content = line.substring(leadingSpacesCount);
      let highlightedContent = '';

      if (inMultiComment) {
        const endCommentIdx = content.indexOf('*/');
        if (endCommentIdx !== -1) {
          highlightedContent = `<span class="tok-comment">${this.escape(content.substring(0, endCommentIdx + 2))}</span>` +
            this.highlightLineContent(content.substring(endCommentIdx + 2));
          inMultiComment = false;
        } else {
          highlightedContent = `<span class="tok-comment">${this.escape(content)}</span>`;
        }
      } else {
        const { result, stillInComment } = this.highlightLineContentWithComment(content);
        highlightedContent = result;
        inMultiComment = stillInComment;
      }

      return `<div class="code-line-row ${isCurLine ? 'active-code-line' : ''}">${indentGuidesHtml}${leftoverSpaces}${highlightedContent || '&nbsp;'}</div>`;
    });

    return highlightedLines.join('');
  }

  static highlightLineContentWithComment(content) {
    // Verificar si inicia comentario de una línea
    const singleCommentIdx = content.indexOf('//');
    const multiCommentIdx = content.indexOf('/*');

    if (singleCommentIdx !== -1 && (multiCommentIdx === -1 || singleCommentIdx < multiCommentIdx)) {
      const before = content.substring(0, singleCommentIdx);
      const comment = content.substring(singleCommentIdx);
      return {
        result: this.highlightLineContent(before) + `<span class="tok-comment">${this.escape(comment)}</span>`,
        stillInComment: false
      };
    }

    if (multiCommentIdx !== -1) {
      const before = content.substring(0, multiCommentIdx);
      const after = content.substring(multiCommentIdx + 2);
      const endIdx = after.indexOf('*/');

      if (endIdx !== -1) {
        const comment = '/*' + after.substring(0, endIdx + 2);
        const rest = after.substring(endIdx + 2);
        return {
          result: this.highlightLineContent(before) + `<span class="tok-comment">${this.escape(comment)}</span>` + this.highlightLineContent(rest),
          stillInComment: false
        };
      } else {
        return {
          result: this.highlightLineContent(before) + `<span class="tok-comment">${this.escape('/*' + after)}</span>`,
          stillInComment: true
        };
      }
    }

    return {
      result: this.highlightLineContent(content),
      stillInComment: false
    };
  }

  static highlightLineContent(text) {
    if (!text) return '';

    // Directivas de preprocesador (#include <...>)
    if (text.trim().startsWith('#')) {
      return `<span class="tok-preproc">${this.escape(text)}</span>`;
    }

    // Tokenización por regex de elementos C++
    const tokenRegex = /(".*?"|'.*?'|\b(?:int|float|double|char|bool|void|string|ifstream|ofstream|fstream)\b|\b(?:struct|if|else|while|for|do|break|continue|return|using|namespace|true|false)\b|\b(?:cout|cin|endl|getline|atoi|atol|atof|stoi|stof|is_open|close|eof|c_str|length|size|empty)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*|<<|>>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|(?:\/=)|%=|&&|\|\||[+\-*\/%<>=!&.]|[(){}\[\],;])/g;

    return text.replace(tokenRegex, (match) => {
      // 1. Strings
      if (match.startsWith('"') && match.endsWith('"')) {
        return `<span class="tok-string">${this.escape(match)}</span>`;
      }
      // 2. Chars
      if (match.startsWith("'") && match.endsWith("'")) {
        return `<span class="tok-char">${this.escape(match)}</span>`;
      }
      // 3. Tipos de datos primitivos y streams (Colores distintivos)
      if (/^(?:int|float|double|char|bool|void|string|ifstream|ofstream|fstream)$/.test(match)) {
        return `<span class="tok-type">${match}</span>`;
      }
      // 4. Palabras clave de control
      if (/^(?:struct|if|else|while|for|do|break|continue|return|using|namespace|true|false)$/.test(match)) {
        return `<span class="tok-keyword">${match}</span>`;
      }
      // 5. I/O y funciones estándar del curso
      if (/^(?:cout|cin|endl|getline|atoi|atol|atof|stoi|stof|is_open|close|eof|c_str|length|size|empty)$/.test(match)) {
        return `<span class="tok-builtin">${match}</span>`;
      }
      // 6. Números
      if (/^\d+(?:\.\d+)?$/.test(match)) {
        return `<span class="tok-number">${match}</span>`;
      }
      // 7. Operadores
      if (/^(?:<<|>>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|(?:\/=)|%=|&&|\|\||[+\-*\/%<>=!&.])$/.test(match)) {
        return `<span class="tok-operator">${this.escape(match)}</span>`;
      }
      // 8. Puntuación y llaves
      if (/^[(){}\[\],;]$/.test(match)) {
        return `<span class="tok-punct">${match}</span>`;
      }
      // 9. Identificadores (variables, funciones de usuario)
      return `<span class="tok-ident">${match}</span>`;
    });
  }

  static escape(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
