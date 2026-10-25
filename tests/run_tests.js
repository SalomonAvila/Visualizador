// Suite de pruebas automatizadas para C++ VisualLab
import { Lexer } from '../js/interpreter/lexer.js';
import { Parser } from '../js/interpreter/parser.js';
import { Runtime } from '../js/interpreter/runtime.js';
import { VirtualFileSystem } from '../js/interpreter/vfs.js';
import { EXAMPLES } from '../js/data/examples.js';
import { CHALLENGES } from '../js/data/challenges.js';

console.log("=== Ejecutando Suite de Pruebas de C++ VisualLab ===");

let passedCount = 0;
let totalCount = 0;

// 1. Probar Ejemplos
console.log("\n--- Validando Ejemplos del Curso ---");
for (const ex of EXAMPLES) {
  totalCount++;
  try {
    const lexer = new Lexer(ex.code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    const vfs = new VirtualFileSystem();
    const runtime = new Runtime(ast, vfs);
    const snaps = runtime.run();

    if (snaps.length > 0 && snaps[snaps.length - 1].action !== 'Error de Ejecución') {
      console.log(`✓ [OK] ${ex.id} (${snaps.length} pasos)`);
      passedCount++;
    } else {
      console.error(`✗ [ERROR] ${ex.id}:`, snaps[snaps.length - 1]?.description);
    }
  } catch (err) {
    console.error(`✗ [EXCEPCIÓN] ${ex.id}:`, err.message);
  }
}

// 2. Probar Retos
console.log("\n--- Validando Retos Interactivos ---");
for (const ch of CHALLENGES) {
  totalCount++;
  try {
    const lexer = new Lexer(ch.initialCode);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    const vfs = new VirtualFileSystem();
    const runtime = new Runtime(ast, vfs);
    const snaps = runtime.run();
    const output = snaps[snaps.length - 1].consoleOutput.trim();

    if (output.includes(ch.expectedOutput)) {
      console.log(`✓ [OK] ${ch.id} (Salida: "${output}")`);
      passedCount++;
    } else {
      console.error(`✗ [FALLO] ${ch.id}: Salida esperada "${ch.expectedOutput}", obtenida "${output}"`);
    }
  } catch (err) {
    console.error(`✗ [EXCEPCIÓN] ${ch.id}:`, err.message);
  }
}

console.log(`\nResultado: ${passedCount} de ${totalCount} pruebas pasaron exitosamente.`);
if (passedCount !== totalCount) {
  process.exit(1);
}
