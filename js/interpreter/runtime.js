// Motor de Ejecución Paso a Paso (Runtime) para C++ Introductorio
import { VirtualFileSystem } from './vfs.js';

export class ExecutionContext {
  constructor(vfs, stdinInput = '') {
    this.vfs = vfs;
    this.stdinInput = stdinInput;
    this.stdinTokens = stdinInput.trim().split(/\s+/).filter(Boolean);
    this.stdinIndex = 0;
    this.stdout = '';
    
    this.structDefs = new Map(); // name -> { fields: [...] }
    this.functions = new Map();  // name -> FunctionDefinition AST node

    // Call stack
    this.callStack = [];

    // Global scope
    this.globalFrame = this.createFrame('<global>');
    this.callStack.push(this.globalFrame);

    // Registro de snapshots
    this.snapshots = [];
    this.maxSteps = 1500;
    this.stepCount = 0;
    this.terminated = false;
  }

  createFrame(functionName) {
    return {
      functionName,
      variables: {},      // name -> value (primitive / string)
      arrays1D: {},       // name -> { type, size, values: [] }
      matrices2D: {},     // name -> { type, rows, cols, values: [[]] }
      structs: {},        // name -> { typeName, fields: {}, isArray: bool, items?: [] }
      streams: {},        // name -> handleId
      activePointers: {}, // name -> number (por ejemplo i: 2, j: 0)
      lastArrayAccess: null,   // { name, index, type: 'read' | 'write' }
      lastMatrixAccess: null,  // { name, row, col, type: 'read' | 'write' }
      lastStructAccess: null   // { name, field, index?: number, type: 'read' | 'write' }
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

    // Copias profundas seguras para el snapshot
    const stackCopy = this.callStack.map(frame => ({
      functionName: frame.functionName,
      variables: { ...frame.variables }
    }));

    // Recolectar arreglos del frame actual y globales
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

    // Recolectar matrices 2D
    const matrices2DCopy = {};
    for (const frame of this.callStack) {
      for (const [name, mat] of Object.entries(frame.matrices2D)) {
        matrices2DCopy[name] = {
          type: mat.type,
          rows: mat.rows,
          cols: mat.cols,
          values: mat.values.map(row => [...row]),
          lastAccess: frame.lastMatrixAccess?.name === name ? { ...frame.lastMatrixAccess } : null
        };
      }
    }

    // Recolectar structs
    const structsCopy = {};
    for (const frame of this.callStack) {
      for (const [name, st] of Object.entries(frame.structs)) {
        if (st.isArray) {
          structsCopy[name] = {
            typeName: st.typeName,
            isArray: true,
            items: st.items.map(item => ({ ...item }))
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

    // Extraer variables que son índices de ciclos (ej. i, j, k, pos, fila, col)
    const activePointers = {};
    for (const frame of this.callStack) {
      for (const [varName, val] of Object.entries(frame.variables)) {
        if (typeof val === 'number' && Number.isInteger(val)) {
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

export class Runtime {
  constructor(ast, vfs = new VirtualFileSystem(), stdinInput = '') {
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
      this.ctx.recordSnapshot(
        this.ctx.snapshots.length > 0 ? this.ctx.snapshots[this.ctx.snapshots.length - 1].line : 1,
        'Error de Ejecución',
        err.message
      );
    }
    return this.ctx.snapshots;
  }

  initProgram() {
    // Registrar structs
    for (const structDef of this.ast.structs) {
      this.ctx.structDefs.set(structDef.name, structDef);
    }

    // Registrar funciones
    for (const fn of this.ast.functions) {
      this.ctx.functions.set(fn.name, fn);
    }

    // Ejecutar declaraciones globales
    for (const stmt of this.ast.globalStatements) {
      this.executeStatement(stmt);
    }
  }

  executeMain() {
    const mainFn = this.ctx.functions.get('main');
    if (!mainFn) {
      throw new Error("No se encontró la función 'main()'. Recuerda definir 'int main() { ... }'.");
    }

    const frame = this.ctx.createFrame('main');
    this.ctx.callStack.push(frame);

    this.ctx.recordSnapshot(
      mainFn.line,
      'Inicio de main()',
      'Iniciando ejecución del programa en la función principal main().'
    );

    this.executeBlock(mainFn.body);
  }

  executeBlock(blockNode) {
    for (const stmt of blockNode.statements) {
      const result = this.executeStatement(stmt);
      if (result && (result.type === 'return' || result.type === 'break' || result.type === 'continue')) {
        return result;
      }
    }
    return null;
  }

  executeStatement(stmt) {
    const frame = this.ctx.currentFrame();

    switch (stmt.type) {
      case 'VariableDeclaration':
        return this.executeVariableDeclaration(stmt);

      case 'ExpressionStatement': {
        const val = this.evaluateExpression(stmt.expression);
        return null;
      }

      case 'CoutStatement':
        return this.executeCout(stmt);

      case 'FileStreamStatement':
        return this.executeFileStreamStatement(stmt);

      case 'CinStatement':
        return this.executeCin(stmt);

      case 'IfStatement':
        return this.executeIf(stmt);

      case 'WhileStatement':
        return this.executeWhile(stmt);

      case 'DoWhileStatement':
        return this.executeDoWhile(stmt);

      case 'ForStatement':
        return this.executeFor(stmt);

      case 'ReturnStatement': {
        let returnVal = null;
        if (stmt.expr) {
          returnVal = this.evaluateExpression(stmt.expr);
        }
        this.ctx.recordSnapshot(
          stmt.line,
          'Sentencia return',
          `Finalizando función con valor de retorno: ${returnVal !== null ? returnVal : 'void'}.`
        );
        return { type: 'return', value: returnVal };
      }

      case 'BreakStatement':
        this.ctx.recordSnapshot(
          stmt.line,
          'Sentencia break',
          'Interrumpiendo ejecución del ciclo con break.'
        );
        return { type: 'break' };

      case 'ContinueStatement':
        this.ctx.recordSnapshot(
          stmt.line,
          'Sentencia continue',
          'Saltando a la siguiente iteración del ciclo con continue.'
        );
        return { type: 'continue' };

      case 'Block':
        return this.executeBlock(stmt);

      default:
        return null;
    }
  }

  executeVariableDeclaration(decl) {
    const frame = this.ctx.currentFrame();
    const type = decl.varType;

    for (const v of decl.variables) {
      // 1. Archivo ifstream / ofstream
      if (['ifstream', 'ofstream', 'fstream'].includes(type)) {
        let filename = '';
        if (v.fileInitArg) {
          filename = String(this.evaluateExpression(v.fileInitArg));
        }
        const mode = type === 'ofstream' ? 'out' : 'in';
        const handle = this.ctx.vfs.open(filename, mode);
        frame.streams[v.name] = handle.id;

        this.ctx.recordSnapshot(
          v.line,
          `Apertura de archivo (${type})`,
          `Se creó el flujo de archivo '${v.name}' abriendo el archivo '${filename}' en modo ${mode === 'in' ? 'lectura (ifstream)' : 'escritura (ofstream)'}.`
        );
        continue;
      }

      // 2. Struct o Arreglo de Structs
      if (this.ctx.structDefs.has(type)) {
        const structDef = this.ctx.structDefs.get(type);

        if (v.dims.length === 1) {
          // Arreglo de Structs: Estudiante lista[5];
          const size = Number(this.evaluateExpression(v.dims[0]));
          const items = [];
          for (let i = 0; i < size; i++) {
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
          this.ctx.recordSnapshot(
            v.line,
            'Declaración de arreglo de structs',
            `Se declaró el arreglo de estructuras '${v.name}[${size}]' de tipo '${type}'. Cada elemento cuenta con los campos: [${structDef.fields.map(f => f.name).join(', ')}].`
          );
        } else {
          // Instancia simple de Struct: Estudiante alumno;
          const fields = {};
          for (const f of structDef.fields) {
            fields[f.name] = this.getDefaultValue(f.type);
          }
          frame.structs[v.name] = {
            typeName: type,
            isArray: false,
            fields
          };
          this.ctx.recordSnapshot(
            v.line,
            'Declaración de struct',
            `Se declaró la variable '${v.name}' de tipo '${type}' con campos: [${structDef.fields.map(f => f.name).join(', ')}].`
          );
        }
        continue;
      }

      // 3. Arreglos 1D y Matrices 2D
      if (v.dims.length === 1) {
        // Arreglo 1D: int arr[5];
        const size = Number(this.evaluateExpression(v.dims[0]));
        const values = new Array(size).fill(this.getDefaultValue(type));

        if (v.initializer && v.initializer.type === 'ListInitializer') {
          for (let i = 0; i < Math.min(size, v.initializer.items.length); i++) {
            values[i] = this.castType(this.evaluateExpression(v.initializer.items[i]), type);
          }
        }

        frame.arrays1D[v.name] = {
          type,
          size,
          values
        };

        this.ctx.recordSnapshot(
          v.line,
          'Declaración de arreglo 1D',
          `Se creó el arreglo 1D '${v.name}[${size}]' de tipo '${type}' con posiciones del 0 al ${size - 1}.`
        );
        continue;
      }

      if (v.dims.length === 2) {
        // Matriz 2D: int mat[3][3];
        const rows = Number(this.evaluateExpression(v.dims[0]));
        const cols = Number(this.evaluateExpression(v.dims[1]));
        const values = [];

        for (let r = 0; r < rows; r++) {
          const rowVals = new Array(cols).fill(this.getDefaultValue(type));
          values.push(rowVals);
        }

        if (v.initializer && v.initializer.type === 'ListInitializer') {
          for (let r = 0; r < Math.min(rows, v.initializer.items.length); r++) {
            const rowInit = v.initializer.items[r];
            if (rowInit.type === 'ListInitializer') {
              for (let c = 0; c < Math.min(cols, rowInit.items.length); c++) {
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

        this.ctx.recordSnapshot(
          v.line,
          'Declaración de matriz 2D',
          `Se creó la matriz 2D '${v.name}[${rows}][${cols}]' de tipo '${type}' (${rows} filas x ${cols} columnas).`
        );
        continue;
      }

      // 4. Variables primitivas simples
      let initVal = this.getDefaultValue(type);
      if (v.initializer) {
        initVal = this.castType(this.evaluateExpression(v.initializer), type);
      }
      frame.variables[v.name] = initVal;

      this.ctx.recordSnapshot(
        v.line,
        'Declaración de variable',
        `Se declaró la variable '${v.name}' de tipo '${type}' con valor inicial = ${JSON.stringify(initVal)}.`
      );
    }

    return null;
  }

  executeCout(stmt) {
    let outputText = '';
    for (const elem of stmt.elements) {
      if (elem.type === 'Endl') {
        outputText += '\n';
      } else {
        const val = this.evaluateExpression(elem);
        outputText += String(val);
      }
    }

    this.ctx.stdout += outputText;
    this.ctx.recordSnapshot(
      stmt.line,
      'Salida por consola (cout)',
      `cout imprimió: ${JSON.stringify(outputText).replace(/^"|"$/g, '')}`
    );
    return null;
  }

  executeFileStreamStatement(stmt) {
    const frame = this.ctx.currentFrame();
    const handleId = frame.streams[stmt.streamName] || this.ctx.globalFrame.streams[stmt.streamName];
    let writtenText = '';

    for (const elem of stmt.elements) {
      if (elem.type === 'Endl') {
        writtenText += '\n';
      } else {
        const val = this.evaluateExpression(elem);
        writtenText += String(val);
      }
    }

    this.ctx.vfs.write(handleId, writtenText);
    this.ctx.recordSnapshot(
      stmt.line,
      `Escritura en archivo '${stmt.streamName}'`,
      `Se escribió en el archivo: ${JSON.stringify(writtenText)}.`
    );
    return null;
  }

  executeCin(stmt) {
    for (const target of stmt.targets) {
      let inputVal = '';
      if (this.ctx.stdinIndex < this.ctx.stdinTokens.length) {
        inputVal = this.ctx.stdinTokens[this.ctx.stdinIndex++];
      }

      // Asignar al target
      this.assignToTarget(target, inputVal, stmt.line);
      this.ctx.recordSnapshot(
        stmt.line,
        'Lectura de consola (cin)',
        `cin leyó el dato '${inputVal}' y lo asignó a la variable.`
      );
    }
    return null;
  }

  executeIf(stmt) {
    this.ctx.recordSnapshot(
      stmt.line,
      'Evaluación de condición if',
      'Evaluando la condición de la sentencia if.'
    );

    const conditionVal = Boolean(this.evaluateExpression(stmt.condition));
    this.ctx.recordSnapshot(
      stmt.line,
      'Resultado de condición if',
      `La condición evaluó a ${conditionVal ? 'VERDADERO (true)' : 'FALSO (false)'}.`
    );

    if (conditionVal) {
      return this.executeStatement(stmt.consequent);
    } else if (stmt.alternate) {
      return this.executeStatement(stmt.alternate);
    }
    return null;
  }

  executeWhile(stmt) {
    while (true) {
      this.ctx.recordSnapshot(
        stmt.line,
        'Condición de ciclo while',
        'Evaluando condición del ciclo while.'
      );
      const cond = Boolean(this.evaluateExpression(stmt.condition));
      this.ctx.recordSnapshot(
        stmt.line,
        'Resultado de condición while',
        `La condición del ciclo es ${cond ? 'VERDADERO (continúa el ciclo)' : 'FALSO (finaliza el ciclo)'}.`
      );

      if (!cond) break;

      const res = this.executeStatement(stmt.body);
      if (res) {
        if (res.type === 'break') break;
        if (res.type === 'return') return res;
      }
    }
    return null;
  }

  executeDoWhile(stmt) {
    do {
      const res = this.executeStatement(stmt.body);
      if (res) {
        if (res.type === 'break') break;
        if (res.type === 'return') return res;
      }

      this.ctx.recordSnapshot(
        stmt.line,
        'Condición de ciclo do-while',
        'Evaluando condición de parada al final del ciclo do-while.'
      );
      const cond = Boolean(this.evaluateExpression(stmt.condition));
      this.ctx.recordSnapshot(
        stmt.line,
        'Resultado de condición do-while',
        `Condición de do-while: ${cond ? 'VERDADERO (siguiente iteración)' : 'FALSO (sale del ciclo)'}.`
      );
      if (!cond) break;
    } while (true);
    return null;
  }

  executeFor(stmt) {
    // 1. Init
    if (stmt.init) {
      if (stmt.init.type === 'VariableDeclaration') {
        this.executeVariableDeclaration(stmt.init);
      } else {
        this.evaluateExpression(stmt.init);
      }
    }

    // 2. Loop
    while (true) {
      if (stmt.condition) {
        const cond = Boolean(this.evaluateExpression(stmt.condition));
        this.ctx.recordSnapshot(
          stmt.line,
          'Condición de ciclo for',
          `Evaluación de condición del ciclo for: ${cond ? 'VERDADERO (inicia iteración)' : 'FALSO (termina el ciclo for)'}.`
        );
        if (!cond) break;
      }

      const res = this.executeStatement(stmt.body);
      if (res) {
        if (res.type === 'break') break;
        if (res.type === 'return') return res;
      }

      // 3. Update
      if (stmt.update) {
        this.evaluateExpression(stmt.update);
        this.ctx.recordSnapshot(
          stmt.line,
          'Actualización de ciclo for',
          'Incremento/actualización de la variable de control del ciclo for.'
        );
      }
    }
    return null;
  }

  evaluateExpression(expr) {
    if (!expr) return 0;
    const frame = this.ctx.currentFrame();

    switch (expr.type) {
      case 'Literal':
        return expr.value;

      case 'Identifier': {
        // Buscar en frame actual
        if (frame.variables.hasOwnProperty(expr.name)) {
          return frame.variables[expr.name];
        }
        // Buscar en global
        if (this.ctx.globalFrame.variables.hasOwnProperty(expr.name)) {
          return this.ctx.globalFrame.variables[expr.name];
        }
        return 0;
      }

      case 'BinaryExpression': {
        const leftVal = this.evaluateExpression(expr.left);
        const rightVal = this.evaluateExpression(expr.right);

        switch (expr.operator) {
          case '+': return leftVal + rightVal;
          case '-': return leftVal - rightVal;
          case '*': return leftVal * rightVal;
          case '/': return rightVal !== 0 ? Math.floor(leftVal / rightVal) : 0;
          case '%': return rightVal !== 0 ? leftVal % rightVal : 0;
          case '==': return leftVal === rightVal;
          case '!=': return leftVal !== rightVal;
          case '<': return leftVal < rightVal;
          case '<=': return leftVal <= rightVal;
          case '>': return leftVal > rightVal;
          case '>=': return leftVal >= rightVal;
          case '&&': return Boolean(leftVal && rightVal);
          case '||': return Boolean(leftVal || rightVal);
          default: return 0;
        }
      }

      case 'UnaryExpression': {
        if (expr.operator === '!') {
          return !this.evaluateExpression(expr.argument);
        }
        if (expr.operator === '-') {
          return -this.evaluateExpression(expr.argument);
        }
        if (expr.operator === '++') {
          return this.applyIncrement(expr.argument, 1, expr.prefix);
        }
        if (expr.operator === '--') {
          return this.applyIncrement(expr.argument, -1, expr.prefix);
        }
        return 0;
      }

      case 'AssignmentExpression': {
        const rightVal = this.evaluateExpression(expr.right);
        let finalVal = rightVal;

        if (expr.operator !== '=') {
          const curVal = this.evaluateTargetRead(expr.left);
          if (expr.operator === '+=') finalVal = curVal + rightVal;
          else if (expr.operator === '-=') finalVal = curVal - rightVal;
          else if (expr.operator === '*=') finalVal = curVal * rightVal;
          else if (expr.operator === '/=') finalVal = rightVal !== 0 ? Math.floor(curVal / rightVal) : 0;
          else if (expr.operator === '%=') finalVal = rightVal !== 0 ? curVal % rightVal : 0;
        }

        this.assignToTarget(expr.left, finalVal, expr.line);
        return finalVal;
      }

      case 'FileStreamWrite': {
        // archivoSalida << a << "," << b << endl;
        const streamName = expr.stream.name;
        const handleId = frame.streams[streamName] || this.ctx.globalFrame.streams[streamName];
        let written = '';
        for (const elem of expr.elements) {
          if (elem.type === 'Endl') {
            written += '\n';
          } else {
            written += String(this.evaluateExpression(elem));
          }
        }
        this.ctx.vfs.write(handleId, written);
        this.ctx.recordSnapshot(
          expr.line,
          `Escritura en archivo '${streamName}'`,
          `Se escribió en el archivo: ${JSON.stringify(written)}.`
        );
        return true;
      }

      case 'IndexAccess': {
        // Podría ser arr[i] o mat[i][j]
        if (expr.object.type === 'IndexAccess') {
          // Matriz 2D: mat[i][j]
          const matName = expr.object.object.name;
          const rowIndex = Number(this.evaluateExpression(expr.object.index));
          const colIndex = Number(this.evaluateExpression(expr.index));
          const mat = frame.matrices2D[matName] || this.ctx.globalFrame.matrices2D[matName];

          if (mat && mat.values[rowIndex]) {
            frame.lastMatrixAccess = { name: matName, row: rowIndex, col: colIndex, type: 'read' };
            const val = mat.values[rowIndex][colIndex] ?? 0;
            this.ctx.recordSnapshot(
              expr.line,
              `Lectura de matriz '${matName}[${rowIndex}][${colIndex}]'`,
              `Se leyó el valor ${val} en la posición [fila: ${rowIndex}, columna: ${colIndex}].`
            );
            return val;
          }
          return 0;
        }

        // Podría ser arreglo 1D: arr[i]
        const arrName = expr.object.name;
        const indexVal = Number(this.evaluateExpression(expr.index));
        const arr = frame.arrays1D[arrName] || this.ctx.globalFrame.arrays1D[arrName];

        if (arr) {
          frame.lastArrayAccess = { name: arrName, index: indexVal, type: 'read' };
          const val = arr.values[indexVal] ?? 0;
          this.ctx.recordSnapshot(
            expr.line,
            `Lectura de arreglo '${arrName}[${indexVal}]'`,
            `Se leyó el valor ${val} en la posición del arreglo [${indexVal}].`
          );
          return val;
        }

        // Podría ser arreglo de structs: alumnos[i]
        const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
        if (stArr && stArr.isArray) {
          return stArr.items[indexVal];
        }

        return 0;
      }

      case 'MemberAccess': {
        // e.nombre o alumnos[i].nombre
        if (expr.object.type === 'IndexAccess') {
          const arrName = expr.object.object.name;
          const idx = Number(this.evaluateExpression(expr.object.index));
          const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
          if (stArr && stArr.isArray && stArr.items[idx]) {
            const val = stArr.items[idx][expr.member];
            this.ctx.recordSnapshot(
              expr.line,
              `Lectura de struct en arreglo '${arrName}[${idx}].${expr.member}'`,
              `Se leyó el campo '${expr.member}' con valor ${JSON.stringify(val)} del elemento [${idx}].`
            );
            return val;
          }
        } else if (expr.object.type === 'Identifier') {
          const stName = expr.object.name;
          const st = frame.structs[stName] || this.ctx.globalFrame.structs[stName];
          if (st && !st.isArray) {
            const val = st.fields[expr.member];
            this.ctx.recordSnapshot(
              expr.line,
              `Lectura de campo '${stName}.${expr.member}'`,
              `Se leyó el campo '${expr.member}' del struct '${stName}' con valor = ${JSON.stringify(val)}.`
            );
            return val;
          }
        }
        return 0;
      }

      case 'BuiltinCall': {
        return this.executeBuiltinCall(expr);
      }

      case 'CallExpression': {
        return this.executeFunctionCall(expr);
      }

      default:
        return 0;
    }
  }

  executeBuiltinCall(expr) {
    const frame = this.ctx.currentFrame();
    const name = expr.name;

    // 1. getline(archivo, variable, delim) o getline(archivo, variable)
    if (name === 'getline') {
      const streamName = expr.args[0].name;
      const targetVarNode = expr.args[1];
      let delimiter = '\n';
      if (expr.args.length > 2) {
        delimiter = String(this.evaluateExpression(expr.args[2]));
      }

      const handleId = frame.streams[streamName] || this.ctx.globalFrame.streams[streamName];
      const result = this.ctx.vfs.getline(handleId, delimiter);

      if (result.success) {
        this.assignToTarget(targetVarNode, result.value, expr.line);
        this.ctx.recordSnapshot(
          expr.line,
          `getline con delimitador '${delimiter === '\n' ? '\\n' : delimiter}'`,
          `getline extrajo el token "${result.value}" del archivo '${streamName}' y lo almacenó en la variable.`
        );
        return true;
      } else {
        this.ctx.recordSnapshot(
          expr.line,
          `getline fin de archivo (EOF)`,
          `El archivo '${streamName}' llegó al final (EOF). getline retorna false.`
        );
        return false;
      }
    }

    // 2. atoi, atol, atof, stoi
    if (['atoi', 'atol', 'stoi'].includes(name)) {
      let rawStr = this.evaluateExpression(expr.args[0]);
      if (typeof rawStr === 'string' && rawStr.includes('.c_str()')) {
        rawStr = rawStr.replace('.c_str()', '');
      }
      const num = parseInt(String(rawStr).trim(), 10) || 0;
      this.ctx.recordSnapshot(
        expr.line,
        `Conversión numérica (${name})`,
        `${name} convirtió la cadena "${rawStr}" en el entero ${num}.`
      );
      return num;
    }

    if (['atof', 'stof'].includes(name)) {
      const rawStr = this.evaluateExpression(expr.args[0]);
      const num = parseFloat(String(rawStr).trim()) || 0.0;
      this.ctx.recordSnapshot(
        expr.line,
        `Conversión a decimal (${name})`,
        `${name} convirtió la cadena "${rawStr}" en el número decimal ${num}.`
      );
      return num;
    }

    return 0;
  }

  executeFunctionCall(callExpr) {
    const fnName = callExpr.callee.name;

    // Métodos sobre objetos stream: archivo.is_open(), archivo.close(), archivo.eof()
    if (callExpr.callee.type === 'MemberAccess') {
      const objName = callExpr.callee.object.name;
      const method = callExpr.callee.member;

      // Métodos de string
      if (['c_str', 'length', 'size', 'empty'].includes(method)) {
        const strVal = this.evaluateExpression(callExpr.callee.object);
        if (method === 'c_str') return String(strVal);
        if (method === 'length' || method === 'size') return String(strVal).length;
        if (method === 'empty') return String(strVal).length === 0;
      }

      const handleId = this.ctx.currentFrame().streams[objName] || this.ctx.globalFrame.streams[objName];
      const handle = this.ctx.vfs.openHandles.get(handleId);

      if (method === 'is_open') {
        const isOpen = handle?.isOpen ?? false;
        this.ctx.recordSnapshot(
          callExpr.line,
          `Comprobación ${objName}.is_open()`,
          `El archivo '${handle?.filename ?? objName}' ${isOpen ? 'se abrió correctamente' : 'NO se pudo abrir'}.`
        );
        return isOpen;
      }
      if (method === 'close') {
        this.ctx.vfs.close(handleId);
        this.ctx.recordSnapshot(
          callExpr.line,
          `Cierre de archivo ${objName}.close()`,
          `Se cerró el flujo de archivo '${objName}'.`
        );
        return true;
      }
      if (method === 'eof') {
        return handle?.eof ?? true;
      }

      return 0;
    }

    const fn = this.ctx.functions.get(fnName);
    if (!fn) {
      throw new Error(`Función '${fnName}' no definida.`);
    }

    // Evaluar argumentos
    const evaluatedArgs = callExpr.args.map(arg => this.evaluateExpression(arg));

    // Crear nuevo frame para la llamada
    const newFrame = this.ctx.createFrame(fnName);

    // Asignar parámetros
    for (let i = 0; i < fn.params.length; i++) {
      const p = fn.params[i];
      const argVal = evaluatedArgs[i];

      if (p.isArray) {
        // Paso de arreglo: copiamos la referencia de arreglo
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
    this.ctx.recordSnapshot(
      fn.line,
      `Llamada a función ${fnName}()`,
      `Entrando a la función '${fnName}' con parámetros: [${fn.params.map((p, idx) => `${p.name} = ${evaluatedArgs[idx]}`).join(', ')}].`
    );

    const result = this.executeBlock(fn.body);
    this.ctx.callStack.pop();

    const returnVal = result?.value ?? 0;
    this.ctx.recordSnapshot(
      callExpr.line,
      `Retorno de función ${fnName}()`,
      `Retornando de '${fnName}' con valor = ${returnVal}.`
    );

    return returnVal;
  }

  assignToTarget(targetNode, value, line) {
    const frame = this.ctx.currentFrame();

    // 1. Variable simple: x = val
    if (targetNode.type === 'Identifier') {
      const varName = targetNode.name;
      if (frame.variables.hasOwnProperty(varName)) {
        frame.variables[varName] = value;
      } else {
        this.ctx.globalFrame.variables[varName] = value;
      }
      this.ctx.recordSnapshot(
        line,
        `Asignación a variable '${varName}'`,
        `Se asignó el valor ${JSON.stringify(value)} a la variable '${varName}'.`
      );
      return;
    }

    // 2. Arreglo 1D: arr[i] = val
    if (targetNode.type === 'IndexAccess' && targetNode.object.type === 'Identifier') {
      const arrName = targetNode.object.name;
      const indexVal = Number(this.evaluateExpression(targetNode.index));
      const arr = frame.arrays1D[arrName] || this.ctx.globalFrame.arrays1D[arrName];

      if (arr) {
        arr.values[indexVal] = this.castType(value, arr.type);
        frame.lastArrayAccess = { name: arrName, index: indexVal, type: 'write' };
        this.ctx.recordSnapshot(
          line,
          `Escritura en arreglo '${arrName}[${indexVal}]'`,
          `Se guardó el valor ${value} en el arreglo '${arrName}' en la posición [${indexVal}].`
        );
        return;
      }
    }

    // 3. Matriz 2D: mat[i][j] = val
    if (targetNode.type === 'IndexAccess' && targetNode.object.type === 'IndexAccess') {
      const matName = targetNode.object.object.name;
      const r = Number(this.evaluateExpression(targetNode.object.index));
      const c = Number(this.evaluateExpression(targetNode.index));
      const mat = frame.matrices2D[matName] || this.ctx.globalFrame.matrices2D[matName];

      if (mat && mat.values[r]) {
        mat.values[r][c] = this.castType(value, mat.type);
        frame.lastMatrixAccess = { name: matName, row: r, col: c, type: 'write' };
        this.ctx.recordSnapshot(
          line,
          `Escritura en matriz '${matName}[${r}][${c}]'`,
          `Se guardó el valor ${value} en la matriz '${matName}' en la fila [${r}], columna [${c}].`
        );
        return;
      }
    }

    // 4. Struct o Arreglo de Structs: alumno.nota = val o lista[i].nota = val
    if (targetNode.type === 'MemberAccess') {
      const member = targetNode.member;

      if (targetNode.object.type === 'IndexAccess') {
        // lista[i].nota = val
        const arrName = targetNode.object.object.name;
        const idx = Number(this.evaluateExpression(targetNode.object.index));
        const stArr = frame.structs[arrName] || this.ctx.globalFrame.structs[arrName];
        if (stArr && stArr.isArray && stArr.items[idx]) {
          stArr.items[idx][member] = value;
          this.ctx.recordSnapshot(
            line,
            `Escritura en struct de arreglo '${arrName}[${idx}].${member}'`,
            `Se asignó '${member}' = ${JSON.stringify(value)} en el elemento [${idx}] del arreglo de structs.`
          );
          return;
        }
      } else if (targetNode.object.type === 'Identifier') {
        // alumno.nota = val
        const stName = targetNode.object.name;
        const st = frame.structs[stName] || this.ctx.globalFrame.structs[stName];
        if (st && !st.isArray) {
          st.fields[member] = value;
          this.ctx.recordSnapshot(
            line,
            `Escritura en campo '${stName}.${member}'`,
            `Se asignó el campo '${member}' = ${JSON.stringify(value)} en la estructura '${stName}'.`
          );
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
    if (['int', 'long'].includes(type)) return 0;
    if (['float', 'double'].includes(type)) return 0.0;
    if (type === 'bool') return false;
    if (type === 'char') return ' ';
    if (type === 'string') return '';
    return 0;
  }

  castType(val, type) {
    if (['int', 'long'].includes(type)) return parseInt(val, 10) || 0;
    if (['float', 'double'].includes(type)) return parseFloat(val) || 0.0;
    if (type === 'bool') return Boolean(val);
    if (type === 'char') return String(val).charAt(0) || ' ';
    if (type === 'string') return String(val);
    return val;
  }
}
