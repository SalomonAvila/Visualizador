// Editor basado en Monaco (el motor de VS Code), cargado desde CDN sin paso de build.
// Expone la misma API que CodeEditor (getValue, setValue, setActiveLine, clearActiveLine, onChange).
// Mientras Monaco carga (o si no hay internet / se abre con file://) se usa el editor ligero como respaldo.
import { CodeEditor } from './editor.js';
import { AUTOCOMPLETE_CATALOG } from './autocomplete.js';

const MONACO_VERSION = '0.52.2';
const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;
const LOAD_TIMEOUT_MS = 15000;

let monacoPromise = null;

function loadMonaco() {
  if (monacoPromise) return monacoPromise;

  monacoPromise = new Promise((resolve, reject) => {
    if (window.monaco && window.monaco.editor) {
      resolve(window.monaco);
      return;
    }

    const timer = setTimeout(() => reject(new Error('Tiempo de carga de Monaco agotado')), LOAD_TIMEOUT_MS);

    const script = document.createElement('script');
    script.src = `${MONACO_BASE}/vs/loader.js`;
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('No se pudo descargar Monaco'));
    };
    script.onload = () => {
      // Permite crear los web workers desde otro origen (CDN)
      window.MonacoEnvironment = {
        getWorkerUrl() {
          const src = `self.MonacoEnvironment = { baseUrl: '${MONACO_BASE}/' };
importScripts('${MONACO_BASE}/vs/base/worker/workerMain.js');`;
          return `data:text/javascript;charset=utf-8,${encodeURIComponent(src)}`;
        }
      };

      window.require.config({ paths: { vs: `${MONACO_BASE}/vs` } });
      window.require(['vs/editor/editor.main'], () => {
        clearTimeout(timer);
        resolve(window.monaco);
      }, (err) => {
        clearTimeout(timer);
        reject(err);
      });
    };
    document.head.appendChild(script);
  });

  return monacoPromise;
}

let completionRegistered = false;

function registerCompletions(monaco) {
  if (completionRegistered) return;
  completionRegistered = true;

  const kindByType = {
    tipo: monaco.languages.CompletionItemKind.TypeParameter,
    clave: monaco.languages.CompletionItemKind.Keyword,
    io: monaco.languages.CompletionItemKind.Variable,
    'función': monaco.languages.CompletionItemKind.Function
  };

  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      return {
        suggestions: AUTOCOMPLETE_CATALOG.map(item => ({
          label: item.label,
          kind: kindByType[item.type] ?? monaco.languages.CompletionItemKind.Text,
          detail: item.detail,
          insertText: item.insertText,
          range
        }))
      };
    }
  });
}

function defineThemes(monaco) {
  monaco.editor.defineTheme('visuallab-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#090d16',
      'editorGutter.background': '#090d16',
      'editor.lineHighlightBackground': '#1e293b80'
    }
  });
  monaco.editor.defineTheme('visuallab-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f8fafc',
      'editorGutter.background': '#f8fafc'
    }
  });
}

function currentTheme() {
  return document.body.classList.contains('light-theme') ? 'visuallab-light' : 'visuallab-dark';
}

export class MonacoCodeEditor {
  constructor(containerElement, initialCode = '') {
    this.container = containerElement;
    this.activeLine = -1;
    this.onChangeCallback = null;
    this.monacoEditor = null;
    this.decorations = null;

    // Editor ligero inmediato mientras carga Monaco
    this.fallback = new CodeEditor(containerElement, initialCode);
    this.fallback.onChange((code) => this.emitChange(code));

    loadMonaco()
      .then(monaco => this.mountMonaco(monaco))
      .catch(err => console.warn('[VisualLab] Monaco no disponible, usando editor básico:', err));
  }

  mountMonaco(monaco) {
    const code = this.fallback.getValue();

    defineThemes(monaco);
    registerCompletions(monaco);

    this.container.innerHTML = '<div class="monaco-host"></div>';
    const host = this.container.querySelector('.monaco-host');

    this.monaco = monaco;
    this.monacoEditor = monaco.editor.create(host, {
      value: code,
      language: 'cpp',
      theme: currentTheme(),
      automaticLayout: true,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontSize: 14,
      fontLigatures: true,
      tabSize: 4,
      insertSpaces: true,
      minimap: { enabled: false },
      glyphMargin: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      renderWhitespace: 'none',
      bracketPairColorization: { enabled: true },
      guides: { indentation: true, bracketPairs: true },
      wordBasedSuggestions: 'currentDocument',
      padding: { top: 8 }
    });
    this.fallback = null;

    this.monacoEditor.onDidChangeModelContent(() => {
      this.emitChange(this.monacoEditor.getValue());
    });

    // Sincronizar con el botón de tema claro/oscuro
    this.themeObserver = new MutationObserver(() => monaco.editor.setTheme(currentTheme()));
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    this.decorations = this.monacoEditor.createDecorationsCollection([]);
    if (this.activeLine > 0) this.setActiveLine(this.activeLine);
  }

  emitChange(code) {
    if (this.onChangeCallback) this.onChangeCallback(code);
  }

  setActiveLine(lineNum) {
    this.activeLine = lineNum;
    if (!this.monacoEditor) {
      this.fallback.setActiveLine(lineNum);
      return;
    }
    if (lineNum <= 0) {
      this.decorations.clear();
      return;
    }
    const monaco = this.monaco;
    this.decorations.set([{
      range: new monaco.Range(lineNum, 1, lineNum, 1),
      options: {
        isWholeLine: true,
        className: 'monaco-active-step-line',
        glyphMarginClassName: 'monaco-active-step-glyph',
        overviewRuler: { color: '#fbbf24', position: monaco.editor.OverviewRulerLane.Full }
      }
    }]);
    this.monacoEditor.revealLineInCenterIfOutsideViewport(lineNum, monaco.editor.ScrollType.Smooth);
  }

  clearActiveLine() {
    this.activeLine = -1;
    if (!this.monacoEditor) {
      this.fallback.clearActiveLine();
      return;
    }
    this.decorations.clear();
  }

  getValue() {
    return this.monacoEditor ? this.monacoEditor.getValue() : this.fallback.getValue();
  }

  setValue(newCode) {
    if (!this.monacoEditor) {
      this.fallback.setValue(newCode);
      return;
    }
    // onDidChangeModelContent dispara el callback de cambio
    this.monacoEditor.setValue(newCode);
  }

  onChange(callback) {
    this.onChangeCallback = callback;
  }
}
