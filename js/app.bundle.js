(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // js/app.js
  var exports_app = {};
  __export(exports_app, {
    App: () => App
  });

  // js/interpreter/lexer.js
  var TokenType = {
    KEYWORD: "KEYWORD",
    TYPE: "TYPE",
    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    STRING: "STRING",
    CHAR: "CHAR",
    BOOLEAN: "BOOLEAN",
    OPERATOR: "OPERATOR",
    LPAREN: "(",
    RPAREN: ")",
    LBRACE: "{",
    RBRACE: "}",
    LBRACKET: "[",
    RBRACKET: "]",
    SEMICOLON: ";",
    COMMA: ",",
    DOT: ".",
    EOF: "EOF"
  };
  var KEYWORDS = new Set([
    "struct",
    "if",
    "else",
    "while",
    "for",
    "do",
    "break",
    "continue",
    "return",
    "cin",
    "cout",
    "endl",
    "getline",
    "atoi",
    "atol",
    "atof",
    "stoi",
    "stof",
    "include",
    "using",
    "namespace",
    "std"
  ]);
  var TYPES = new Set([
    "int",
    "float",
    "double",
    "char",
    "bool",
    "void",
    "string",
    "ifstream",
    "ofstream",
    "fstream"
  ]);

  class Token {
    constructor(type, value, line, col) {
      this.type = type;
      this.value = value;
      this.line = line;
      this.col = col;
    }
  }

  class Lexer {
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
        if (char === `
`) {
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
        if (char === "/" && this.source[this.cursor + 1] === "/") {
          this.cursor += 2;
          while (this.cursor < this.source.length && this.source[this.cursor] !== `
`) {
            this.cursor++;
          }
          continue;
        }
        if (char === "/" && this.source[this.cursor + 1] === "*") {
          this.cursor += 2;
          while (this.cursor < this.source.length && !(this.source[this.cursor] === "*" && this.source[this.cursor + 1] === "/")) {
            if (this.source[this.cursor] === `
`) {
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
        if (char === "#") {
          const startLine = this.line;
          const startCol = this.col;
          this.cursor++;
          this.col++;
          let directive = "";
          while (this.cursor < this.source.length && this.source[this.cursor] !== `
`) {
            directive += this.source[this.cursor];
            this.cursor++;
            this.col++;
          }
          this.tokens.push(new Token(TokenType.KEYWORD, "#" + directive.trim(), startLine, startCol));
          continue;
        }
        if (char === '"') {
          this.tokens.push(this.readString());
          continue;
        }
        if (char === "'") {
          this.tokens.push(this.readChar());
          continue;
        }
        if (/\d/.test(char)) {
          this.tokens.push(this.readNumber());
          continue;
        }
        if (/[a-zA-Z_]/.test(char)) {
          this.tokens.push(this.readIdentifier());
          continue;
        }
        const nextChar = this.source[this.cursor + 1];
        const twoChar = char + nextChar;
        if (["++", "--", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>", "+=", "-=", "*=", "/=", "%="].includes(twoChar)) {
          this.tokens.push(new Token(TokenType.OPERATOR, twoChar, this.line, this.col));
          this.cursor += 2;
          this.col += 2;
          continue;
        }
        const singleDelims = {
          "(": TokenType.LPAREN,
          ")": TokenType.RPAREN,
          "{": TokenType.LBRACE,
          "}": TokenType.RBRACE,
          "[": TokenType.LBRACKET,
          "]": TokenType.RBRACKET,
          ";": TokenType.SEMICOLON,
          ",": TokenType.COMMA,
          ".": TokenType.DOT
        };
        if (singleDelims[char]) {
          this.tokens.push(new Token(singleDelims[char], char, this.line, this.col));
          this.cursor++;
          this.col++;
          continue;
        }
        if (["+", "-", "*", "/", "%", "<", ">", "=", "!", "&"].includes(char)) {
          this.tokens.push(new Token(TokenType.OPERATOR, char, this.line, this.col));
          this.cursor++;
          this.col++;
          continue;
        }
        this.cursor++;
        this.col++;
      }
      this.tokens.push(new Token(TokenType.EOF, "", this.line, this.col));
      return this.tokens;
    }
    readString() {
      const startLine = this.line;
      const startCol = this.col;
      this.cursor++;
      this.col++;
      let str = "";
      while (this.cursor < this.source.length && this.source[this.cursor] !== '"') {
        if (this.source[this.cursor] === "\\") {
          this.cursor++;
          this.col++;
          const esc = this.source[this.cursor];
          if (esc === "n")
            str += `
`;
          else if (esc === "t")
            str += "\t";
          else if (esc === '"')
            str += '"';
          else if (esc === "\\")
            str += "\\";
          else
            str += esc;
        } else {
          str += this.source[this.cursor];
        }
        this.cursor++;
        this.col++;
      }
      if (this.cursor < this.source.length) {
        this.cursor++;
        this.col++;
      }
      return new Token(TokenType.STRING, str, startLine, startCol);
    }
    readChar() {
      const startLine = this.line;
      const startCol = this.col;
      this.cursor++;
      this.col++;
      let charVal = "";
      if (this.source[this.cursor] === "\\") {
        this.cursor++;
        this.col++;
        const esc = this.source[this.cursor];
        if (esc === "n")
          charVal = `
`;
        else if (esc === "t")
          charVal = "\t";
        else
          charVal = esc;
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
      let numStr = "";
      let isFloat = false;
      while (this.cursor < this.source.length) {
        const c = this.source[this.cursor];
        if (/\d/.test(c)) {
          numStr += c;
          this.cursor++;
          this.col++;
        } else if (c === "." && !isFloat && /\d/.test(this.source[this.cursor + 1])) {
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
      let ident = "";
      while (this.cursor < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.cursor])) {
        ident += this.source[this.cursor];
        this.cursor++;
        this.col++;
      }
      if (ident === "true" || ident === "false") {
        return new Token(TokenType.BOOLEAN, ident === "true", startLine, startCol);
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

  // js/interpreter/parser.js
  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.pos = 0;
      this.customTypes = new Set;
    }
    current() {
      return this.tokens[this.pos] || { type: TokenType.EOF, value: "", line: 0, col: 0 };
    }
    peek(offset = 1) {
      return this.tokens[this.pos + offset] || { type: TokenType.EOF, value: "", line: 0, col: 0 };
    }
    match(...expected) {
      const cur = this.current();
      for (const exp of expected) {
        if (typeof exp === "string") {
          if (cur.value === exp || cur.type === exp) {
            this.pos++;
            return cur;
          }
        }
      }
      return null;
    }
    expect(valOrType, msg) {
      const cur = this.current();
      if (cur.value === valOrType || cur.type === valOrType) {
        this.pos++;
        return cur;
      }
      throw new Error(`Línea ${cur.line}: ${msg || `Se esperaba '${valOrType}', pero se encontró '${cur.value}'`}`);
    }
    isType(token) {
      if (!token)
        return false;
      return token.type === TokenType.TYPE || this.customTypes.has(token.value);
    }
    parseProgram() {
      const program = {
        type: "Program",
        includes: [],
        structs: [],
        functions: [],
        globalStatements: []
      };
      while (this.current().type !== TokenType.EOF) {
        const cur = this.current();
        if (cur.type === TokenType.KEYWORD && cur.value.startsWith("#")) {
          program.includes.push(cur.value);
          this.pos++;
          continue;
        }
        if (cur.value === "using") {
          this.pos++;
          if (this.current().value === "namespace")
            this.pos++;
          if (this.current().value === "std")
            this.pos++;
          this.match(";");
          continue;
        }
        if (cur.value === "struct") {
          const structDef = this.parseStructDefinition();
          program.structs.push(structDef);
          this.customTypes.add(structDef.name);
          continue;
        }
        if (this.isType(cur)) {
          if (this.isFunctionAhead()) {
            const fn = this.parseFunction();
            program.functions.push(fn);
          } else {
            const decl = this.parseDeclaration();
            program.globalStatements.push(decl);
          }
          continue;
        }
        throw new Error(`Línea ${cur.line}: Elemento no reconocido a nivel global: '${cur.value}'`);
      }
      return program;
    }
    isFunctionAhead() {
      let offset = 1;
      if (this.peek(offset).value === "&")
        offset++;
      const nameTok = this.peek(offset);
      if (!nameTok || nameTok.type !== TokenType.IDENTIFIER)
        return false;
      offset++;
      if (this.peek(offset).value !== "(")
        return false;
      let depth = 1;
      offset++;
      while (offset < 100 && this.peek(offset).type !== TokenType.EOF) {
        const tok = this.peek(offset);
        if (tok.value === "(")
          depth++;
        else if (tok.value === ")") {
          depth--;
          if (depth === 0) {
            const afterParen = this.peek(offset + 1);
            return afterParen && afterParen.value === "{";
          }
        }
        offset++;
      }
      return false;
    }
    parseStructDefinition() {
      const startTok = this.expect("struct", "Se esperaba 'struct'");
      const nameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba el nombre de la estructura");
      this.expect("{", "Se esperaba '{' tras nombre del struct");
      const fields = [];
      while (this.current().value !== "}" && this.current().type !== TokenType.EOF) {
        const fieldTypeTok = this.current();
        if (!this.isType(fieldTypeTok)) {
          throw new Error(`Línea ${fieldTypeTok.line}: Tipo inválido en struct '${fieldTypeTok.value}'`);
        }
        this.pos++;
        const fieldNameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre del campo");
        this.expect(";", "Se esperaba ';' al final de la declaración del campo");
        fields.push({
          type: fieldTypeTok.value,
          name: fieldNameTok.value,
          line: fieldNameTok.line
        });
      }
      this.expect("}", "Se esperaba '}' cerrando el struct");
      this.expect(";", "Se esperaba ';' después de la definición del struct");
      return {
        type: "StructDefinition",
        name: nameTok.value,
        fields,
        line: startTok.line
      };
    }
    parseFunction() {
      const returnTypeTok = this.current();
      this.pos++;
      const nameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre de función");
      this.expect("(", "Se esperaba '(' tras nombre de función");
      const params = [];
      if (this.current().value !== ")") {
        while (true) {
          const paramTypeTok = this.current();
          if (!this.isType(paramTypeTok)) {
            throw new Error(`Línea ${paramTypeTok.line}: Tipo de parámetro inválido '${paramTypeTok.value}'`);
          }
          this.pos++;
          let isRef = false;
          if (this.current().value === "&") {
            isRef = true;
            this.pos++;
          }
          const paramNameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre de parámetro");
          let isArray = false;
          if (this.current().value === "[") {
            this.pos++;
            this.expect("]", "Se esperaba ']'");
            isArray = true;
          }
          params.push({
            type: paramTypeTok.value,
            name: paramNameTok.value,
            isRef,
            isArray,
            line: paramNameTok.line
          });
          if (this.current().value === ",") {
            this.pos++;
          } else {
            break;
          }
        }
      }
      this.expect(")", "Se esperaba ')' cerrando parámetros");
      const body = this.parseBlock();
      return {
        type: "FunctionDefinition",
        returnType: returnTypeTok.value,
        name: nameTok.value,
        params,
        body,
        line: nameTok.line
      };
    }
    parseBlock() {
      this.expect("{", "Se esperaba '{' para iniciar bloque");
      const statements = [];
      while (this.current().value !== "}" && this.current().type !== TokenType.EOF) {
        statements.push(this.parseStatement());
      }
      this.expect("}", "Se esperaba '}' para cerrar bloque");
      return {
        type: "Block",
        statements
      };
    }
    parseStatement() {
      const cur = this.current();
      if (cur.value === "{") {
        return this.parseBlock();
      }
      if (cur.value === "if") {
        return this.parseIfStatement();
      }
      if (cur.value === "while") {
        return this.parseWhileStatement();
      }
      if (cur.value === "do") {
        return this.parseDoWhileStatement();
      }
      if (cur.value === "for") {
        return this.parseForStatement();
      }
      if (cur.value === "return") {
        const line = cur.line;
        this.pos++;
        let expr = null;
        if (this.current().value !== ";") {
          expr = this.parseExpression();
        }
        this.expect(";", "Se esperaba ';' al final de return");
        return { type: "ReturnStatement", expr, line };
      }
      if (cur.value === "break") {
        const line = cur.line;
        this.pos++;
        this.expect(";", "Se esperaba ';' después de break");
        return { type: "BreakStatement", line };
      }
      if (cur.value === "continue") {
        const line = cur.line;
        this.pos++;
        this.expect(";", "Se esperaba ';' después de continue");
        return { type: "ContinueStatement", line };
      }
      if (cur.value === "cout") {
        return this.parseCoutStatement();
      }
      if (cur.value === "cin") {
        return this.parseCinStatement();
      }
      if (cur.type === TokenType.IDENTIFIER && this.peek(1).value === "<<") {
        return this.parseFileStreamStatement();
      }
      if (this.isType(cur)) {
        return this.parseDeclaration();
      }
      const expr = this.parseExpression();
      this.expect(";", "Se esperaba ';' después de la expresión");
      return {
        type: "ExpressionStatement",
        expression: expr,
        line: cur.line
      };
    }
    parseIfStatement() {
      const ifTok = this.expect("if");
      this.expect("(", "Se esperaba '(' tras if");
      const condition = this.parseExpression();
      this.expect(")", "Se esperaba ')' tras condición de if");
      let consequent;
      if (this.current().value === "{") {
        consequent = this.parseBlock();
      } else {
        consequent = { type: "Block", statements: [this.parseStatement()] };
      }
      let alternate = null;
      if (this.current().value === "else") {
        this.pos++;
        if (this.current().value === "if") {
          alternate = this.parseIfStatement();
        } else if (this.current().value === "{") {
          alternate = this.parseBlock();
        } else {
          alternate = { type: "Block", statements: [this.parseStatement()] };
        }
      }
      return {
        type: "IfStatement",
        condition,
        consequent,
        alternate,
        line: ifTok.line
      };
    }
    parseWhileStatement() {
      const whileTok = this.expect("while");
      this.expect("(", "Se esperaba '(' tras while");
      const condition = this.parseExpression();
      this.expect(")", "Se esperaba ')' tras condición de while");
      let body;
      if (this.current().value === "{") {
        body = this.parseBlock();
      } else {
        body = { type: "Block", statements: [this.parseStatement()] };
      }
      return {
        type: "WhileStatement",
        condition,
        body,
        line: whileTok.line
      };
    }
    parseDoWhileStatement() {
      const doTok = this.expect("do");
      let body;
      if (this.current().value === "{") {
        body = this.parseBlock();
      } else {
        body = { type: "Block", statements: [this.parseStatement()] };
      }
      this.expect("while", "Se esperaba 'while' tras bloque 'do'");
      this.expect("(", "Se esperaba '('");
      const condition = this.parseExpression();
      this.expect(")", "Se esperaba ')'");
      this.expect(";", "Se esperaba ';' al final de 'do-while'");
      return {
        type: "DoWhileStatement",
        condition,
        body,
        line: doTok.line
      };
    }
    parseForStatement() {
      const forTok = this.expect("for");
      this.expect("(", "Se esperaba '(' tras for");
      let init = null;
      if (this.current().value === ";") {
        this.pos++;
      } else if (this.isType(this.current())) {
        init = this.parseDeclaration();
      } else {
        init = this.parseExpression();
        this.expect(";", "Se esperaba ';' tras init de for");
      }
      let condition = null;
      if (this.current().value !== ";") {
        condition = this.parseExpression();
      }
      this.expect(";", "Se esperaba ';' tras condición de for");
      let update = null;
      if (this.current().value !== ")") {
        update = this.parseExpression();
      }
      this.expect(")", "Se esperaba ')' tras cláusula de for");
      let body;
      if (this.current().value === "{") {
        body = this.parseBlock();
      } else {
        body = { type: "Block", statements: [this.parseStatement()] };
      }
      return {
        type: "ForStatement",
        init,
        condition,
        update,
        body,
        line: forTok.line
      };
    }
    parseCoutStatement() {
      const coutTok = this.expect("cout");
      const elements = [];
      while (this.current().value === "<<") {
        this.pos++;
        if (this.current().value === "endl") {
          elements.push({ type: "Endl", line: this.current().line });
          this.pos++;
        } else {
          elements.push(this.parseShift());
        }
      }
      this.expect(";", "Se esperaba ';' al final de cout");
      return {
        type: "CoutStatement",
        elements,
        line: coutTok.line
      };
    }
    parseFileStreamStatement() {
      const streamNameTok = this.expect(TokenType.IDENTIFIER);
      const elements = [];
      while (this.current().value === "<<") {
        this.pos++;
        if (this.current().value === "endl") {
          elements.push({ type: "Endl", line: this.current().line });
          this.pos++;
        } else {
          elements.push(this.parseShift());
        }
      }
      this.expect(";", "Se esperaba ';' al final de la escritura en archivo");
      return {
        type: "FileStreamStatement",
        streamName: streamNameTok.value,
        elements,
        line: streamNameTok.line
      };
    }
    parseCinStatement() {
      const cinTok = this.expect("cin");
      const targets = [];
      while (this.current().value === ">>") {
        this.pos++;
        targets.push(this.parseTargetExpression());
      }
      this.expect(";", "Se esperaba ';' al final de cin");
      return {
        type: "CinStatement",
        targets,
        line: cinTok.line
      };
    }
    parseDeclaration() {
      const typeTok = this.current();
      this.pos++;
      const variables = [];
      while (true) {
        const nameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre de variable");
        let dims = [];
        while (this.current().value === "[") {
          this.pos++;
          let dimSizeExpr = null;
          if (this.current().value !== "]") {
            dimSizeExpr = this.parseExpression();
          }
          this.expect("]", "Se esperaba ']'");
          dims.push(dimSizeExpr);
        }
        let initializer = null;
        let fileInitArg = null;
        if (["ifstream", "ofstream", "fstream"].includes(typeTok.value) && this.current().value === "(") {
          this.pos++;
          fileInitArg = this.parseExpression();
          this.expect(")", "Se esperaba ')'");
        } else if (this.current().value === "=") {
          this.pos++;
          if (this.current().value === "{") {
            initializer = this.parseListInitializer();
          } else {
            initializer = this.parseExpression();
          }
        }
        variables.push({
          type: typeTok.value,
          name: nameTok.value,
          dims,
          initializer,
          fileInitArg,
          line: nameTok.line
        });
        if (this.current().value === ",") {
          this.pos++;
        } else {
          break;
        }
      }
      this.expect(";", "Se esperaba ';' al final de la declaración");
      return {
        type: "VariableDeclaration",
        varType: typeTok.value,
        variables,
        line: typeTok.line
      };
    }
    parseListInitializer() {
      this.expect("{");
      const items = [];
      while (this.current().value !== "}" && this.current().type !== TokenType.EOF) {
        if (this.current().value === "{") {
          items.push(this.parseListInitializer());
        } else {
          items.push(this.parseExpression());
        }
        if (this.current().value === ",") {
          this.pos++;
        } else {
          break;
        }
      }
      this.expect("}");
      return {
        type: "ListInitializer",
        items
      };
    }
    parseExpression() {
      return this.parseAssignment();
    }
    parseAssignment() {
      const left = this.parseLogicalOr();
      const cur = this.current();
      if (["=", "+=", "-=", "*=", "/=", "%="].includes(cur.value)) {
        const op = cur.value;
        this.pos++;
        const right = this.parseAssignment();
        return {
          type: "AssignmentExpression",
          operator: op,
          left,
          right,
          line: cur.line
        };
      }
      return left;
    }
    parseLogicalOr() {
      let left = this.parseLogicalAnd();
      while (this.current().value === "||") {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseLogicalAnd();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseLogicalAnd() {
      let left = this.parseEquality();
      while (this.current().value === "&&") {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseEquality();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseEquality() {
      let left = this.parseRelational();
      while (["==", "!="].includes(this.current().value)) {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseRelational();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseRelational() {
      let left = this.parseShift();
      while (["<", "<=", ">", ">="].includes(this.current().value)) {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseShift();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseShift() {
      let left = this.parseAdditive();
      return left;
    }
    parseAdditive() {
      let left = this.parseMultiplicative();
      while (["+", "-"].includes(this.current().value)) {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseMultiplicative();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseMultiplicative() {
      let left = this.parseUnary();
      while (["*", "/", "%"].includes(this.current().value)) {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        const right = this.parseUnary();
        left = { type: "BinaryExpression", operator: op, left, right, line };
      }
      return left;
    }
    parseUnary() {
      const cur = this.current();
      if (["!", "-", "+", "++", "--"].includes(cur.value)) {
        this.pos++;
        const argument = this.parseUnary();
        return {
          type: "UnaryExpression",
          operator: cur.value,
          prefix: true,
          argument,
          line: cur.line
        };
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let expr = this.parsePrimary();
      while (true) {
        if (this.current().value === "[") {
          this.pos++;
          const indexExpr = this.parseExpression();
          this.expect("]", "Se esperaba ']' tras índice");
          expr = {
            type: "IndexAccess",
            object: expr,
            index: indexExpr,
            line: expr.line
          };
          continue;
        }
        if (this.current().value === ".") {
          this.pos++;
          const memberTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre del campo tras '.'");
          expr = {
            type: "MemberAccess",
            object: expr,
            member: memberTok.value,
            line: memberTok.line
          };
          continue;
        }
        if (this.current().value === "(") {
          this.pos++;
          const args = [];
          if (this.current().value !== ")") {
            while (true) {
              args.push(this.parseExpression());
              if (this.current().value === ",") {
                this.pos++;
              } else {
                break;
              }
            }
          }
          this.expect(")", "Se esperaba ')' cerrando argumentos");
          expr = {
            type: "CallExpression",
            callee: expr,
            args,
            line: expr.line
          };
          continue;
        }
        if (["++", "--"].includes(this.current().value)) {
          const op = this.current().value;
          const line = this.current().line;
          this.pos++;
          expr = {
            type: "UnaryExpression",
            operator: op,
            prefix: false,
            argument: expr,
            line
          };
          continue;
        }
        break;
      }
      return expr;
    }
    parsePrimary() {
      const cur = this.current();
      if (cur.value === "(") {
        this.pos++;
        const expr = this.parseExpression();
        this.expect(")", "Se esperaba ')' tras expresión");
        return expr;
      }
      if (cur.type === TokenType.NUMBER) {
        this.pos++;
        return { type: "Literal", value: cur.value, rawType: "number", line: cur.line };
      }
      if (cur.type === TokenType.STRING) {
        this.pos++;
        return { type: "Literal", value: cur.value, rawType: "string", line: cur.line };
      }
      if (cur.type === TokenType.CHAR) {
        this.pos++;
        return { type: "Literal", value: cur.value, rawType: "char", line: cur.line };
      }
      if (cur.type === TokenType.BOOLEAN) {
        this.pos++;
        return { type: "Literal", value: cur.value, rawType: "bool", line: cur.line };
      }
      if (["getline", "atoi", "atol", "atof", "stoi", "stof"].includes(cur.value)) {
        const funcName = cur.value;
        const line = cur.line;
        this.pos++;
        this.expect("(", `Se esperaba '(' tras ${funcName}`);
        const args = [];
        if (this.current().value !== ")") {
          while (true) {
            args.push(this.parseExpression());
            if (this.current().value === ",") {
              this.pos++;
            } else {
              break;
            }
          }
        }
        this.expect(")", `Se esperaba ')' tras argumentos de ${funcName}`);
        return {
          type: "BuiltinCall",
          name: funcName,
          args,
          line
        };
      }
      if (cur.type === TokenType.IDENTIFIER) {
        this.pos++;
        return {
          type: "Identifier",
          name: cur.value,
          line: cur.line
        };
      }
      throw new Error(`Línea ${cur.line}: Expresión no esperada: '${cur.value}'`);
    }
    parseTargetExpression() {
      return this.parsePostfix();
    }
  }

  // js/interpreter/vfs.js
  class VirtualFileSystem {
    constructor() {
      this.files = new Map;
      this.openHandles = new Map;
      this.handleCounter = 1;
      this.initDefaultFiles();
    }
    initDefaultFiles() {
      this.files.set("estudiantes.csv", `Carlos Gomez,19,85
Maria Rodriguez,20,92
Juan Perez,18,78
Ana Fernandez,21,95
Luis Torres,19,88`);
      this.files.set("numeros.txt", `10,25,30,45
12,55,70,90
8,14,33,60`);
      this.files.set("matriz_datos.txt", `5,8,12
3,9,15
7,4,11`);
    }
    reset() {
      this.openHandles.clear();
      this.handleCounter = 1;
    }
    getFile(filename) {
      return this.files.get(filename) ?? null;
    }
    setFile(filename, content) {
      this.files.set(filename, content);
    }
    listFiles() {
      return Array.from(this.files.keys());
    }
    open(filename, mode = "in") {
      const handleId = `stream_${this.handleCounter++}`;
      let content = "";
      if (mode === "in") {
        content = this.files.get(filename) ?? "";
      } else {
        content = "";
        this.files.set(filename, "");
      }
      const handle = {
        id: handleId,
        filename,
        mode,
        cursor: 0,
        content,
        isOpen: mode === "in" ? this.files.has(filename) : true,
        lastToken: "",
        lastLine: "",
        eof: false
      };
      this.openHandles.set(handleId, handle);
      return handle;
    }
    close(handleId) {
      const handle = this.openHandles.get(handleId);
      if (handle) {
        handle.isOpen = false;
        this.openHandles.delete(handleId);
      }
    }
    getline(handleId, delimiter = `
`) {
      const handle = this.openHandles.get(handleId);
      if (!handle || !handle.isOpen) {
        return { success: false, value: "", eof: true };
      }
      if (handle.cursor >= handle.content.length) {
        handle.eof = true;
        return { success: false, value: "", eof: true };
      }
      let token = "";
      let startCursor = handle.cursor;
      while (handle.cursor < handle.content.length) {
        const char = handle.content[handle.cursor];
        handle.cursor++;
        if (char === delimiter) {
          break;
        }
        if (delimiter !== `
` && char === `
`) {
          break;
        }
        if (char !== "\r") {
          token += char;
        }
      }
      handle.lastToken = token;
      if (handle.cursor >= handle.content.length && token === "") {
        handle.eof = true;
      }
      return {
        success: true,
        value: token,
        startCursor,
        endCursor: handle.cursor,
        eof: handle.cursor >= handle.content.length
      };
    }
    write(handleId, text) {
      const handle = this.openHandles.get(handleId);
      if (!handle || !handle.isOpen || handle.mode !== "out")
        return false;
      handle.content += text;
      this.files.set(handle.filename, handle.content);
      return true;
    }
    getSnapshot() {
      const openFiles = [];
      for (const [id, handle] of this.openHandles.entries()) {
        openFiles.push({
          id,
          filename: handle.filename,
          mode: handle.mode,
          cursor: handle.cursor,
          content: handle.content,
          lastToken: handle.lastToken,
          eof: handle.eof,
          isOpen: handle.isOpen
        });
      }
      const allFiles = {};
      for (const [name, content] of this.files.entries()) {
        allFiles[name] = content;
      }
      return {
        openFiles,
        allFiles
      };
    }
  }

  // js/interpreter/runtime.js
  class ExecutionContext {
    constructor(vfs, stdinInput = "") {
      this.vfs = vfs;
      this.stdinInput = stdinInput;
      this.stdinTokens = stdinInput.trim().split(/\s+/).filter(Boolean);
      this.stdinIndex = 0;
      this.stdout = "";
      this.structDefs = new Map;
      this.functions = new Map;
      this.callStack = [];
      this.globalFrame = this.createFrame("<global>");
      this.callStack.push(this.globalFrame);
      this.snapshots = [];
      this.maxSteps = 1500;
      this.stepCount = 0;
      this.terminated = false;
    }
    createFrame(functionName) {
      return {
        functionName,
        variables: {},
        arrays1D: {},
        matrices2D: {},
        structs: {},
        streams: {},
        activePointers: {},
        lastArrayAccess: null,
        lastMatrixAccess: null,
        lastStructAccess: null
      };
    }
    currentFrame() {
      return this.callStack[this.callStack.length - 1];
    }
    recordSnapshot(line, action, description) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) {
        this.terminated = true;
        throw new Error(`Límite de ejecución alcanzado (${this.maxSteps} pasos). Verifica que tus ciclos 'for' o 'while' tengan una condición de terminación correcta.`);
      }
      const curFrame = this.currentFrame();
      const stackCopy = this.callStack.map((frame) => ({
        functionName: frame.functionName,
        variables: { ...frame.variables }
      }));
      const arrays1DCopy = {};
      for (const frame of this.callStack) {
        for (const [name, arr] of Object.entries(frame.arrays1D)) {
          arrays1DCopy[name] = {
            type: arr.type,
            size: arr.size,
            values: [...arr.values],
            lastAccess: frame.lastArrayAccess?.name === name ? { ...frame.lastArrayAccess } : null
          };
        }
      }
      const matrices2DCopy = {};
      for (const frame of this.callStack) {
        for (const [name, mat] of Object.entries(frame.matrices2D)) {
          matrices2DCopy[name] = {
            type: mat.type,
            rows: mat.rows,
            cols: mat.cols,
            values: mat.values.map((row) => [...row]),
            lastAccess: frame.lastMatrixAccess?.name === name ? { ...frame.lastMatrixAccess } : null
          };
        }
      }
      const structsCopy = {};
      for (const frame of this.callStack) {
        for (const [name, st] of Object.entries(frame.structs)) {
          if (st.isArray) {
            structsCopy[name] = {
              typeName: st.typeName,
              isArray: true,
              items: st.items.map((item) => ({ ...item }))
            };
          } else {
            structsCopy[name] = {
              typeName: st.typeName,
              isArray: false,
              fields: { ...st.fields }
            };
          }
        }
      }
      const activePointers = {};
      for (const frame of this.callStack) {
        for (const [varName, val] of Object.entries(frame.variables)) {
          if (typeof val === "number" && Number.isInteger(val)) {
            activePointers[varName] = val;
          }
        }
      }
      this.snapshots.push({
        stepIndex: this.snapshots.length,
        line,
        action,
        description,
        callStack: stackCopy,
        currentFunction: curFrame.functionName,
        variables: { ...curFrame.variables },
        arrays1D: arrays1DCopy,
        matrices2D: matrices2DCopy,
        structs: structsCopy,
        activePointers,
        vfsState: this.vfs.getSnapshot(),
        consoleOutput: this.stdout
      });
    }
  }

  class Runtime {
    constructor(ast, vfs = new VirtualFileSystem, stdinInput = "") {
      this.ast = ast;
      this.vfs = vfs;
      this.ctx = new ExecutionContext(vfs, stdinInput);
    }
    run() {
      try {
        this.vfs.reset();
        this.initProgram();
        this.executeMain();
      } catch (err) {
        this.ctx.recordSnapshot(this.ctx.snapshots.length > 0 ? this.ctx.snapshots[this.ctx.snapshots.length - 1].line : 1, "Error de Ejecución", err.message);
      }
      return this.ctx.snapshots;
    }
    initProgram() {
      for (const structDef of this.ast.structs) {
        this.ctx.structDefs.set(structDef.name, structDef);
      }
      for (const fn of this.ast.functions) {
        this.ctx.functions.set(fn.name, fn);
      }
      for (const stmt of this.ast.globalStatements) {
        this.executeStatement(stmt);
      }
    }
    executeMain() {
      const mainFn = this.ctx.functions.get("main");
      if (!mainFn) {
        throw new Error("No se encontró la función 'main()'. Recuerda definir 'int main() { ... }'.");
      }
      const frame = this.ctx.createFrame("main");
      this.ctx.callStack.push(frame);
      this.ctx.recordSnapshot(mainFn.line, "Inicio de main()", "Iniciando ejecución del programa en la función principal main().");
      this.executeBlock(mainFn.body);
    }
    executeBlock(blockNode) {
      for (const stmt of blockNode.statements) {
        const result = this.executeStatement(stmt);
        if (result && (result.type === "return" || result.type === "break" || result.type === "continue")) {
          return result;
        }
      }
      return null;
    }
    executeStatement(stmt) {
      const frame = this.ctx.currentFrame();
      switch (stmt.type) {
        case "VariableDeclaration":
          return this.executeVariableDeclaration(stmt);
        case "ExpressionStatement": {
          const val = this.evaluateExpression(stmt.expression);
          return null;
        }
        case "CoutStatement":
          return this.executeCout(stmt);
        case "FileStreamStatement":
          return this.executeFileStreamStatement(stmt);
        case "CinStatement":
          return this.executeCin(stmt);
        case "IfStatement":
          return this.executeIf(stmt);
        case "WhileStatement":
          return this.executeWhile(stmt);
        case "DoWhileStatement":
          return this.executeDoWhile(stmt);
        case "ForStatement":
          return this.executeFor(stmt);
        case "ReturnStatement": {
          let returnVal = null;
          if (stmt.expr) {
            returnVal = this.evaluateExpression(stmt.expr);
          }
          this.ctx.recordSnapshot(stmt.line, "Sentencia return", `Finalizando función con valor de retorno: ${returnVal !== null ? returnVal : "void"}.`);
          return { type: "return", value: returnVal };
        }
        case "BreakStatement":
          this.ctx.recordSnapshot(stmt.line, "Sentencia break", "Interrumpiendo ejecución del ciclo con break.");
          return { type: "break" };
        case "ContinueStatement":
          this.ctx.recordSnapshot(stmt.line, "Sentencia continue", "Saltando a la siguiente iteración del ciclo con continue.");
          return { type: "continue" };
        case "Block":
          return this.executeBlock(stmt);
        default:
          return null;
      }
    }
    executeVariableDeclaration(decl) {
      const frame = this.ctx.currentFrame();
      const type = decl.varType;
      for (const v of decl.variables) {
        if (["ifstream", "ofstream", "fstream"].includes(type)) {
          let filename = "";
          if (v.fileInitArg) {
            filename = String(this.evaluateExpression(v.fileInitArg));
          }
          const mode = type === "ofstream" ? "out" : "in";
          const handle = this.ctx.vfs.open(filename, mode);
          frame.streams[v.name] = handle.id;
          this.ctx.recordSnapshot(v.line, `Apertura de archivo (${type})`, `Se creó el flujo de archivo '${v.name}' abriendo el archivo '${filename}' en modo ${mode === "in" ? "lectura (ifstream)" : "escritura (ofstream)"}.`);
          continue;
        }
        if (this.ctx.structDefs.has(type)) {
          const structDef = this.ctx.structDefs.get(type);
          if (v.dims.length === 1) {
            const size = Number(this.evaluateExpression(v.dims[0]));
            const items = [];
            for (let i = 0;i < size; i++) {
              const itemFields = {};
              for (const f of structDef.fields) {
                itemFields[f.name] = this.getDefaultValue(f.type);
              }
              items.push(itemFields);
            }
            frame.structs[v.name] = {
              typeName: type,
              isArray: true,
              items
            };
            this.ctx.recordSnapshot(v.line, "Declaración de arreglo de structs", `Se declaró el arreglo de estructuras '${v.name}[${size}]' de tipo '${type}'. Cada elemento cuenta con los campos: [${structDef.fields.map((f) => f.name).join(", ")}].`);
          } else {
            const fields = {};
            for (const f of structDef.fields) {
              fields[f.name] = this.getDefaultValue(f.type);
            }
            frame.structs[v.name] = {
              typeName: type,
              isArray: false,
              fields
            };
            this.ctx.recordSnapshot(v.line, "Declaración de struct", `Se declaró la variable '${v.name}' de tipo '${type}' con campos: [${structDef.fields.map((f) => f.name).join(", ")}].`);
          }
          continue;
        }
        if (v.dims.length === 1) {
          const size = Number(this.evaluateExpression(v.dims[0]));
          const values = new Array(size).fill(this.getDefaultValue(type));
          if (v.initializer && v.initializer.type === "ListInitializer") {
            for (let i = 0;i < Math.min(size, v.initializer.items.length); i++) {
              values[i] = this.castType(this.evaluateExpression(v.initializer.items[i]), type);
            }
          }
          frame.arrays1D[v.name] = {
            type,
            size,
            values
          };
          this.ctx.recordSnapshot(v.line, "Declaración de arreglo 1D", `Se creó el arreglo 1D '${v.name}[${size}]' de tipo '${type}' con posiciones del 0 al ${size - 1}.`);
          continue;
        }
        if (v.dims.length === 2) {
          const rows = Number(this.evaluateExpression(v.dims[0]));
          const cols = Number(this.evaluateExpression(v.dims[1]));
          const values = [];
          for (let r = 0;r < rows; r++) {
            const rowVals = new Array(cols).fill(this.getDefaultValue(type));
            values.push(rowVals);
          }
          if (v.initializer && v.initializer.type === "ListInitializer") {
            for (let r = 0;r < Math.min(rows, v.initializer.items.length); r++) {
              const rowInit = v.initializer.items[r];
              if (rowInit.type === "ListInitializer") {
                for (let c = 0;c < Math.min(cols, rowInit.items.length); c++) {
                  values[r][c] = this.castType(this.evaluateExpression(rowInit.items[c]), type);
                }
              }
            }
          }
          frame.matrices2D[v.name] = {
            type,
            rows,
            cols,
            values
          };
          this.ctx.recordSnapshot(v.line, "Declaración de matriz 2D", `Se creó la matriz 2D '${v.name}[${rows}][${cols}]' de tipo '${type}' (${rows} filas x ${cols} columnas).`);
          continue;
        }
        let initVal = this.getDefaultValue(type);
        if (v.initializer) {
          initVal = this.castType(this.evaluateExpression(v.initializer), type);
        }
        frame.variables[v.name] = initVal;
        this.ctx.recordSnapshot(v.line, "Declaración de variable", `Se declaró la variable '${v.name}' de tipo '${type}' con valor inicial = ${JSON.stringify(initVal)}.`);
      }
      return null;
    }
    executeCout(stmt) {
      let outputText = "";
      for (const elem of stmt.elements) {
        if (elem.type === "Endl") {
          outputText += `
`;
        } else {
          const val = this.evaluateExpression(elem);
          outputText += String(val);
        }
      }
      this.ctx.stdout += outputText;
      this.ctx.recordSnapshot(stmt.line, "Salida por consola (cout)", `cout imprimió: ${JSON.stringify(outputText).replace(/^"|"$/g, "")}`);
      return null;
    }
    executeFileStreamStatement(stmt) {
      const frame = this.ctx.currentFrame();
      const handleId = frame.streams[stmt.streamName] || this.ctx.globalFrame.streams[stmt.streamName];
      let writtenText = "";
      for (const elem of stmt.elements) {
        if (elem.type === "Endl") {
          writtenText += `
`;
        } else {
          const val = this.evaluateExpression(elem);
          writtenText += String(val);
        }
      }
      this.ctx.vfs.write(handleId, writtenText);
      this.ctx.recordSnapshot(stmt.line, `Escritura en archivo '${stmt.streamName}'`, `Se escribió en el archivo: ${JSON.stringify(writtenText)}.`);
      return null;
    }
    executeCin(stmt) {
      for (const target of stmt.targets) {
        let inputVal = "";
        if (this.ctx.stdinIndex < this.ctx.stdinTokens.length) {
          inputVal = this.ctx.stdinTokens[this.ctx.stdinIndex++];
        }
        this.assignToTarget(target, inputVal, stmt.line);
        this.ctx.recordSnapshot(stmt.line, "Lectura de consola (cin)", `cin leyó el dato '${inputVal}' y lo asignó a la variable.`);
      }
      return null;
    }
    executeIf(stmt) {
      this.ctx.recordSnapshot(stmt.line, "Evaluación de condición if", "Evaluando la condición de la sentencia if.");
      const conditionVal = Boolean(this.evaluateExpression(stmt.condition));
      this.ctx.recordSnapshot(stmt.line, "Resultado de condición if", `La condición evaluó a ${conditionVal ? "VERDADERO (true)" : "FALSO (false)"}.`);
      if (conditionVal) {
        return this.executeStatement(stmt.consequent);
      } else if (stmt.alternate) {
        return this.executeStatement(stmt.alternate);
      }
      return null;
    }
    executeWhile(stmt) {
      while (true) {
        this.ctx.recordSnapshot(stmt.line, "Condición de ciclo while", "Evaluando condición del ciclo while.");
        const cond = Boolean(this.evaluateExpression(stmt.condition));
        this.ctx.recordSnapshot(stmt.line, "Resultado de condición while", `La condición del ciclo es ${cond ? "VERDADERO (continúa el ciclo)" : "FALSO (finaliza el ciclo)"}.`);
        if (!cond)
          break;
        const res = this.executeStatement(stmt.body);
        if (res) {
          if (res.type === "break")
            break;
          if (res.type === "return")
            return res;
        }
      }
      return null;
    }
    executeDoWhile(stmt) {
      do {
        const res = this.executeStatement(stmt.body);
        if (res) {
          if (res.type === "break")
            break;
          if (res.type === "return")
            return res;
        }
        this.ctx.recordSnapshot(stmt.line, "Condición de ciclo do-while", "Evaluando condición de parada al final del ciclo do-while.");
        const cond = Boolean(this.evaluateExpression(stmt.condition));
        this.ctx.recordSnapshot(stmt.line, "Resultado de condición do-while", `Condición de do-while: ${cond ? "VERDADERO (siguiente iteración)" : "FALSO (sale del ciclo)"}.`);
        if (!cond)
          break;
      } while (true);
      return null;
    }
    executeFor(stmt) {
      if (stmt.init) {
        if (stmt.init.type === "VariableDeclaration") {
          this.executeVariableDeclaration(stmt.init);
        } else {
          this.evaluateExpression(stmt.init);
        }
      }
      while (true) {
        if (stmt.condition) {
          const cond = Boolean(this.evaluateExpression(stmt.condition));
          this.ctx.recordSnapshot(stmt.line, "Condición de ciclo for", `Evaluación de condición del ciclo for: ${cond ? "VERDADERO (inicia iteración)" : "FALSO (termina el ciclo for)"}.`);
          if (!cond)
            break;
        }
        const res = this.executeStatement(stmt.body);
        if (res) {
          if (res.type === "break")
            break;
          if (res.type === "return")
            return res;
        }
        if (stmt.update) {
          this.evaluateExpression(stmt.update);
          this.ctx.recordSnapshot(stmt.line, "Actualización de ciclo for", "Incremento/actualización de la variable de control del ciclo for.");
        }
      }
      return null;
    }
    evaluateExpression(expr) {
      if (!expr)
        return 0;
      const frame = this.ctx.currentFrame();
      switch (expr.type) {
        case "Literal":
          return expr.value;
        case "Identifier": {
          if (frame.variables.hasOwnProperty(expr.name)) {
            return frame.variables[expr.name];
          }
          if (this.ctx.globalFrame.variables.hasOwnProperty(expr.name)) {
            return this.ctx.globalFrame.variables[expr.name];
          }
          return 0;
        }
        case "BinaryExpression": {
          const leftVal = this.evaluateExpression(expr.left);
          const rightVal = this.evaluateExpression(expr.right);
          switch (expr.operator) {
            case "+":
              return leftVal + rightVal;
            case "-":
              return leftVal - rightVal;
            case "*":
              return leftVal * rightVal;
            case "/":
              return rightVal !== 0 ? Math.floor(leftVal / rightVal) : 0;
            case "%":
              return rightVal !== 0 ? leftVal % rightVal : 0;
            case "==":
              return leftVal === rightVal;
            case "!=":
              return leftVal !== rightVal;
            case "<":
              return leftVal < rightVal;
            case "<=":
              return leftVal <= rightVal;
            case ">":
              return leftVal > rightVal;
            case ">=":
              return leftVal >= rightVal;
            case "&&":
              return Boolean(leftVal && rightVal);
            case "||":
              return Boolean(leftVal || rightVal);
            default:
              return 0;
          }
        }
        case "UnaryExpression": {
          if (expr.operator === "!") {
            return !this.evaluateExpression(expr.argument);
          }
          if (expr.operator === "-") {
            return -this.evaluateExpression(expr.argument);
          }
          if (expr.operator === "++") {
            return this.applyIncrement(expr.argument, 1, expr.prefix);
          }
          if (expr.operator === "--") {
            return this.applyIncrement(expr.argument, -1, expr.prefix);
          }
          return 0;
        }
        case "AssignmentExpression": {
          const rightVal = this.evaluateExpression(expr.right);
          let finalVal = rightVal;
          if (expr.operator !== "=") {
            const curVal = this.evaluateTargetRead(expr.left);
            if (expr.operator === "+=")
              finalVal = curVal + rightVal;
            else if (expr.operator === "-=")
              finalVal = curVal - rightVal;
            else if (expr.operator === "*=")
              finalVal = curVal * rightVal;
            else if (expr.operator === "/=")
              finalVal = rightVal !== 0 ? Math.floor(curVal / rightVal) : 0;
            else if (expr.operator === "%=")
              finalVal = rightVal !== 0 ? curVal % rightVal : 0;
          }
          this.assignToTarget(expr.left, finalVal, expr.line);
          return finalVal;
        }
        case "FileStreamWrite": {
          const streamName = expr.stream.name;
          const handleId = frame.streams[streamName] || this.ctx.globalFrame.streams[streamName];
          let written = "";
          for (const elem of expr.elements) {
            if (elem.type === "Endl") {
              written += `
`;
            } else {
              written += String(this.evaluateExpression(elem));
            }
          }
          this.ctx.vfs.write(handleId, written);
          this.ctx.recordSnapshot(expr.line, `Escritura en archivo '${streamName}'`, `Se escribió en el archivo: ${JSON.stringify(written)}.`);
          return true;
        }
        case "IndexAccess": {
          if (expr.object.type === "IndexAccess") {
            const matName = expr.object.object.name;
            const rowIndex = Number(this.evaluateExpression(expr.object.index));
            const colIndex = Number(this.evaluateExpression(expr.index));
            const mat = frame.matrices2D[matName] || this.ctx.globalFrame.matrices2D[matName];
            if (mat && mat.values[rowIndex]) {
              frame.lastMatrixAccess = { name: matName, row: rowIndex, col: colIndex, type: "read" };
              const val = mat.values[rowIndex][colIndex] ?? 0;
              this.ctx.recordSnapshot(expr.line, `Lectura de matriz '${matName}[${rowIndex}][${colIndex}]'`, `Se leyó el valor ${val} en la posición [fila: ${rowIndex}, columna: ${colIndex}].`);
              return val;
            }
            return 0;
          }
          const arrName = expr.object.name;
          const indexVal = Number(this.evaluateExpression(expr.index));
          const arr = frame.arrays1D[arrName] || this.ctx.globalFrame.arrays1D[arrName];
          if (arr) {
            frame.lastArrayAccess = { name: arrName, index: indexVal, type: "read" };
            const val = arr.values[indexVal] ?? 0;
            this.ctx.recordSnapshot(expr.line, `Lectura de arreglo '${arrName}[${indexVal}]'`, `Se leyó el valor ${val} en la posición del arreglo [${indexVal}].`);
            return val;
          }
          const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
          if (stArr && stArr.isArray) {
            return stArr.items[indexVal];
          }
          return 0;
        }
        case "MemberAccess": {
          if (expr.object.type === "IndexAccess") {
            const arrName = expr.object.object.name;
            const idx = Number(this.evaluateExpression(expr.object.index));
            const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
            if (stArr && stArr.isArray && stArr.items[idx]) {
              const val = stArr.items[idx][expr.member];
              this.ctx.recordSnapshot(expr.line, `Lectura de struct en arreglo '${arrName}[${idx}].${expr.member}'`, `Se leyó el campo '${expr.member}' con valor ${JSON.stringify(val)} del elemento [${idx}].`);
              return val;
            }
          } else if (expr.object.type === "Identifier") {
            const stName = expr.object.name;
            const st = frame.structs[stName] || this.ctx.globalFrame.structs[stName];
            if (st && !st.isArray) {
              const val = st.fields[expr.member];
              this.ctx.recordSnapshot(expr.line, `Lectura de campo '${stName}.${expr.member}'`, `Se leyó el campo '${expr.member}' del struct '${stName}' con valor = ${JSON.stringify(val)}.`);
              return val;
            }
          }
          return 0;
        }
        case "BuiltinCall": {
          return this.executeBuiltinCall(expr);
        }
        case "CallExpression": {
          return this.executeFunctionCall(expr);
        }
        default:
          return 0;
      }
    }
    executeBuiltinCall(expr) {
      const frame = this.ctx.currentFrame();
      const name = expr.name;
      if (name === "getline") {
        const streamName = expr.args[0].name;
        const targetVarNode = expr.args[1];
        let delimiter = `
`;
        if (expr.args.length > 2) {
          delimiter = String(this.evaluateExpression(expr.args[2]));
        }
        const handleId = frame.streams[streamName] || this.ctx.globalFrame.streams[streamName];
        const result = this.ctx.vfs.getline(handleId, delimiter);
        if (result.success) {
          this.assignToTarget(targetVarNode, result.value, expr.line);
          this.ctx.recordSnapshot(expr.line, `getline con delimitador '${delimiter === `
` ? "\\n" : delimiter}'`, `getline extrajo el token "${result.value}" del archivo '${streamName}' y lo almacenó en la variable.`);
          return true;
        } else {
          this.ctx.recordSnapshot(expr.line, `getline fin de archivo (EOF)`, `El archivo '${streamName}' llegó al final (EOF). getline retorna false.`);
          return false;
        }
      }
      if (["atoi", "atol", "stoi"].includes(name)) {
        let rawStr = this.evaluateExpression(expr.args[0]);
        if (typeof rawStr === "string" && rawStr.includes(".c_str()")) {
          rawStr = rawStr.replace(".c_str()", "");
        }
        const num = parseInt(String(rawStr).trim(), 10) || 0;
        this.ctx.recordSnapshot(expr.line, `Conversión numérica (${name})`, `${name} convirtió la cadena "${rawStr}" en el entero ${num}.`);
        return num;
      }
      if (["atof", "stof"].includes(name)) {
        const rawStr = this.evaluateExpression(expr.args[0]);
        const num = parseFloat(String(rawStr).trim()) || 0;
        this.ctx.recordSnapshot(expr.line, `Conversión a decimal (${name})`, `${name} convirtió la cadena "${rawStr}" en el número decimal ${num}.`);
        return num;
      }
      return 0;
    }
    executeFunctionCall(callExpr) {
      const fnName = callExpr.callee.name;
      if (callExpr.callee.type === "MemberAccess") {
        const objName = callExpr.callee.object.name;
        const method = callExpr.callee.member;
        if (["c_str", "length", "size", "empty"].includes(method)) {
          const strVal = this.evaluateExpression(callExpr.callee.object);
          if (method === "c_str")
            return String(strVal);
          if (method === "length" || method === "size")
            return String(strVal).length;
          if (method === "empty")
            return String(strVal).length === 0;
        }
        const handleId = this.ctx.currentFrame().streams[objName] || this.ctx.globalFrame.streams[objName];
        const handle = this.ctx.vfs.openHandles.get(handleId);
        if (method === "is_open") {
          const isOpen = handle?.isOpen ?? false;
          this.ctx.recordSnapshot(callExpr.line, `Comprobación ${objName}.is_open()`, `El archivo '${handle?.filename ?? objName}' ${isOpen ? "se abrió correctamente" : "NO se pudo abrir"}.`);
          return isOpen;
        }
        if (method === "close") {
          this.ctx.vfs.close(handleId);
          this.ctx.recordSnapshot(callExpr.line, `Cierre de archivo ${objName}.close()`, `Se cerró el flujo de archivo '${objName}'.`);
          return true;
        }
        if (method === "eof") {
          return handle?.eof ?? true;
        }
        return 0;
      }
      const fn = this.ctx.functions.get(fnName);
      if (!fn) {
        throw new Error(`Función '${fnName}' no definida.`);
      }
      const evaluatedArgs = callExpr.args.map((arg) => this.evaluateExpression(arg));
      const newFrame = this.ctx.createFrame(fnName);
      for (let i = 0;i < fn.params.length; i++) {
        const p = fn.params[i];
        const argVal = evaluatedArgs[i];
        if (p.isArray) {
          const originalArrName = callExpr.args[i].name;
          const originalArr = this.ctx.currentFrame().arrays1D[originalArrName] || this.ctx.globalFrame.arrays1D[originalArrName];
          if (originalArr) {
            newFrame.arrays1D[p.name] = originalArr;
          }
        } else {
          newFrame.variables[p.name] = this.castType(argVal, p.type);
        }
      }
      this.ctx.callStack.push(newFrame);
      this.ctx.recordSnapshot(fn.line, `Llamada a función ${fnName}()`, `Entrando a la función '${fnName}' con parámetros: [${fn.params.map((p, idx) => `${p.name} = ${evaluatedArgs[idx]}`).join(", ")}].`);
      const result = this.executeBlock(fn.body);
      this.ctx.callStack.pop();
      const returnVal = result?.value ?? 0;
      this.ctx.recordSnapshot(callExpr.line, `Retorno de función ${fnName}()`, `Retornando de '${fnName}' con valor = ${returnVal}.`);
      return returnVal;
    }
    assignToTarget(targetNode, value, line) {
      const frame = this.ctx.currentFrame();
      if (targetNode.type === "Identifier") {
        const varName = targetNode.name;
        if (frame.variables.hasOwnProperty(varName)) {
          frame.variables[varName] = value;
        } else {
          this.ctx.globalFrame.variables[varName] = value;
        }
        this.ctx.recordSnapshot(line, `Asignación a variable '${varName}'`, `Se asignó el valor ${JSON.stringify(value)} a la variable '${varName}'.`);
        return;
      }
      if (targetNode.type === "IndexAccess" && targetNode.object.type === "Identifier") {
        const arrName = targetNode.object.name;
        const indexVal = Number(this.evaluateExpression(targetNode.index));
        const arr = frame.arrays1D[arrName] || this.ctx.globalFrame.arrays1D[arrName];
        if (arr) {
          arr.values[indexVal] = this.castType(value, arr.type);
          frame.lastArrayAccess = { name: arrName, index: indexVal, type: "write" };
          this.ctx.recordSnapshot(line, `Escritura en arreglo '${arrName}[${indexVal}]'`, `Se guardó el valor ${value} en el arreglo '${arrName}' en la posición [${indexVal}].`);
          return;
        }
      }
      if (targetNode.type === "IndexAccess" && targetNode.object.type === "IndexAccess") {
        const matName = targetNode.object.object.name;
        const r = Number(this.evaluateExpression(targetNode.object.index));
        const c = Number(this.evaluateExpression(targetNode.index));
        const mat = frame.matrices2D[matName] || this.ctx.globalFrame.matrices2D[matName];
        if (mat && mat.values[r]) {
          mat.values[r][c] = this.castType(value, mat.type);
          frame.lastMatrixAccess = { name: matName, row: r, col: c, type: "write" };
          this.ctx.recordSnapshot(line, `Escritura en matriz '${matName}[${r}][${c}]'`, `Se guardó el valor ${value} en la matriz '${matName}' en la fila [${r}], columna [${c}].`);
          return;
        }
      }
      if (targetNode.type === "MemberAccess") {
        const member = targetNode.member;
        if (targetNode.object.type === "IndexAccess") {
          const arrName = targetNode.object.object.name;
          const idx = Number(this.evaluateExpression(targetNode.object.index));
          const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
          if (stArr && stArr.isArray && stArr.items[idx]) {
            stArr.items[idx][member] = value;
            this.ctx.recordSnapshot(line, `Escritura en struct de arreglo '${arrName}[${idx}].${member}'`, `Se asignó '${member}' = ${JSON.stringify(value)} en el elemento [${idx}] del arreglo de structs.`);
            return;
          }
        } else if (targetNode.object.type === "Identifier") {
          const stName = targetNode.object.name;
          const st = frame.structs[stName] || this.ctx.globalFrame.structs[stName];
          if (st && !st.isArray) {
            st.fields[member] = value;
            this.ctx.recordSnapshot(line, `Escritura en campo '${stName}.${member}'`, `Se asignó el campo '${member}' = ${JSON.stringify(value)} en la estructura '${stName}'.`);
            return;
          }
        }
      }
    }
    applyIncrement(targetNode, delta, prefix) {
      const curVal = this.evaluateTargetRead(targetNode);
      const newVal = curVal + delta;
      this.assignToTarget(targetNode, newVal, targetNode.line);
      return prefix ? newVal : curVal;
    }
    evaluateTargetRead(targetNode) {
      return this.evaluateExpression(targetNode);
    }
    getDefaultValue(type) {
      if (["int", "long"].includes(type))
        return 0;
      if (["float", "double"].includes(type))
        return 0;
      if (type === "bool")
        return false;
      if (type === "char")
        return " ";
      if (type === "string")
        return "";
      return 0;
    }
    castType(val, type) {
      if (["int", "long"].includes(type))
        return parseInt(val, 10) || 0;
      if (["float", "double"].includes(type))
        return parseFloat(val) || 0;
      if (type === "bool")
        return Boolean(val);
      if (type === "char")
        return String(val).charAt(0) || " ";
      if (type === "string")
        return String(val);
      return val;
    }
  }

  // js/utils/highlighter.js
  class CppHighlighter {
    static highlight(code, activeLine = -1) {
      if (!code)
        return "";
      const lines = code.split(`
`);
      let inMultiComment = false;
      const highlightedLines = lines.map((line, lineIdx) => {
        const lineNum = lineIdx + 1;
        const isCurLine = lineNum === activeLine;
        let leadingSpacesCount = 0;
        while (leadingSpacesCount < line.length && line[leadingSpacesCount] === " ") {
          leadingSpacesCount++;
        }
        const indentLevel = Math.floor(leadingSpacesCount / 4);
        let indentGuidesHtml = "";
        for (let i = 0;i < indentLevel; i++) {
          indentGuidesHtml += '<span class="indent-guide"><span class="guide-pipe">│</span>   </span>';
        }
        const leftoverSpaces = " ".repeat(leadingSpacesCount % 4);
        const content = line.substring(leadingSpacesCount);
        let highlightedContent = "";
        if (inMultiComment) {
          const endCommentIdx = content.indexOf("*/");
          if (endCommentIdx !== -1) {
            highlightedContent = `<span class="tok-comment">${this.escape(content.substring(0, endCommentIdx + 2))}</span>` + this.highlightLineContent(content.substring(endCommentIdx + 2));
            inMultiComment = false;
          } else {
            highlightedContent = `<span class="tok-comment">${this.escape(content)}</span>`;
          }
        } else {
          const { result, stillInComment } = this.highlightLineContentWithComment(content);
          highlightedContent = result;
          inMultiComment = stillInComment;
        }
        return `<div class="code-line-row ${isCurLine ? "active-code-line" : ""}">${indentGuidesHtml}${leftoverSpaces}${highlightedContent || "&nbsp;"}</div>`;
      });
      return highlightedLines.join("");
    }
    static highlightLineContentWithComment(content) {
      const singleCommentIdx = content.indexOf("//");
      const multiCommentIdx = content.indexOf("/*");
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
        const endIdx = after.indexOf("*/");
        if (endIdx !== -1) {
          const comment = "/*" + after.substring(0, endIdx + 2);
          const rest = after.substring(endIdx + 2);
          return {
            result: this.highlightLineContent(before) + `<span class="tok-comment">${this.escape(comment)}</span>` + this.highlightLineContent(rest),
            stillInComment: false
          };
        } else {
          return {
            result: this.highlightLineContent(before) + `<span class="tok-comment">${this.escape("/*" + after)}</span>`,
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
      if (!text)
        return "";
      if (text.trim().startsWith("#")) {
        return `<span class="tok-preproc">${this.escape(text)}</span>`;
      }
      const tokenRegex = /(".*?"|'.*?'|\b(?:int|float|double|char|bool|void|string|ifstream|ofstream|fstream)\b|\b(?:struct|if|else|while|for|do|break|continue|return|using|namespace|true|false)\b|\b(?:cout|cin|endl|getline|atoi|atol|atof|stoi|stof|is_open|close|eof|c_str|length|size|empty)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*|<<|>>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|(?:\/=)|%=|&&|\|\||[+\-*\/%<>=!&.]|[(){}\[\],;])/g;
      return text.replace(tokenRegex, (match) => {
        if (match.startsWith('"') && match.endsWith('"')) {
          return `<span class="tok-string">${this.escape(match)}</span>`;
        }
        if (match.startsWith("'") && match.endsWith("'")) {
          return `<span class="tok-char">${this.escape(match)}</span>`;
        }
        if (/^(?:int|float|double|char|bool|void|string|ifstream|ofstream|fstream)$/.test(match)) {
          return `<span class="tok-type">${match}</span>`;
        }
        if (/^(?:struct|if|else|while|for|do|break|continue|return|using|namespace|true|false)$/.test(match)) {
          return `<span class="tok-keyword">${match}</span>`;
        }
        if (/^(?:cout|cin|endl|getline|atoi|atol|atof|stoi|stof|is_open|close|eof|c_str|length|size|empty)$/.test(match)) {
          return `<span class="tok-builtin">${match}</span>`;
        }
        if (/^\d+(?:\.\d+)?$/.test(match)) {
          return `<span class="tok-number">${match}</span>`;
        }
        if (/^(?:<<|>>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|(?:\/=)|%=|&&|\|\||[+\-*\/%<>=!&.])$/.test(match)) {
          return `<span class="tok-operator">${this.escape(match)}</span>`;
        }
        if (/^[(){}\[\],;]$/.test(match)) {
          return `<span class="tok-punct">${match}</span>`;
        }
        return `<span class="tok-ident">${match}</span>`;
      });
    }
    static escape(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  // js/utils/autocomplete.js
  var AUTOCOMPLETE_CATALOG = [
    { label: "int", type: "tipo", detail: "Tipo de dato entero", insertText: "int" },
    { label: "float", type: "tipo", detail: "Tipo decimal simple", insertText: "float" },
    { label: "double", type: "tipo", detail: "Tipo decimal doble precisión", insertText: "double" },
    { label: "char", type: "tipo", detail: "Tipo carácter", insertText: "char" },
    { label: "bool", type: "tipo", detail: "Tipo booleano", insertText: "bool" },
    { label: "string", type: "tipo", detail: "Cadena de texto C++", insertText: "string" },
    { label: "void", type: "tipo", detail: "Tipo de retorno vacío", insertText: "void" },
    { label: "ifstream", type: "tipo", detail: "Flujo de lectura de archivos", insertText: "ifstream" },
    { label: "ofstream", type: "tipo", detail: "Flujo de escritura de archivos", insertText: "ofstream" },
    { label: "fstream", type: "tipo", detail: "Flujo de archivo general", insertText: "fstream" },
    { label: "struct", type: "clave", detail: "Palabra reservada struct", insertText: "struct" },
    { label: "for", type: "clave", detail: "Palabra reservada for", insertText: "for" },
    { label: "while", type: "clave", detail: "Palabra reservada while", insertText: "while" },
    { label: "do", type: "clave", detail: "Palabra reservada do", insertText: "do" },
    { label: "if", type: "clave", detail: "Palabra reservada if", insertText: "if" },
    { label: "else", type: "clave", detail: "Palabra reservada else", insertText: "else" },
    { label: "return", type: "clave", detail: "Palabra reservada return", insertText: "return" },
    { label: "break", type: "clave", detail: "Palabra reservada break", insertText: "break;" },
    { label: "continue", type: "clave", detail: "Palabra reservada continue", insertText: "continue;" },
    { label: "true", type: "clave", detail: "Valor booleano true", insertText: "true" },
    { label: "false", type: "clave", detail: "Valor booleano false", insertText: "false" },
    { label: "cout", type: "io", detail: "Flujo de salida estándar", insertText: "cout" },
    { label: "cin", type: "io", detail: "Flujo de entrada estándar", insertText: "cin" },
    { label: "endl", type: "io", detail: "Fin de línea de flujo", insertText: "endl" },
    { label: "getline", type: "función", detail: "Función getline para texto/CSV", insertText: "getline" },
    { label: "atoi", type: "función", detail: "Conversión string a int", insertText: "atoi" },
    { label: "atol", type: "función", detail: "Conversión string a long", insertText: "atol" },
    { label: "atof", type: "función", detail: "Conversión string a float", insertText: "atof" },
    { label: "stoi", type: "función", detail: "Conversión de string a int", insertText: "stoi" },
    { label: "is_open", type: "función", detail: "Método comprobación de archivo", insertText: "is_open()" },
    { label: "close", type: "función", detail: "Método cierre de archivo", insertText: "close()" },
    { label: "c_str", type: "función", detail: "Método c_str() de string", insertText: "c_str()" }
  ];

  class Autocomplete {
    constructor(editor) {
      this.editor = editor;
      this.textarea = editor.textarea;
      this.container = editor.container;
      this.isOpen = false;
      this.items = [];
      this.selectedIndex = 0;
      this.query = "";
      this.wordStart = 0;
      this.initDOM();
      this.bindEvents();
    }
    initDOM() {
      this.menu = document.createElement("div");
      this.menu.className = "autocomplete-menu";
      this.menu.style.display = "none";
      this.container.querySelector(".editor-input-container").appendChild(this.menu);
    }
    bindEvents() {
      this.textarea.addEventListener("keydown", (e) => {
        if (!this.isOpen) {
          if (e.ctrlKey && e.code === "Space") {
            e.preventDefault();
            this.triggerAutocomplete(true);
          }
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.selectNext();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          this.selectPrev();
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          this.applySelected();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.close();
        }
      });
      this.textarea.addEventListener("input", () => {
        this.triggerAutocomplete(false);
      });
      this.textarea.addEventListener("blur", () => {
        setTimeout(() => this.close(), 150);
      });
      this.textarea.addEventListener("scroll", () => {
        if (this.isOpen)
          this.close();
      });
    }
    triggerAutocomplete(forced = false) {
      const cursor = this.textarea.selectionStart;
      const text = this.textarea.value;
      let start = cursor;
      while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
        start--;
      }
      const currentWord = text.substring(start, cursor);
      this.query = currentWord.toLowerCase();
      this.wordStart = start;
      if (!forced && this.query.length < 1) {
        this.close();
        return;
      }
      this.items = AUTOCOMPLETE_CATALOG.filter((item) => {
        return item.label.toLowerCase().startsWith(this.query) || this.query.length >= 2 && item.label.toLowerCase().includes(this.query);
      }).slice(0, 7);
      if (this.items.length === 0) {
        this.close();
        return;
      }
      this.selectedIndex = 0;
      this.renderMenu();
      this.positionMenu(cursor);
    }
    positionMenu(cursor) {
      const textBefore = this.textarea.value.substring(0, cursor);
      const lines = textBefore.split(`
`);
      const lineIndex = lines.length - 1;
      const colIndex = lines[lineIndex].length;
      const lineHeight = 22;
      const charWidth = 8.1;
      const rawTop = (lineIndex + 1) * lineHeight - this.textarea.scrollTop;
      const left = Math.min(this.textarea.clientWidth - 260, Math.max(10, colIndex * charWidth - this.textarea.scrollLeft + 14));
      const containerHeight = this.textarea.clientHeight;
      let finalTop = rawTop;
      if (rawTop > containerHeight - 140 && rawTop > 160) {
        finalTop = lineIndex * lineHeight - this.textarea.scrollTop - 160;
      }
      this.menu.style.top = `${Math.max(5, finalTop)}px`;
      this.menu.style.left = `${left}px`;
      this.menu.style.display = "block";
      this.isOpen = true;
    }
    renderMenu() {
      let html = "";
      this.items.forEach((item, idx) => {
        const isSel = idx === this.selectedIndex;
        let badgeClass = "ac-badge-clave";
        if (item.type === "tipo")
          badgeClass = "ac-badge-tipo";
        else if (item.type === "función")
          badgeClass = "ac-badge-fn";
        html += `
        <div class="ac-item ${isSel ? "ac-selected" : ""}" data-idx="${idx}">
          <span class="ac-badge ${badgeClass}">${item.type}</span>
          <span class="ac-label">${item.label}</span>
          <span class="ac-detail">${item.detail}</span>
        </div>
      `;
      });
      this.menu.innerHTML = html;
      const itemElements = this.menu.querySelectorAll(".ac-item");
      itemElements.forEach((el) => {
        el.addEventListener("mousedown", (e) => {
          e.preventDefault();
          this.selectedIndex = parseInt(el.getAttribute("data-idx"), 10);
          this.applySelected();
        });
      });
    }
    selectNext() {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this.renderMenu();
    }
    selectPrev() {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this.renderMenu();
    }
    applySelected() {
      if (!this.isOpen || this.items.length === 0)
        return;
      const item = this.items[this.selectedIndex];
      const cursor = this.textarea.selectionStart;
      const text = this.textarea.value;
      const before = text.substring(0, this.wordStart);
      const after = text.substring(cursor);
      const insert = item.insertText;
      this.textarea.value = before + insert + after;
      const newCursor = this.wordStart + insert.length;
      this.textarea.selectionStart = this.textarea.selectionEnd = newCursor;
      this.close();
      this.editor.updateGutter();
      this.editor.updateSyntaxHighlight();
      if (this.editor.onChangeCallback) {
        this.editor.onChangeCallback(this.textarea.value);
      }
    }
    close() {
      this.isOpen = false;
      this.menu.style.display = "none";
    }
  }

  // js/utils/editor.js
  class CodeEditor {
    constructor(containerElement, initialCode = "") {
      this.container = containerElement;
      this.initialCode = initialCode;
      this.activeLine = -1;
      this.onChangeCallback = null;
      this.render();
      this.autocomplete = new Autocomplete(this);
    }
    render() {
      this.container.innerHTML = `
      <div class="editor-wrapper">
        <div class="editor-gutter" id="editorGutter"></div>
        <div class="editor-input-container">
          <!-- Capa de resaltado de sintaxis y guías visuales detrás del textarea -->
          <pre class="editor-syntax-layer" id="editorSyntaxLayer" aria-hidden="true"></pre>
          
          <!-- Textarea transparente para edición nativa con cursor -->
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
      this.textarea = this.container.querySelector("#editorTextarea");
      this.gutter = this.container.querySelector("#editorGutter");
      this.syntaxLayer = this.container.querySelector("#editorSyntaxLayer");
      this.setupEvents();
      this.updateGutter();
      this.updateSyntaxHighlight();
    }
    setupEvents() {
      this.textarea.addEventListener("scroll", () => {
        this.gutter.scrollTop = this.textarea.scrollTop;
        this.syntaxLayer.scrollTop = this.textarea.scrollTop;
        this.syntaxLayer.scrollLeft = this.textarea.scrollLeft;
      });
      this.textarea.addEventListener("input", () => {
        this.updateGutter();
        this.updateSyntaxHighlight();
        if (this.onChangeCallback) {
          this.onChangeCallback(this.getValue());
        }
      });
      this.textarea.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          if (this.autocomplete && this.autocomplete.isOpen)
            return;
          e.preventDefault();
          const start = this.textarea.selectionStart;
          const end = this.textarea.selectionEnd;
          const val = this.textarea.value;
          this.textarea.value = val.substring(0, start) + "    " + val.substring(end);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
          this.updateGutter();
          this.updateSyntaxHighlight();
          if (this.onChangeCallback) {
            this.onChangeCallback(this.getValue());
          }
        }
      });
    }
    updateGutter() {
      const lines = this.textarea.value.split(`
`);
      const totalLines = lines.length;
      let gutterHtml = "";
      for (let i = 1;i <= totalLines; i++) {
        const isCurLine = i === this.activeLine;
        gutterHtml += `
        <div class="gutter-line ${isCurLine ? "gutter-active-line" : ""}">
          <span class="gutter-arrow">${isCurLine ? "▶" : ""}</span>
          <span class="gutter-number">${i}</span>
        </div>
      `;
      }
      this.gutter.innerHTML = gutterHtml;
    }
    updateSyntaxHighlight() {
      const code = this.textarea.value;
      const highlightedHtml = CppHighlighter.highlight(code, this.activeLine);
      this.syntaxLayer.innerHTML = highlightedHtml;
    }
    setActiveLine(lineNum) {
      this.activeLine = lineNum;
      this.updateGutter();
      this.updateSyntaxHighlight();
      if (lineNum > 0) {
        const lineHeight = 22;
        const targetScroll = Math.max(0, (lineNum - 5) * lineHeight);
        if (Math.abs(this.textarea.scrollTop - targetScroll) > 150) {
          this.textarea.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    }
    clearActiveLine() {
      this.activeLine = -1;
      this.updateGutter();
      this.updateSyntaxHighlight();
    }
    getValue() {
      return this.textarea.value;
    }
    setValue(newCode) {
      this.textarea.value = newCode;
      this.updateGutter();
      this.updateSyntaxHighlight();
      if (this.onChangeCallback) {
        this.onChangeCallback(newCode);
      }
    }
    onChange(callback) {
      this.onChangeCallback = callback;
    }
    escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  // js/visualizers/memoryView.js
  class MemoryView {
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
      for (let i = callStack.length - 1;i >= 0; i--) {
        const frame = callStack[i];
        const isActive = i === callStack.length - 1;
        html += `
        <div class="stack-frame ${isActive ? "active-frame" : ""}">
          <div class="frame-header">
            <span class="frame-fn">${frame.functionName}()</span>
            ${isActive ? '<span class="badge badge-success">En ejecución</span>' : ""}
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
          let typeBadge = "int";
          if (typeof val === "number") {
            typeBadge = Number.isInteger(val) ? "int" : "float";
          } else if (typeof val === "boolean") {
            typeBadge = "bool";
          } else if (typeof val === "string") {
            typeBadge = val.length === 1 ? "char" : "string";
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
      if (typeof val === "string")
        return `"${val}"`;
      if (typeof val === "boolean")
        return val ? "true" : "false";
      if (val === null || val === undefined)
        return "<em>no inicializado</em>";
      return String(val);
    }
  }

  // js/visualizers/arrayView.js
  class ArrayView {
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
        for (let i = 0;i < arr.size; i++) {
          const val = arr.values[i];
          const pointingVars = [];
          for (const [varName, varVal] of Object.entries(activePointers)) {
            if (varVal === i) {
              pointingVars.push(varName);
            }
          }
          let accessClass = "";
          if (lastAccess && lastAccess.index === i) {
            accessClass = lastAccess.type === "write" ? "cell-written" : "cell-read";
          }
          html += `
          <div class="array-column">
            <!-- Indicador de variable apuntando al índice (ej: i = 2) -->
            <div class="pointer-slot top">
              ${pointingVars.length > 0 ? `
                <div class="pointer-badge" title="Variable(s): ${pointingVars.join(", ")}">
                  <span>${pointingVars.join(", ")}</span>
                  <div class="pointer-arrow">▼</div>
                </div>
              ` : ""}
            </div>

            <!-- Celda de memoria del arreglo -->
            <div class="array-cell ${accessClass}">
              <span class="cell-val">${val !== undefined ? val : "-"}</span>
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
      html += "</div>";
      this.container.innerHTML = html;
    }
  }

  // js/visualizers/matrixView.js
  class MatrixView {
    constructor(containerElement) {
      this.container = containerElement;
    }
    render(snapshot) {
      if (!snapshot || !snapshot.matrices2D || Object.keys(snapshot.matrices2D).length === 0) {
        this.container.innerHTML = `
        <div class="empty-state">
          <p>No hay matrices 2D declaradas en este paso.</p>
          <small>Declara una matriz como <code>int mat[3][3];</code> para visualizarla.</small>
        </div>
      `;
        return;
      }
      const { matrices2D, activePointers } = snapshot;
      let html = '<div class="matrices-container">';
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
        for (let c = 0;c < mat.cols; c++) {
          const colPointers = [];
          for (const [vName, vVal] of Object.entries(activePointers)) {
            if (["c", "col", "j", "columna"].includes(vName.toLowerCase()) && vVal === c) {
              colPointers.push(vName);
            }
          }
          html += `
          <th class="col-header">
            ${colPointers.length > 0 ? `<div class="col-pointer-badge">${colPointers.join(",")} ▼</div>` : ""}
            <span>col [${c}]</span>
          </th>
        `;
        }
        html += `
                </tr>
              </thead>
              <tbody>
      `;
        for (let r = 0;r < mat.rows; r++) {
          const rowPointers = [];
          for (const [vName, vVal] of Object.entries(activePointers)) {
            if (["f", "fila", "i", "row", "r"].includes(vName.toLowerCase()) && vVal === r) {
              rowPointers.push(vName);
            }
          }
          html += `
          <tr>
            <th class="row-header">
              <span>fila [${r}]</span>
              ${rowPointers.length > 0 ? `<span class="row-pointer-badge">▶ ${rowPointers.join(",")}</span>` : ""}
            </th>
        `;
          for (let c = 0;c < mat.cols; c++) {
            const val = mat.values[r] ? mat.values[r][c] : 0;
            let cellClass = "";
            if (lastAccess && lastAccess.row === r && lastAccess.col === c) {
              cellClass = lastAccess.type === "write" ? "cell-written" : "cell-read";
            }
            html += `
            <td class="matrix-cell ${cellClass}" title="${name}[${r}][${c}] = ${val}">
              <span class="cell-val">${val !== undefined ? val : "-"}</span>
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
      html += "</div>";
      this.container.innerHTML = html;
    }
  }

  // js/visualizers/structView.js
  class StructView {
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
          for (let i = 0;i < st.items.length; i++) {
            const item = st.items[i];
            const pointingVars = [];
            for (const [vName, vVal] of Object.entries(activePointers)) {
              if (vVal === i)
                pointingVars.push(vName);
            }
            html += `
            <div class="struct-card">
              <div class="struct-card-header">
                <span class="struct-card-index">${name}[${i}]</span>
                ${pointingVars.length > 0 ? `<span class="pointer-badge-small">▼ ${pointingVars.join(",")}</span>` : ""}
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
      html += "</div>";
      this.container.innerHTML = html;
    }
    formatVal(val) {
      if (typeof val === "string")
        return `"${val}"`;
      if (typeof val === "boolean")
        return val ? "true" : "false";
      if (val === null || val === undefined)
        return "-";
      return String(val);
    }
  }

  // js/visualizers/fileStreamView.js
  class FileStreamView {
    constructor(containerElement, onFileContentChange) {
      this.container = containerElement;
      this.onFileContentChange = onFileContentChange;
      this.activeTab = "estudiantes.csv";
    }
    render(snapshot) {
      if (!snapshot || !snapshot.vfsState) {
        this.container.innerHTML = '<div class="empty-state">No hay estado de archivos</div>';
        return;
      }
      const { openFiles, allFiles } = snapshot.vfsState;
      const fileNames = Object.keys(allFiles);
      if (!fileNames.includes(this.activeTab) && fileNames.length > 0) {
        this.activeTab = fileNames[0];
      }
      let html = `
      <div class="fstream-container">
        <!-- Barra de Estado de Streams Abiertos -->
        <div class="stream-status-bar">
          <div class="status-label">Flujos activos:</div>
    `;
      if (openFiles.length === 0) {
        html += `<span class="badge badge-secondary">Ningún archivo abierto actualmente</span>`;
      } else {
        for (const stream of openFiles) {
          const modeBadge = stream.mode === "in" ? '<span class="badge badge-info">ifstream (Lectura)</span>' : '<span class="badge badge-warning">ofstream (Escritura)</span>';
          html += `
          <div class="stream-tag">
            <span class="stream-icon">\uD83D\uDCC4</span>
            <strong>${stream.filename}</strong>
            ${modeBadge}
            ${stream.eof ? '<span class="badge badge-danger">EOF (Fin)</span>' : ""}
            ${stream.lastToken ? `<span class="badge badge-success">Último token: "${stream.lastToken}"</span>` : ""}
          </div>
        `;
        }
      }
      html += `
        </div>

        <!-- Pestañas de Archivos Disponibles en VFS -->
        <div class="fstream-tabs">
    `;
      for (const name of fileNames) {
        const isSelected = name === this.activeTab;
        const isOpen = openFiles.some((f) => f.filename === name);
        html += `
        <button class="file-tab-btn ${isSelected ? "active" : ""}" data-file="${name}">
          ${isOpen ? '<span class="dot-open" title="Archivo abierto">●</span>' : ""}
          ${name}
        </button>
      `;
      }
      html += `
        </div>

        <!-- Visor del Contenido del Archivo Seleccionado con Cursor de Lectura -->
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
      const tabBtns = this.container.querySelectorAll(".file-tab-btn");
      tabBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.activeTab = btn.getAttribute("data-file");
          this.render(snapshot);
        });
      });
    }
    renderFileContentWithCursor(filename, content, openFiles) {
      if (content === undefined || content === null) {
        return '<div class="empty-state">Archivo vacío o no creado aún.</div>';
      }
      const stream = openFiles.find((f) => f.filename === filename);
      const cursor = stream ? stream.cursor : -1;
      const lastToken = stream ? stream.lastToken : "";
      const lines = content.split(`
`);
      let html = '<div class="code-lines-display">';
      let charCounter = 0;
      for (let lineIdx = 0;lineIdx < lines.length; lineIdx++) {
        const lineText = lines[lineIdx];
        const lineStart = charCounter;
        const lineEnd = charCounter + lineText.length;
        charCounter += lineText.length + 1;
        const isLineUnderCursor = stream && cursor >= lineStart && (cursor <= lineEnd || lineIdx === lines.length - 1);
        html += `
        <div class="file-line-row ${isLineUnderCursor ? "line-reading" : ""}">
          <span class="file-line-num">${lineIdx + 1}</span>
          <span class="file-line-text">${this.highlightTokens(lineText, stream, isLineUnderCursor)}</span>
        </div>
      `;
      }
      html += "</div>";
      if (stream && stream.mode === "in" && lastToken) {
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
      if (!lineText)
        return "&nbsp;";
      const parts = lineText.split(",");
      return parts.map((part, idx) => {
        const isLastToken = isLineUnderCursor && stream && stream.lastToken === part.trim();
        return `
        <span class="csv-token ${isLastToken ? "active-token-highlight" : ""}">${this.escapeHtml(part)}</span>
        ${idx < parts.length - 1 ? '<span class="csv-comma">,</span>' : ""}
      `;
      }).join("");
    }
    escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  // js/data/examples.js
  var EXAMPLES = [
    {
      id: "intro_variables",
      category: "1. Variables y Primitivos",
      title: "Intercambio de Variables y Tipos Básicos",
      description: "Demuestra variables primitivas (int, float, char, bool, string) y cómo intercambiar dos valores con una variable auxiliar.",
      code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    // Declaración de tipos primitivos y string
    int a = 15;
    int b = 40;
    float pi = 3.1416;
    char letra = 'C';
    bool activo = true;
    string curso = "Intro a la Programacion";

    cout << "Valores iniciales: a = " << a << ", b = " << b << endl;

    // Intercambio de valores usando variable temporal
    int temp = a;
    a = b;
    b = temp;

    cout << "Valores intercambiados: a = " << a << ", b = " << b << endl;
    cout << "Curso: " << curso << " (Letra: " << letra << ")" << endl;

    return 0;
}`
    },
    {
      id: "ciclos_for_while",
      category: "2. Ciclos y Control",
      title: "Ciclos for, while y do-while",
      description: "Compara el funcionamiento paso a paso de los tres ciclos principales de C++.",
      code: `#include <iostream>
using namespace std;

int main() {
    cout << "--- 1. Ciclo FOR: Tabla del 5 ---" << endl;
    for (int i = 1; i <= 5; i++) {
        int resultado = 5 * i;
        cout << "5 x " << i << " = " << resultado << endl;
    }

    cout << "--- 2. Ciclo WHILE: Suma de numeros ---" << endl;
    int suma = 0;
    int contador = 1;
    while (contador <= 4) {
        suma += contador;
        contador++;
    }
    cout << "Suma total acumulada: " << suma << endl;

    cout << "--- 3. Ciclo DO-WHILE: Al menos una vez ---" << endl;
    int num = 10;
    do {
        cout << "Valor de num: " << num << endl;
        num += 10;
    } while (num <= 25);

    return 0;
}`
    },
    {
      id: "arreglos_1d",
      category: "3. Arreglos 1D",
      title: "Arreglos 1D: Búsqueda del Mayor y Promedio",
      description: "Declara un arreglo de 6 elementos, lo recorre con un ciclo for para calcular la suma, el promedio y encontrar el valor mayor y su posición.",
      code: `#include <iostream>
using namespace std;

int main() {
    int notas[6] = {14, 18, 11, 20, 16, 15};
    int suma = 0;
    int mayor = notas[0];
    int posMayor = 0;

    for (int i = 0; i < 6; i++) {
        suma += notas[i];

        if (notas[i] > mayor) {
            mayor = notas[i];
            posMayor = i;
        }
    }

    int promedio = suma / 6;

    cout << "Suma total: " << suma << endl;
    cout << "Promedio: " << promedio << endl;
    cout << "Mayor nota: " << mayor << " en la posicion [" << posMayor << "]" << endl;

    return 0;
}`
    },
    {
      id: "matrices_2d",
      category: "4. Matrices 2D",
      title: "Matrices 2D: Recorrido y Suma por Filas",
      description: "Visualiza una matriz de 3x3, recorriéndola con dos ciclos for anidados (fila y columna).",
      code: `#include <iostream>
using namespace std;

int main() {
    int matriz[3][3] = {
        {10, 20, 30},
        {5,  15, 25},
        {8,  12, 16}
    };

    cout << "Recorriendo matriz 3x3:" << endl;
    for (int f = 0; f < 3; f++) {
        int sumaFila = 0;
        for (int c = 0; c < 3; c++) {
            sumaFila += matriz[f][c];
            cout << matriz[f][c] << " ";
        }
        cout << "| Suma fila " << f << ": " << sumaFila << endl;
    }

    return 0;
}`
    },
    {
      id: "funciones_basicas",
      category: "5. Funciones",
      title: "Funciones con Retorno y Parámetros",
      description: "Muestra cómo se crean funciones con retorno entero y void, y cómo la pila de llamadas gestiona los parámetros.",
      code: `#include <iostream>
using namespace std;

// Función con retorno entero
int calcularPotencia(int base, int exponente) {
    int resultado = 1;
    for (int i = 0; i < exponente; i++) {
        resultado *= base;
    }
    return resultado;
}

// Función con tipo de retorno void
void mostrarMensaje(string usuario, int nivel) {
    cout << "Bienvenido " << usuario << ", Nivel: " << nivel << endl;
}

int main() {
    mostrarMensaje("Carlos", 2);

    int pot1 = calcularPotencia(2, 4);
    cout << "2 elevado a la 4 es: " << pot1 << endl;

    int pot2 = calcularPotencia(5, 3);
    cout << "5 elevado a la 3 es: " << pot2 << endl;

    return 0;
}`
    },
    {
      id: "structs_registros",
      category: "6. Structs",
      title: "Estructuras y Arreglos de Structs",
      description: "Define un struct Alumno y crea un arreglo de structs para gestionar varios registros y calcular el mejor promedio.",
      code: `#include <iostream>
#include <string>
using namespace std;

struct Alumno {
    string nombre;
    int edad;
    float calificacion;
};

int main() {
    Alumno lista[3];

    // Llenando datos del primer alumno
    lista[0].nombre = "Lucia";
    lista[0].edad = 19;
    lista[0].calificacion = 9.4;

    // Segundo alumno
    lista[1].nombre = "Mateo";
    lista[1].edad = 20;
    lista[1].calificacion = 8.7;

    // Tercer alumno
    lista[2].nombre = "Valeria";
    lista[2].edad = 18;
    lista[2].calificacion = 9.8;

    float mejorNota = lista[0].calificacion;
    string mejorAlumno = lista[0].nombre;

    for (int i = 1; i < 3; i++) {
        if (lista[i].calificacion > mejorNota) {
            mejorNota = lista[i].calificacion;
            mejorAlumno = lista[i].nombre;
        }
    }

    cout << "El mejor alumno es: " << mejorAlumno << " con calificacion: " << mejorNota << endl;
    return 0;
}`
    },
    {
      id: "archivos_fstream_csv",
      category: "7. Archivos (fstream)",
      title: "Lectura CSV con getline por comas y atoi",
      description: `Abre el archivo "estudiantes.csv", lee cada línea separando campos con getline(archivo, token, ',') y convierte las calificaciones numéricas con atoi.`,
      code: `#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
using namespace std;

int main() {
    ifstream archivo("estudiantes.csv");
    ofstream reporte("reporte_alumnos.txt");

    if (!archivo.is_open()) {
        cout << "Error: No se pudo abrir el archivo." << endl;
        return 1;
    }

    string nombre;
    string edadStr;
    string notaStr;
    int totalAlumnos = 0;
    int sumaNotas = 0;

    cout << "--- Procesando estudiantes.csv ---" << endl;

    // Lectura delimitada por comas
    while (getline(archivo, nombre, ',')) {
        getline(archivo, edadStr, ',');
        getline(archivo, notaStr); // Lee hasta el salto de linea

        int edad = atoi(edadStr.c_str());
        int nota = atoi(notaStr.c_str());

        sumaNotas += nota;
        totalAlumnos++;

        cout << "Leido: " << nombre << " | Edad: " << edad << " | Nota: " << nota << endl;

        // Escribir en archivo de salida
        reporte << nombre << " tiene calificacion: " << nota << endl;
    }

    archivo.close();
    reporte.close();

    int promedio = sumaNotas / totalAlumnos;
    cout << "Total procesados: " << totalAlumnos << endl;
    cout << "Promedio del grupo: " << promedio << endl;
    cout << "Reporte guardado en reporte_alumnos.txt" << endl;

    return 0;
}`
    }
  ];

  // js/data/challenges.js
  var CHALLENGES = [
    {
      id: "reto_ciclos",
      title: "Reto 1: Contador de Pares con Ciclos",
      category: "Ciclos",
      difficulty: "Fácil",
      prompt: "Escribe un programa que recorra los números del 1 al 10 usando un ciclo for. Cuenta cuántos números son pares (usando el operador %) y muestra el total al final.",
      initialCode: `#include <iostream>
using namespace std;

int main() {
    int pares = 0;

    // TODO: Usa un ciclo for del 1 al 10
    // Si num % 2 == 0, incrementa pares
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) {
            pares++;
        }
    }

    cout << "Total de pares: " << pares << endl;
    return 0;
}`,
      expectedOutput: "Total de pares: 5",
      hint: "Usa `if (i % 2 == 0)` dentro del ciclo for."
    },
    {
      id: "reto_arreglos",
      title: "Reto 2: Mínimo en un Arreglo 1D",
      category: "Arreglos 1D",
      difficulty: "Fácil",
      prompt: 'Dado el arreglo de 5 números enteros {35, 12, 88, 7, 24}, encuentra el valor menor y guárdalo en la variable "menor". Imprime el resultado en consola.',
      initialCode: `#include <iostream>
using namespace std;

int main() {
    int datos[5] = {35, 12, 88, 7, 24};
    int menor = datos[0];

    // TODO: Recorre el arreglo desde el indice 1 al 4
    for (int i = 1; i < 5; i++) {
        if (datos[i] < menor) {
            menor = datos[i];
        }
    }

    cout << "El menor valor es: " << menor << endl;
    return 0;
}`,
      expectedOutput: "El menor valor es: 7",
      hint: "Compara `datos[i] < menor` y actualiza la variable `menor`."
    },
    {
      id: "reto_matrices",
      title: "Reto 3: Suma de la Diagonal Principal",
      category: "Matrices 2D",
      difficulty: "Medio",
      prompt: "Dada una matriz de 3x3, suma los elementos donde la fila es igual a la columna (matriz[i][i]). Imprime la suma de la diagonal principal.",
      initialCode: `#include <iostream>
using namespace std;

int main() {
    int matriz[3][3] = {
        {4, 1, 9},
        {2, 6, 8},
        {5, 3, 7}
    };

    int sumaDiagonal = 0;

    // TODO: Suma los elementos de la diagonal principal
    for (int i = 0; i < 3; i++) {
        sumaDiagonal += matriz[i][i];
    }

    cout << "Suma diagonal: " << sumaDiagonal << endl;
    return 0;
}`,
      expectedOutput: "Suma diagonal: 17",
      hint: "En la diagonal principal, el índice de fila y columna coinciden: `matriz[i][i]` (4 + 6 + 7 = 17)."
    },
    {
      id: "reto_structs",
      title: "Reto 4: Registro de Productos e Inventario",
      category: "Structs",
      difficulty: "Medio",
      prompt: "Crea una estructura `Producto` con nombre (string), precio (int) y stock (int). Calcula el valor total del inventario de 2 productos (precio * stock).",
      initialCode: `#include <iostream>
#include <string>
using namespace std;

struct Producto {
    string nombre;
    int precio;
    int stock;
};

int main() {
    Producto p1;
    p1.nombre = "Teclado";
    p1.precio = 50;
    p1.stock = 4;

    Producto p2;
    p2.nombre = "Raton";
    p2.precio = 25;
    p2.stock = 6;

    int total = (p1.precio * p1.stock) + (p2.precio * p2.stock);

    cout << "Valor total inventario: " << total << endl;
    return 0;
}`,
      expectedOutput: "Valor total inventario: 350",
      hint: "Multiplica precio por stock de cada producto y súmalos: (50*4) + (25*6) = 200 + 150 = 350."
    },
    {
      id: "reto_archivos",
      title: "Reto 5: Lectura de numeros.txt con atoi",
      category: "Archivos (fstream)",
      difficulty: "Desafiante",
      prompt: 'Abre el archivo "numeros.txt", que contiene filas de números separados por comas. Lee los primeros números de cada fila usando getline con coma y súmalos usando atoi. (El archivo numeros.txt tiene en la primera columna los valores: 10, 12, 8).',
      initialCode: `#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
using namespace std;

int main() {
    ifstream archivo("numeros.txt");
    string valorStr;
    string restoLinea;
    int suma = 0;

    // Leemos la primera columna de cada fila
    while (getline(archivo, valorStr, ',')) {
        int num = atoi(valorStr.c_str());
        suma += num;
        getline(archivo, restoLinea); // Consumir el resto de la linea
    }

    archivo.close();
    cout << "Suma primera columna: " << suma << endl;
    return 0;
}`,
      expectedOutput: "Suma primera columna: 30",
      hint: "En cada fila lee el primer token con `,`, conviértelo con `atoi`, y luego usa `getline(archivo, restoLinea)` para saltar al final de la línea."
    }
  ];

  // js/app.js
  class App {
    constructor() {
      this.vfs = new VirtualFileSystem;
      this.snapshots = [];
      this.currentStep = -1;
      this.isPlaying = false;
      this.playTimer = null;
      this.playSpeedMs = 700;
      this.activeVisualTab = "arrays";
      this.initDOM();
      this.initEditor();
      this.initVisualizers();
      this.bindEvents();
      this.loadExample(EXAMPLES[0].id);
    }
    initDOM() {
      this.dom = {
        themeToggle: document.getElementById("themeToggle"),
        examplesSelect: document.getElementById("examplesSelect"),
        challengesBtn: document.getElementById("challengesBtn"),
        cheatsheetBtn: document.getElementById("cheatsheetBtn"),
        btnRun: document.getElementById("btnRun"),
        btnPrev: document.getElementById("btnPrev"),
        btnNext: document.getElementById("btnNext"),
        btnPlay: document.getElementById("btnPlay"),
        btnReset: document.getElementById("btnReset"),
        stepSlider: document.getElementById("stepSlider"),
        stepCounter: document.getElementById("stepCounter"),
        speedSelect: document.getElementById("speedSelect"),
        stepBanner: document.getElementById("stepBanner"),
        stepLineTag: document.getElementById("stepLineTag"),
        stepActionTag: document.getElementById("stepActionTag"),
        stepDescription: document.getElementById("stepDescription"),
        consoleOutput: document.getElementById("consoleOutput"),
        stdinInput: document.getElementById("stdinInput"),
        tabBtns: document.querySelectorAll(".vis-tab-btn"),
        tabPanes: {
          arrays: document.getElementById("paneArrays"),
          matrices: document.getElementById("paneMatrices"),
          structs: document.getElementById("paneStructs"),
          fstream: document.getElementById("paneFstream"),
          memory: document.getElementById("paneMemory")
        },
        challengesModal: document.getElementById("challengesModal"),
        challengesClose: document.getElementById("challengesClose"),
        challengesList: document.getElementById("challengesList"),
        cheatsheetModal: document.getElementById("cheatsheetModal"),
        cheatsheetClose: document.getElementById("cheatsheetClose"),
        vfsModal: document.getElementById("vfsModal"),
        vfsBtn: document.getElementById("vfsBtn"),
        vfsClose: document.getElementById("vfsClose"),
        vfsFileList: document.getElementById("vfsFileList"),
        vfsFileContent: document.getElementById("vfsFileContent"),
        vfsSaveBtn: document.getElementById("vfsSaveBtn"),
        vfsCurrentFileName: document.getElementById("vfsCurrentFileName")
      };
      this.populateExamplesDropdown();
      this.setupTheme();
    }
    setupTheme() {
      const savedTheme = localStorage.getItem("cpp_visual_theme") || "dark";
      if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        this.dom.themeToggle.textContent = "\uD83C\uDF19";
      } else {
        document.body.classList.remove("light-theme");
        this.dom.themeToggle.textContent = "☀️";
      }
      this.dom.themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        this.dom.themeToggle.textContent = isLight ? "\uD83C\uDF19" : "☀️";
        localStorage.setItem("cpp_visual_theme", isLight ? "light" : "dark");
      });
    }
    populateExamplesDropdown() {
      let currentCat = "";
      let html = "";
      for (const ex of EXAMPLES) {
        if (ex.category !== currentCat) {
          if (currentCat !== "")
            html += "</optgroup>";
          currentCat = ex.category;
          html += `<optgroup label="${currentCat}">`;
        }
        html += `<option value="${ex.id}">${ex.title}</option>`;
      }
      if (currentCat !== "")
        html += "</optgroup>";
      this.dom.examplesSelect.innerHTML = html;
    }
    initEditor() {
      const editorContainer = document.getElementById("editorContainer");
      this.editor = new CodeEditor(editorContainer, EXAMPLES[0].code);
      this.editor.onChange(() => {
        this.stopPlayback();
        this.snapshots = [];
        this.currentStep = -1;
        this.updateStepControls();
      });
    }
    initVisualizers() {
      this.memoryView = new MemoryView(this.dom.tabPanes.memory);
      this.arrayView = new ArrayView(this.dom.tabPanes.arrays);
      this.matrixView = new MatrixView(this.dom.tabPanes.matrices);
      this.structView = new StructView(this.dom.tabPanes.structs);
      this.fileStreamView = new FileStreamView(this.dom.tabPanes.fstream);
    }
    bindEvents() {
      this.dom.examplesSelect.addEventListener("change", (e) => {
        this.loadExample(e.target.value);
      });
      this.dom.btnRun.addEventListener("click", () => this.runCode());
      this.dom.btnNext.addEventListener("click", () => this.stepNext());
      this.dom.btnPrev.addEventListener("click", () => this.stepPrev());
      this.dom.btnPlay.addEventListener("click", () => this.togglePlay());
      this.dom.btnReset.addEventListener("click", () => this.resetExecution());
      this.dom.stepSlider.addEventListener("input", (e) => {
        const targetStep = parseInt(e.target.value, 10);
        this.goToStep(targetStep);
      });
      this.dom.speedSelect.addEventListener("change", (e) => {
        this.playSpeedMs = parseInt(e.target.value, 10);
        if (this.isPlaying) {
          this.stopPlayback();
          this.startPlayback();
        }
      });
      this.dom.tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.dom.tabBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const tabName = btn.getAttribute("data-tab");
          this.activeVisualTab = tabName;
          Object.values(this.dom.tabPanes).forEach((pane) => pane.classList.remove("active"));
          if (this.dom.tabPanes[tabName]) {
            this.dom.tabPanes[tabName].classList.add("active");
          }
          if (this.currentStep >= 0 && this.snapshots[this.currentStep]) {
            this.renderActiveVisualizer(this.snapshots[this.currentStep]);
          }
        });
      });
      this.dom.challengesBtn.addEventListener("click", () => this.openChallengesModal());
      this.dom.challengesClose.addEventListener("click", () => this.dom.challengesModal.classList.remove("open"));
      this.dom.cheatsheetBtn.addEventListener("click", () => this.dom.cheatsheetModal.classList.add("open"));
      this.dom.cheatsheetClose.addEventListener("click", () => this.dom.cheatsheetModal.classList.remove("open"));
      this.dom.vfsBtn.addEventListener("click", () => this.openVfsModal());
      this.dom.vfsClose.addEventListener("click", () => this.dom.vfsModal.classList.remove("open"));
      this.dom.vfsSaveBtn.addEventListener("click", () => this.saveVfsFile());
      window.addEventListener("click", (e) => {
        if (e.target === this.dom.challengesModal)
          this.dom.challengesModal.classList.remove("open");
        if (e.target === this.dom.cheatsheetModal)
          this.dom.cheatsheetModal.classList.remove("open");
        if (e.target === this.dom.vfsModal)
          this.dom.vfsModal.classList.remove("open");
      });
    }
    loadExample(exampleId) {
      const example = EXAMPLES.find((e) => e.id === exampleId);
      if (!example)
        return;
      this.stopPlayback();
      this.editor.setValue(example.code);
      this.snapshots = [];
      this.currentStep = -1;
      this.updateStepControls();
      if (exampleId.includes("matrices"))
        this.switchTab("matrices");
      else if (exampleId.includes("structs"))
        this.switchTab("structs");
      else if (exampleId.includes("fstream") || exampleId.includes("csv"))
        this.switchTab("fstream");
      else if (exampleId.includes("arreglos"))
        this.switchTab("arrays");
      else
        this.switchTab("memory");
      this.runCode();
    }
    switchTab(tabName) {
      this.activeVisualTab = tabName;
      this.dom.tabBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
      });
      Object.keys(this.dom.tabPanes).forEach((name) => {
        this.dom.tabPanes[name].classList.toggle("active", name === tabName);
      });
    }
    runCode() {
      this.stopPlayback();
      const sourceCode = this.editor.getValue();
      const stdin = this.dom.stdinInput.value;
      try {
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parseProgram();
        const runtime = new Runtime(ast, this.vfs, stdin);
        this.snapshots = runtime.run();
        if (this.snapshots.length === 0) {
          this.showError("No se generaron pasos de ejecución. Asegúrate de incluir 'int main() { ... }'.");
          return;
        }
        this.currentStep = 0;
        this.applySnapshot(this.snapshots[0]);
        this.updateStepControls();
        this.autoSelectRelevantTab(this.snapshots[this.snapshots.length - 1]);
      } catch (err) {
        this.showError(err.message);
      }
    }
    autoSelectRelevantTab(lastSnap) {
      if (!lastSnap)
        return;
      if (lastSnap.vfsState && lastSnap.vfsState.openFiles.length > 0) {
        this.switchTab("fstream");
      } else if (Object.keys(lastSnap.matrices2D).length > 0) {
        this.switchTab("matrices");
      } else if (Object.keys(lastSnap.structs).length > 0) {
        this.switchTab("structs");
      } else if (Object.keys(lastSnap.arrays1D).length > 0) {
        this.switchTab("arrays");
      }
    }
    stepNext() {
      if (this.currentStep < this.snapshots.length - 1) {
        this.goToStep(this.currentStep + 1);
      } else {
        this.stopPlayback();
      }
    }
    stepPrev() {
      if (this.currentStep > 0) {
        this.goToStep(this.currentStep - 1);
      }
    }
    goToStep(stepIndex) {
      if (stepIndex < 0 || stepIndex >= this.snapshots.length)
        return;
      this.currentStep = stepIndex;
      this.applySnapshot(this.snapshots[stepIndex]);
      this.updateStepControls();
    }
    resetExecution() {
      this.stopPlayback();
      if (this.snapshots.length > 0) {
        this.goToStep(0);
      }
    }
    togglePlay() {
      if (this.isPlaying) {
        this.stopPlayback();
      } else {
        if (this.currentStep >= this.snapshots.length - 1) {
          this.goToStep(0);
        }
        this.startPlayback();
      }
    }
    startPlayback() {
      this.isPlaying = true;
      this.dom.btnPlay.innerHTML = "⏸ Pausa";
      this.dom.btnPlay.classList.add("btn-playing");
      this.playTimer = setInterval(() => {
        if (this.currentStep < this.snapshots.length - 1) {
          this.stepNext();
        } else {
          this.stopPlayback();
        }
      }, this.playSpeedMs);
    }
    stopPlayback() {
      this.isPlaying = false;
      if (this.playTimer) {
        clearInterval(this.playTimer);
        this.playTimer = null;
      }
      this.dom.btnPlay.innerHTML = "▶ Reproducir";
      this.dom.btnPlay.classList.remove("btn-playing");
    }
    applySnapshot(snap) {
      if (!snap)
        return;
      this.editor.setActiveLine(snap.line);
      this.dom.stepLineTag.textContent = `Línea ${snap.line}`;
      this.dom.stepActionTag.textContent = snap.action;
      this.dom.stepDescription.textContent = snap.description;
      this.dom.consoleOutput.textContent = snap.consoleOutput || "(Consola vacía)";
      this.renderAllVisualizers(snap);
    }
    renderAllVisualizers(snap) {
      this.memoryView.render(snap);
      this.arrayView.render(snap);
      this.matrixView.render(snap);
      this.structView.render(snap);
      this.fileStreamView.render(snap);
    }
    renderActiveVisualizer(snap) {
      if (this.activeVisualTab === "arrays")
        this.arrayView.render(snap);
      else if (this.activeVisualTab === "matrices")
        this.matrixView.render(snap);
      else if (this.activeVisualTab === "structs")
        this.structView.render(snap);
      else if (this.activeVisualTab === "fstream")
        this.fileStreamView.render(snap);
      else if (this.activeVisualTab === "memory")
        this.memoryView.render(snap);
    }
    updateStepControls() {
      const total = this.snapshots.length;
      const cur = this.currentStep;
      this.dom.stepSlider.min = 0;
      this.dom.stepSlider.max = Math.max(0, total - 1);
      this.dom.stepSlider.value = cur >= 0 ? cur : 0;
      if (total === 0) {
        this.dom.stepCounter.textContent = "Paso 0 de 0";
        this.dom.btnPrev.disabled = true;
        this.dom.btnNext.disabled = true;
        this.dom.btnPlay.disabled = true;
        this.dom.btnReset.disabled = true;
      } else {
        this.dom.stepCounter.textContent = `Paso ${cur + 1} de ${total}`;
        this.dom.btnPrev.disabled = cur <= 0;
        this.dom.btnNext.disabled = cur >= total - 1;
        this.dom.btnPlay.disabled = false;
        this.dom.btnReset.disabled = cur === 0;
      }
    }
    showError(msg) {
      this.editor.clearActiveLine();
      this.dom.stepLineTag.textContent = "Error";
      this.dom.stepActionTag.textContent = "Sintaxis / Ejecución";
      this.dom.stepDescription.textContent = msg;
      this.dom.consoleOutput.textContent = `❌ ${msg}`;
    }
    openChallengesModal() {
      let html = "";
      for (const c of CHALLENGES) {
        html += `
        <div class="challenge-card" data-id="${c.id}">
          <div class="challenge-header">
            <div>
              <span class="badge badge-info">${c.category}</span>
              <span class="badge badge-secondary">${c.difficulty}</span>
              <h3 class="challenge-title">${c.title}</h3>
            </div>
            <button class="btn btn-primary btn-load-challenge" data-id="${c.id}">Cargar Reto</button>
          </div>
          <p class="challenge-prompt">${c.prompt}</p>
          <div class="challenge-meta">
            <span><strong>Salida esperada:</strong> <code>${c.expectedOutput}</code></span>
            <small class="challenge-hint">\uD83D\uDCA1 <em>Pista: ${c.hint}</em></small>
          </div>
        </div>
      `;
      }
      this.dom.challengesList.innerHTML = html;
      const loadBtns = this.dom.challengesList.querySelectorAll(".btn-load-challenge");
      loadBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const ch = CHALLENGES.find((c) => c.id === id);
          if (ch) {
            this.editor.setValue(ch.initialCode);
            this.dom.challengesModal.classList.remove("open");
            this.runCode();
          }
        });
      });
      this.dom.challengesModal.classList.add("open");
    }
    openVfsModal() {
      const files = this.vfs.listFiles();
      let tabsHtml = "";
      for (const f of files) {
        tabsHtml += `<button class="vfs-file-btn" data-file="${f}">\uD83D\uDCC4 ${f}</button>`;
      }
      this.dom.vfsFileList.innerHTML = tabsHtml;
      const fileBtns = this.dom.vfsFileList.querySelectorAll(".vfs-file-btn");
      fileBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const fname = btn.getAttribute("data-file");
          this.showVfsFile(fname);
        });
      });
      if (files.length > 0) {
        this.showVfsFile(files[0]);
      }
      this.dom.vfsModal.classList.add("open");
    }
    showVfsFile(fname) {
      this.dom.vfsCurrentFileName.textContent = fname;
      this.dom.vfsFileContent.value = this.vfs.getFile(fname) ?? "";
      const fileBtns = this.dom.vfsFileList.querySelectorAll(".vfs-file-btn");
      fileBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-file") === fname));
    }
    saveVfsFile() {
      const fname = this.dom.vfsCurrentFileName.textContent;
      const content = this.dom.vfsFileContent.value;
      this.vfs.setFile(fname, content);
      this.dom.vfsModal.classList.remove("open");
      this.runCode();
    }
  }
  window.addEventListener("DOMContentLoaded", () => {
    window.app = new App;
  });
})();
