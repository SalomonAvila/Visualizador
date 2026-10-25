// Parser de C++ para nivel introductorio
import { TokenType } from './lexer.js';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.customTypes = new Set(); // Struct names
  }

  current() {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, col: 0 };
  }

  peek(offset = 1) {
    return this.tokens[this.pos + offset] || { type: TokenType.EOF, value: '', line: 0, col: 0 };
  }

  match(...expected) {
    const cur = this.current();
    for (const exp of expected) {
      if (typeof exp === 'string') {
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
    if (!token) return false;
    return token.type === TokenType.TYPE || this.customTypes.has(token.value);
  }

  parseProgram() {
    const program = {
      type: 'Program',
      includes: [],
      structs: [],
      functions: [],
      globalStatements: []
    };

    while (this.current().type !== TokenType.EOF) {
      const cur = this.current();

      // Directivas #include
      if (cur.type === TokenType.KEYWORD && cur.value.startsWith('#')) {
        program.includes.push(cur.value);
        this.pos++;
        continue;
      }

      // using namespace std;
      if (cur.value === 'using') {
        this.pos++;
        if (this.current().value === 'namespace') this.pos++;
        if (this.current().value === 'std') this.pos++;
        this.match(';');
        continue;
      }

      // Definición de struct
      if (cur.value === 'struct') {
        const structDef = this.parseStructDefinition();
        program.structs.push(structDef);
        this.customTypes.add(structDef.name);
        continue;
      }

      // Declaración de función o variable global
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
    if (this.peek(offset).value === '&') offset++;
    const nameTok = this.peek(offset);
    if (!nameTok || nameTok.type !== TokenType.IDENTIFIER) return false;
    offset++;
    if (this.peek(offset).value !== '(') return false;

    // Buscar el ')' correspondiente
    let depth = 1;
    offset++;
    while (offset < 100 && this.peek(offset).type !== TokenType.EOF) {
      const tok = this.peek(offset);
      if (tok.value === '(') depth++;
      else if (tok.value === ')') {
        depth--;
        if (depth === 0) {
          // El siguiente token debe ser '{' para ser definición de función
          const afterParen = this.peek(offset + 1);
          return afterParen && afterParen.value === '{';
        }
      }
      offset++;
    }
    return false;
  }

  parseStructDefinition() {
    const startTok = this.expect('struct', "Se esperaba 'struct'");
    const nameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba el nombre de la estructura");
    this.expect('{', "Se esperaba '{' tras nombre del struct");

    const fields = [];
    while (this.current().value !== '}' && this.current().type !== TokenType.EOF) {
      const fieldTypeTok = this.current();
      if (!this.isType(fieldTypeTok)) {
        throw new Error(`Línea ${fieldTypeTok.line}: Tipo inválido en struct '${fieldTypeTok.value}'`);
      }
      this.pos++;
      const fieldNameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre del campo");
      this.expect(';', "Se esperaba ';' al final de la declaración del campo");
      fields.push({
        type: fieldTypeTok.value,
        name: fieldNameTok.value,
        line: fieldNameTok.line
      });
    }

    this.expect('}', "Se esperaba '}' cerrando el struct");
    this.expect(';', "Se esperaba ';' después de la definición del struct");

    return {
      type: 'StructDefinition',
      name: nameTok.value,
      fields,
      line: startTok.line
    };
  }

  parseFunction() {
    const returnTypeTok = this.current();
    this.pos++;
    const nameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre de función");
    this.expect('(', "Se esperaba '(' tras nombre de función");

    const params = [];
    if (this.current().value !== ')') {
      while (true) {
        const paramTypeTok = this.current();
        if (!this.isType(paramTypeTok)) {
          throw new Error(`Línea ${paramTypeTok.line}: Tipo de parámetro inválido '${paramTypeTok.value}'`);
        }
        this.pos++;
        let isRef = false;
        if (this.current().value === '&') {
          isRef = true;
          this.pos++;
        }
        const paramNameTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre de parámetro");
        
        let isArray = false;
        if (this.current().value === '[') {
          this.pos++;
          this.expect(']', "Se esperaba ']'");
          isArray = true;
        }

        params.push({
          type: paramTypeTok.value,
          name: paramNameTok.value,
          isRef,
          isArray,
          line: paramNameTok.line
        });

        if (this.current().value === ',') {
          this.pos++;
        } else {
          break;
        }
      }
    }
    this.expect(')', "Se esperaba ')' cerrando parámetros");

    const body = this.parseBlock();

    return {
      type: 'FunctionDefinition',
      returnType: returnTypeTok.value,
      name: nameTok.value,
      params,
      body,
      line: nameTok.line
    };
  }

  parseBlock() {
    this.expect('{', "Se esperaba '{' para iniciar bloque");
    const statements = [];
    while (this.current().value !== '}' && this.current().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    this.expect('}', "Se esperaba '}' para cerrar bloque");
    return {
      type: 'Block',
      statements
    };
  }

  parseStatement() {
    const cur = this.current();

    // Bloque anidado { ... }
    if (cur.value === '{') {
      return this.parseBlock();
    }

    // if (cond) { ... } else { ... }
    if (cur.value === 'if') {
      return this.parseIfStatement();
    }

    // while (cond) { ... }
    if (cur.value === 'while') {
      return this.parseWhileStatement();
    }

    // do { ... } while (cond);
    if (cur.value === 'do') {
      return this.parseDoWhileStatement();
    }

    // for (init; cond; update) { ... }
    if (cur.value === 'for') {
      return this.parseForStatement();
    }

    // return [expr];
    if (cur.value === 'return') {
      const line = cur.line;
      this.pos++;
      let expr = null;
      if (this.current().value !== ';') {
        expr = this.parseExpression();
      }
      this.expect(';', "Se esperaba ';' al final de return");
      return { type: 'ReturnStatement', expr, line };
    }

    // break;
    if (cur.value === 'break') {
      const line = cur.line;
      this.pos++;
      this.expect(';', "Se esperaba ';' después de break");
      return { type: 'BreakStatement', line };
    }

    // continue;
    if (cur.value === 'continue') {
      const line = cur.line;
      this.pos++;
      this.expect(';', "Se esperaba ';' después de continue");
      return { type: 'ContinueStatement', line };
    }

    // cout << ...
    if (cur.value === 'cout') {
      return this.parseCoutStatement();
    }

    // cin >> ...
    if (cur.value === 'cin') {
      return this.parseCinStatement();
    }

    // Archivo stream salida << ... (ej. archivoSalida << x << endl;)
    if (cur.type === TokenType.IDENTIFIER && this.peek(1).value === '<<') {
      return this.parseFileStreamStatement();
    }

    // Declaración de variable / arreglo / matriz / struct / stream
    if (this.isType(cur)) {
      return this.parseDeclaration();
    }

    // Sentencia de expresión (asignaciones, llamadas a función, getline, etc.)
    const expr = this.parseExpression();
    this.expect(';', "Se esperaba ';' después de la expresión");
    return {
      type: 'ExpressionStatement',
      expression: expr,
      line: cur.line
    };
  }

  parseIfStatement() {
    const ifTok = this.expect('if');
    this.expect('(', "Se esperaba '(' tras if");
    const condition = this.parseExpression();
    this.expect(')', "Se esperaba ')' tras condición de if");

    let consequent;
    if (this.current().value === '{') {
      consequent = this.parseBlock();
    } else {
      consequent = { type: 'Block', statements: [this.parseStatement()] };
    }

    let alternate = null;
    if (this.current().value === 'else') {
      this.pos++;
      if (this.current().value === 'if') {
        alternate = this.parseIfStatement();
      } else if (this.current().value === '{') {
        alternate = this.parseBlock();
      } else {
        alternate = { type: 'Block', statements: [this.parseStatement()] };
      }
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: ifTok.line
    };
  }

  parseWhileStatement() {
    const whileTok = this.expect('while');
    this.expect('(', "Se esperaba '(' tras while");
    const condition = this.parseExpression();
    this.expect(')', "Se esperaba ')' tras condición de while");

    let body;
    if (this.current().value === '{') {
      body = this.parseBlock();
    } else {
      body = { type: 'Block', statements: [this.parseStatement()] };
    }

    return {
      type: 'WhileStatement',
      condition,
      body,
      line: whileTok.line
    };
  }

  parseDoWhileStatement() {
    const doTok = this.expect('do');
    let body;
    if (this.current().value === '{') {
      body = this.parseBlock();
    } else {
      body = { type: 'Block', statements: [this.parseStatement()] };
    }

    this.expect('while', "Se esperaba 'while' tras bloque 'do'");
    this.expect('(', "Se esperaba '('");
    const condition = this.parseExpression();
    this.expect(')', "Se esperaba ')'");
    this.expect(';', "Se esperaba ';' al final de 'do-while'");

    return {
      type: 'DoWhileStatement',
      condition,
      body,
      line: doTok.line
    };
  }

  parseForStatement() {
    const forTok = this.expect('for');
    this.expect('(', "Se esperaba '(' tras for");

    // Init
    let init = null;
    if (this.current().value === ';') {
      this.pos++;
    } else if (this.isType(this.current())) {
      init = this.parseDeclaration();
    } else {
      init = this.parseExpression();
      this.expect(';', "Se esperaba ';' tras init de for");
    }

    // Condition
    let condition = null;
    if (this.current().value !== ';') {
      condition = this.parseExpression();
    }
    this.expect(';', "Se esperaba ';' tras condición de for");

    // Update
    let update = null;
    if (this.current().value !== ')') {
      update = this.parseExpression();
    }
    this.expect(')', "Se esperaba ')' tras cláusula de for");

    let body;
    if (this.current().value === '{') {
      body = this.parseBlock();
    } else {
      body = { type: 'Block', statements: [this.parseStatement()] };
    }

    return {
      type: 'ForStatement',
      init,
      condition,
      update,
      body,
      line: forTok.line
    };
  }

  parseCoutStatement() {
    const coutTok = this.expect('cout');
    const elements = [];

    while (this.current().value === '<<') {
      this.pos++;
      if (this.current().value === 'endl') {
        elements.push({ type: 'Endl', line: this.current().line });
        this.pos++;
      } else {
        elements.push(this.parseShift());
      }
    }

    this.expect(';', "Se esperaba ';' al final de cout");
    return {
      type: 'CoutStatement',
      elements,
      line: coutTok.line
    };
  }

  parseFileStreamStatement() {
    const streamNameTok = this.expect(TokenType.IDENTIFIER);
    const elements = [];

    while (this.current().value === '<<') {
      this.pos++;
      if (this.current().value === 'endl') {
        elements.push({ type: 'Endl', line: this.current().line });
        this.pos++;
      } else {
        elements.push(this.parseShift());
      }
    }

    this.expect(';', "Se esperaba ';' al final de la escritura en archivo");
    return {
      type: 'FileStreamStatement',
      streamName: streamNameTok.value,
      elements,
      line: streamNameTok.line
    };
  }

  parseCinStatement() {
    const cinTok = this.expect('cin');
    const targets = [];

    while (this.current().value === '>>') {
      this.pos++;
      targets.push(this.parseTargetExpression());
    }

    this.expect(';', "Se esperaba ';' al final de cin");
    return {
      type: 'CinStatement',
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

      // Arreglos o matrices: [dim1] o [dim1][dim2]
      while (this.current().value === '[') {
        this.pos++;
        let dimSizeExpr = null;
        if (this.current().value !== ']') {
          dimSizeExpr = this.parseExpression();
        }
        this.expect(']', "Se esperaba ']'");
        dims.push(dimSizeExpr);
      }

      let initializer = null;
      let fileInitArg = null;

      // Constructor de ifstream/ofstream: ifstream arch("datos.txt");
      if (['ifstream', 'ofstream', 'fstream'].includes(typeTok.value) && this.current().value === '(') {
        this.pos++;
        fileInitArg = this.parseExpression();
        this.expect(')', "Se esperaba ')'");
      } else if (this.current().value === '=') {
        this.pos++;
        if (this.current().value === '{') {
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

      if (this.current().value === ',') {
        this.pos++;
      } else {
        break;
      }
    }

    this.expect(';', "Se esperaba ';' al final de la declaración");

    return {
      type: 'VariableDeclaration',
      varType: typeTok.value,
      variables,
      line: typeTok.line
    };
  }

  parseListInitializer() {
    this.expect('{');
    const items = [];
    while (this.current().value !== '}' && this.current().type !== TokenType.EOF) {
      if (this.current().value === '{') {
        items.push(this.parseListInitializer());
      } else {
        items.push(this.parseExpression());
      }
      if (this.current().value === ',') {
        this.pos++;
      } else {
        break;
      }
    }
    this.expect('}');
    return {
      type: 'ListInitializer',
      items
    };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseLogicalOr();

    const cur = this.current();
    if (['=', '+=', '-=', '*=', '/=', '%='].includes(cur.value)) {
      const op = cur.value;
      this.pos++;
      const right = this.parseAssignment();
      return {
        type: 'AssignmentExpression',
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
    while (this.current().value === '||') {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.current().value === '&&') {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseRelational();
    while (['==', '!='].includes(this.current().value)) {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseRelational();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseRelational() {
    let left = this.parseShift();
    while (['<', '<=', '>', '>='].includes(this.current().value)) {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseShift();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseShift() {
    let left = this.parseAdditive();
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (['+', '-'].includes(this.current().value)) {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.current().value)) {
      const op = this.current().value;
      const line = this.current().line;
      this.pos++;
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator: op, left, right, line };
    }
    return left;
  }

  parseUnary() {
    const cur = this.current();
    if (['!', '-', '+', '++', '--'].includes(cur.value)) {
      this.pos++;
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
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
      // Indexación: expr[idx]
      if (this.current().value === '[') {
        this.pos++;
        const indexExpr = this.parseExpression();
        this.expect(']', "Se esperaba ']' tras índice");
        expr = {
          type: 'IndexAccess',
          object: expr,
          index: indexExpr,
          line: expr.line
        };
        continue;
      }

      // Acceso a miembro de struct: expr.miembro
      if (this.current().value === '.') {
        this.pos++;
        const memberTok = this.expect(TokenType.IDENTIFIER, "Se esperaba nombre del campo tras '.'");
        expr = {
          type: 'MemberAccess',
          object: expr,
          member: memberTok.value,
          line: memberTok.line
        };
        continue;
      }

      // Llamada a función: expr(arg1, arg2)
      if (this.current().value === '(') {
        this.pos++;
        const args = [];
        if (this.current().value !== ')') {
          while (true) {
            args.push(this.parseExpression());
            if (this.current().value === ',') {
              this.pos++;
            } else {
              break;
            }
          }
        }
        this.expect(')', "Se esperaba ')' cerrando argumentos");
        expr = {
          type: 'CallExpression',
          callee: expr,
          args,
          line: expr.line
        };
        continue;
      }

      // Post-incremento y post-decremento (x++, x--)
      if (['++', '--'].includes(this.current().value)) {
        const op = this.current().value;
        const line = this.current().line;
        this.pos++;
        expr = {
          type: 'UnaryExpression',
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

    // Paréntesis ( expr )
    if (cur.value === '(') {
      this.pos++;
      const expr = this.parseExpression();
      this.expect(')', "Se esperaba ')' tras expresión");
      return expr;
    }

    // Literales primitivos
    if (cur.type === TokenType.NUMBER) {
      this.pos++;
      return { type: 'Literal', value: cur.value, rawType: 'number', line: cur.line };
    }
    if (cur.type === TokenType.STRING) {
      this.pos++;
      return { type: 'Literal', value: cur.value, rawType: 'string', line: cur.line };
    }
    if (cur.type === TokenType.CHAR) {
      this.pos++;
      return { type: 'Literal', value: cur.value, rawType: 'char', line: cur.line };
    }
    if (cur.type === TokenType.BOOLEAN) {
      this.pos++;
      return { type: 'Literal', value: cur.value, rawType: 'bool', line: cur.line };
    }

    // Llamadas especiales del curso: getline, atoi, atol, atof, stoi
    if (['getline', 'atoi', 'atol', 'atof', 'stoi', 'stof'].includes(cur.value)) {
      const funcName = cur.value;
      const line = cur.line;
      this.pos++;
      this.expect('(', `Se esperaba '(' tras ${funcName}`);
      const args = [];
      if (this.current().value !== ')') {
        while (true) {
          args.push(this.parseExpression());
          if (this.current().value === ',') {
            this.pos++;
          } else {
            break;
          }
        }
      }
      this.expect(')', `Se esperaba ')' tras argumentos de ${funcName}`);
      return {
        type: 'BuiltinCall',
        name: funcName,
        args,
        line
      };
    }

    // Identificador
    if (cur.type === TokenType.IDENTIFIER) {
      this.pos++;
      return {
        type: 'Identifier',
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
