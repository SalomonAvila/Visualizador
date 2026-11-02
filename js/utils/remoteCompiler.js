// Compilación y ejecución real con g++ usando servicios públicos en línea.
// Proveedor principal: Wandbox (wandbox.org). Respaldo: Compiler Explorer (godbolt.org).
// Los archivos del VFS se envían junto al código para que ifstream pueda leerlos.

const REQUEST_TIMEOUT_MS = 25000;
const GCC_FLAGS = '-std=c++17 -Wall -Wextra -O0';

async function postJson(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function compileWithWandbox(code, stdin, files) {
  const data = await postJson('https://wandbox.org/api/compile.json', {
    compiler: 'gcc-head',
    code,
    stdin,
    'compiler-option-raw': GCC_FLAGS.split(' ').join('\n'),
    codes: files.map(f => ({ file: f.name, code: f.content }))
  });

  const compilerText = data.compiler_error || data.compiler_message || '';
  const status = data.status != null ? parseInt(data.status, 10) : null;
  // gcc marca los fallos de compilación/enlace con "error:" (incluye "ld returned 1 exit status")
  const compiled = !/(^|\s)(fatal )?error:/m.test(compilerText);

  return {
    provider: 'Wandbox (gcc-head)',
    compiled,
    compilerOutput: compilerText,
    stdout: data.program_output || '',
    stderr: data.program_error || '',
    exitCode: status,
    signal: data.signal || ''
  };
}

async function compileWithGodbolt(code, stdin, files) {
  const data = await postJson('https://godbolt.org/api/compiler/g132/compile', {
    source: code,
    options: {
      userArguments: GCC_FLAGS,
      executeParameters: { args: [], stdin },
      compilerOptions: { executorRequest: true },
      filters: { execute: true }
    },
    files: files.map(f => ({ filename: f.name, contents: f.content })),
    lang: 'c++',
    allowStoreCodeDebug: false
  });

  const lines = arr => (arr || []).map(l => l.text).join('\n');
  const build = data.buildResult || {};
  const compilerOutput = lines(build.stderr) || '';
  const compiled = build.code === 0 || (build.code == null && data.didExecute);

  return {
    provider: 'Compiler Explorer (g++ 13.2)',
    compiled,
    compilerOutput: compilerOutput.replace(/<source>/g, 'main.cpp'),
    stdout: compiled ? lines(data.stdout) : '',
    stderr: compiled ? lines(data.stderr) : '',
    exitCode: compiled ? data.code : null,
    signal: ''
  };
}

/**
 * Compila y ejecuta el código con g++. Intenta Wandbox y, si falla la conexión, Compiler Explorer.
 * @returns {Promise<{provider, compiled, compilerOutput, stdout, stderr, exitCode, signal, diagnostics}>}
 */
export async function compileAndRun(code, stdin, files = []) {
  const providers = [compileWithWandbox, compileWithGodbolt];
  const failures = [];

  for (const provider of providers) {
    try {
      const result = await provider(code, stdin, files);
      result.diagnostics = parseGccDiagnostics(result.compilerOutput);
      return result;
    } catch (err) {
      failures.push(err.name === 'AbortError' ? 'tiempo de espera agotado' : err.message);
    }
  }

  throw new Error(`No se pudo contactar ningún compilador en línea (${failures.join('; ')}).`);
}

/**
 * Extrae errores y advertencias del archivo del estudiante (ignora los que apuntan a cabeceras del sistema)
 */
export function parseGccDiagnostics(text) {
  const diagnostics = [];
  const re = /^(?:prog\.cc|main\.cpp|<source>):(\d+):(\d+): (fatal error|error|warning|note): (.*)$/gm;
  let m;
  while ((m = re.exec(text || '')) !== null) {
    diagnostics.push({
      line: parseInt(m[1], 10),
      column: parseInt(m[2], 10),
      severity: m[3] === 'fatal error' ? 'error' : m[3],
      message: m[4]
    });
  }
  return diagnostics;
}
