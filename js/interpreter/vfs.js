// Sistema de Archivos Virtual (VFS) para fstream en el navegador
export class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.openHandles = new Map(); // id -> { filename, mode: 'in' | 'out', cursor: 0, content: string }
    this.handleCounter = 1;
    this.initDefaultFiles();
  }

  initDefaultFiles() {
    this.files.set('estudiantes.csv', 
`Carlos Gomez,19,85
Maria Rodriguez,20,92
Juan Perez,18,78
Ana Fernandez,21,95
Luis Torres,19,88`);

    this.files.set('numeros.txt',
`10,25,30,45
12,55,70,90
8,14,33,60`);

    this.files.set('matriz_datos.txt',
`5,8,12
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

  open(filename, mode = 'in') {
    const handleId = `stream_${this.handleCounter++}`;
    let content = '';
    if (mode === 'in') {
      content = this.files.get(filename) ?? '';
    } else {
      content = '';
      this.files.set(filename, '');
    }
    const handle = {
      id: handleId,
      filename,
      mode,
      cursor: 0,
      content,
      isOpen: mode === 'in' ? this.files.has(filename) : true,
      lastToken: '',
      lastLine: '',
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

  // Simula getline(archivo, variable, delim)
  getline(handleId, delimiter = '\n') {
    const handle = this.openHandles.get(handleId);
    if (!handle || !handle.isOpen) {
      return { success: false, value: '', eof: true };
    }

    if (handle.cursor >= handle.content.length) {
      handle.eof = true;
      return { success: false, value: '', eof: true };
    }

    let token = '';
    let startCursor = handle.cursor;
    while (handle.cursor < handle.content.length) {
      const char = handle.content[handle.cursor];
      handle.cursor++;
      if (char === delimiter) {
        break;
      }
      if (delimiter !== '\n' && char === '\n') {
        // El salto de línea también finaliza el token si no es el delimitador
        break;
      }
      if (char !== '\r') {
        token += char;
      }
    }

    handle.lastToken = token;
    if (handle.cursor >= handle.content.length && token === '') {
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
    if (!handle || !handle.isOpen || handle.mode !== 'out') return false;
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
