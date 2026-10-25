// Tokenizador (Lexer) de C++ para nivel introductorio

export const TokenType = {
  // Palabras clave
  KEYWORD: 'KEYWORD',
  TYPE: 'TYPE',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  CHAR: 'CHAR',
  BOOLEAN: 'BOOLEAN',
  
  // Operadores
  OPERATOR: 'OPERATOR',
  
  // Delimitadores
  LPAREN: '(',
  RPAREN: ')',
  LBRACE: '{',
  RBRACE: '}',
  LBRACKET: '[',
  RBRACKET: ']',
  SEMICOLON: ';',
  COMMA: ',',
  DOT: '.',
  
  // Fin de archivo
  EOF: 'EOF'
};

const KEYWORDS = new Set([
  'struct', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'return',
  'cin', 'cout', 'endl', 'getline', 'atoi', 'atol', 'atof', 'stoi', 'stof',
  'include', 'using', 'namespace', 'std'
]);

const TYPES = new Set([
  'int', 'float', 'double', 'char', 'bool', 'void', 'string',
  'ifstream', 'ofstream', 'fstream'
]);

export class Token {
  constructor(type, value, line, col) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.col = col;
  }
}

export class Lexer {
  constructor(source) {
    this.source = source;
    this.cursor = 0;
    this.line = 1;
    this.col = 1;
    this.tokens = [];
  }

  tokenize() {
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor];

      // Espacios en blanco y saltos de línea
      if (char === '\n') {
        this.line++;
        this.col = 1;
        this.cursor++;
        continue;
      }
      if (/\s/.test(char)) {
        this.col++;
        this.cursor++;
        continue;
      }

      // Comentarios de una línea //
      if (char === '/' && this.source[this.cursor + 1] === '/') {
        this.cursor += 2;
        while (this.cursor < this.source.length && this.source[this.cursor] !== '\n') {
          this.cursor++;
        }
        continue;
      }

      // Comentarios multilínea /* ... */
      if (char === '/' && this.source[this.cursor + 1] === '*') {
        this.cursor += 2;
        while (this.cursor < this.source.length && !(this.source[this.cursor] === '*' && this.source[this.cursor + 1] === '/')) {
          if (this.source[this.cursor] === '\n') {
            this.line++;
            this.col = 1;
          } else {
            this.col++;
          }
          this.cursor++;
        }
        if (this.cursor < this.source.length) {
          this.cursor += 2;
          this.col += 2;
        }
        continue;
      }

      // Directivas del preprocesador (#include <...>)
      if (char === '#') {
        const startLine = this.line;
        const startCol = this.col;
        this.cursor++;
        this.col++;
        let directive = '';
        while (this.cursor < this.source.length && this.source[this.cursor] !== '\n') {
          directive += this.source[this.cursor];
          this.cursor++;
          this.col++;
        }
        // Registramos una directiva de preprocesador como token especial informativo
        this.tokens.push(new Token(TokenType.KEYWORD, '#' + directive.trim(), startLine, startCol));
        continue;
      }

      // Cadenas de texto "..."
      if (char === '"') {
        this.tokens.push(this.readString());
        continue;
      }

      // Caracteres 'c'
      if (char === "'") {
        this.tokens.push(this.readChar());
        continue;
      }

      // Números (enteros y decimales)
      if (/\d/.test(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Identificadores y palabras clave
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Operadores multi-carácter
      const nextChar = this.source[this.cursor + 1];
      const twoChar = char + nextChar;

      if (['++', '--', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '+=', '-=', '*=', '/=', '%='].includes(twoChar)) {
        this.tokens.push(new Token(TokenType.OPERATOR, twoChar, this.line, this.col));
        this.cursor += 2;
        this.col += 2;
        continue;
      }

      // Delimitadores y operadores de 1 carácter
      const singleDelims = {
        '(': TokenType.LPAREN,
        ')': TokenType.RPAREN,
        '{': TokenType.LBRACE,
        '}': TokenType.RBRACE,
        '[': TokenType.LBRACKET,
        ']': TokenType.RBRACKET,
        ';': TokenType.SEMICOLON,
        ',': TokenType.COMMA,
        '.': TokenType.DOT
      };

      if (singleDelims[char]) {
        this.tokens.push(new Token(singleDelims[char], char, this.line, this.col));
        this.cursor++;
        this.col++;
        continue;
      }

      if (['+', '-', '*', '/', '%', '<', '>', '=', '!', '&'].includes(char)) {
        this.tokens.push(new Token(TokenType.OPERATOR, char, this.line, this.col));
        this.cursor++;
        this.col++;
        continue;
      }

      // Si es un carácter no reconocido
      this.cursor++;
      this.col++;
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.col));
    return this.tokens;
  }

  readString() {
    const startLine = this.line;
    const startCol = this.col;
    this.cursor++; // saltar comilla inicial
    this.col++;
    let str = '';
    while (this.cursor < this.source.length && this.source[this.cursor] !== '"') {
      if (this.source[this.cursor] === '\\') {
        this.cursor++;
        this.col++;
        const esc = this.source[this.cursor];
        if (esc === 'n') str += '\n';
        else if (esc === 't') str += '\t';
        else if (esc === '"') str += '"';
        else if (esc === '\\') str += '\\';
        else str += esc;
      } else {
        str += this.source[this.cursor];
      }
      this.cursor++;
      this.col++;
    }
    if (this.cursor < this.source.length) {
      this.cursor++; // saltar comilla final
      this.col++;
    }
    return new Token(TokenType.STRING, str, startLine, startCol);
  }

  readChar() {
    const startLine = this.line;
    const startCol = this.col;
    this.cursor++; // saltar comilla
    this.col++;
    let charVal = '';
    if (this.source[this.cursor] === '\\') {
      this.cursor++;
      this.col++;
      const esc = this.source[this.cursor];
      if (esc === 'n') charVal = '\n';
      else if (esc === 't') charVal = '\t';
      else charVal = esc;
    } else {
      charVal = this.source[this.cursor];
    }
    this.cursor++;
    this.col++;
    if (this.cursor < this.source.length && this.source[this.cursor] === "'") {
      this.cursor++;
      this.col++;
    }
    return new Token(TokenType.CHAR, charVal, startLine, startCol);
  }

  readNumber() {
    const startLine = this.line;
    const startCol = this.col;
    let numStr = '';
    let isFloat = false;

    while (this.cursor < this.source.length) {
      const c = this.source[this.cursor];
      if (/\d/.test(c)) {
        numStr += c;
        this.cursor++;
        this.col++;
      } else if (c === '.' && !isFloat && /\d/.test(this.source[this.cursor + 1])) {
        isFloat = true;
        numStr += c;
        this.cursor++;
        this.col++;
      } else {
        break;
      }
    }

    const value = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
    return new Token(TokenType.NUMBER, value, startLine, startCol);
  }

  readIdentifier() {
    const startLine = this.line;
    const startCol = this.col;
    let ident = '';

    while (this.cursor < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.cursor])) {
      ident += this.source[this.cursor];
      this.cursor++;
      this.col++;
    }

    if (ident === 'true' || ident === 'false') {
      return new Token(TokenType.BOOLEAN, ident === 'true', startLine, startCol);
    }
    if (TYPES.has(ident)) {
      return new Token(TokenType.TYPE, ident, startLine, startCol);
    }
    if (KEYWORDS.has(ident)) {
      return new Token(TokenType.KEYWORD, ident, startLine, startCol);
    }
    return new Token(TokenType.IDENTIFIER, ident, startLine, startCol);
  }
}
