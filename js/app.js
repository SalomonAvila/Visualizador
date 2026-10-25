// Controlador Principal de C++ VisualLab (Vista Unificada en el Panel Derecho)
import { Lexer } from './interpreter/lexer.js';
import { Parser } from './interpreter/parser.js';
import { Runtime } from './interpreter/runtime.js';
import { VirtualFileSystem } from './interpreter/vfs.js';

import { CodeEditor } from './utils/editor.js';
import { MemoryView } from './visualizers/memoryView.js';
import { ArrayView } from './visualizers/arrayView.js';
import { MatrixView } from './visualizers/matrixView.js';
import { StructView } from './visualizers/structView.js';
import { FileStreamView } from './visualizers/fileStreamView.js';

import { EXAMPLES } from './data/examples.js';
import { CHALLENGES } from './data/challenges.js';

export class App {
  constructor() {
    this.vfs = new VirtualFileSystem();
    this.snapshots = [];
    this.currentStep = -1;
    this.isPlaying = false;
    this.playTimer = null;
    this.playSpeedMs = 700;

    this.initDOM();
    this.initEditor();
    this.initVisualizers();
    this.bindEvents();
    this.loadExample(EXAMPLES[0].id);
  }

  initDOM() {
    this.dom = {
      themeToggle: document.getElementById('themeToggle'),
      examplesSelect: document.getElementById('examplesSelect'),
      challengesBtn: document.getElementById('challengesBtn'),
      cheatsheetBtn: document.getElementById('cheatsheetBtn'),

      // Controles
      btnRun: document.getElementById('btnRun'),
      btnPrev: document.getElementById('btnPrev'),
      btnNext: document.getElementById('btnNext'),
      btnPlay: document.getElementById('btnPlay'),
      btnReset: document.getElementById('btnReset'),
      stepSlider: document.getElementById('stepSlider'),
      stepCounter: document.getElementById('stepCounter'),
      speedSelect: document.getElementById('speedSelect'),

      // Banner explicativo de paso
      stepBanner: document.getElementById('stepBanner'),
      stepLineTag: document.getElementById('stepLineTag'),
      stepActionTag: document.getElementById('stepActionTag'),
      stepDescription: document.getElementById('stepDescription'),

      // Consola
      consoleOutput: document.getElementById('consoleOutput'),
      stdinInput: document.getElementById('stdinInput'),

      // Secciones visuales unificadas
      sectionMemory: document.getElementById('sectionMemory'),
      sectionArrays: document.getElementById('sectionArrays'),
      sectionMatrices: document.getElementById('sectionMatrices'),
      sectionStructs: document.getElementById('sectionStructs'),
      sectionFstream: document.getElementById('sectionFstream'),

      // Modales
      challengesModal: document.getElementById('challengesModal'),
      challengesClose: document.getElementById('challengesClose'),
      challengesList: document.getElementById('challengesList'),
      cheatsheetModal: document.getElementById('cheatsheetModal'),
      cheatsheetClose: document.getElementById('cheatsheetClose'),

      // VFS editor modal
      vfsModal: document.getElementById('vfsModal'),
      vfsBtn: document.getElementById('vfsBtn'),
      vfsClose: document.getElementById('vfsClose'),
      vfsFileList: document.getElementById('vfsFileList'),
      vfsFileContent: document.getElementById('vfsFileContent'),
      vfsSaveBtn: document.getElementById('vfsSaveBtn'),
      vfsCurrentFileName: document.getElementById('vfsCurrentFileName')
    };

    this.populateExamplesDropdown();
    this.setupTheme();
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('cpp_visual_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      this.dom.themeToggle.textContent = '🌙';
    } else {
      document.body.classList.remove('light-theme');
      this.dom.themeToggle.textContent = '☀️';
    }

    this.dom.themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      this.dom.themeToggle.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('cpp_visual_theme', isLight ? 'light' : 'dark');
    });
  }

  populateExamplesDropdown() {
    let currentCat = '';
    let html = '';

    for (const ex of EXAMPLES) {
      if (ex.category !== currentCat) {
        if (currentCat !== '') html += '</optgroup>';
        currentCat = ex.category;
        html += `<optgroup label="${currentCat}">`;
      }
      html += `<option value="${ex.id}">${ex.title}</option>`;
    }
    if (currentCat !== '') html += '</optgroup>';

    this.dom.examplesSelect.innerHTML = html;
  }

  initEditor() {
    const editorContainer = document.getElementById('editorContainer');
    this.editor = new CodeEditor(editorContainer, EXAMPLES[0].code);
    this.editor.onChange(() => {
      this.stopPlayback();
      this.snapshots = [];
      this.currentStep = -1;
      this.updateStepControls();
    });
  }

  initVisualizers() {
    this.memoryView = new MemoryView(this.dom.sectionMemory);
    this.arrayView = new ArrayView(this.dom.sectionArrays);
    this.matrixView = new MatrixView(this.dom.sectionMatrices);
    this.structView = new StructView(this.dom.sectionStructs);
    this.fileStreamView = new FileStreamView(this.dom.sectionFstream);
  }

  bindEvents() {
    this.dom.examplesSelect.addEventListener('change', (e) => {
      this.loadExample(e.target.value);
    });

    this.dom.btnRun.addEventListener('click', () => this.runCode());
    this.dom.btnNext.addEventListener('click', () => this.stepNext());
    this.dom.btnPrev.addEventListener('click', () => this.stepPrev());
    this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
    this.dom.btnReset.addEventListener('click', () => this.resetExecution());

    this.dom.stepSlider.addEventListener('input', (e) => {
      const targetStep = parseInt(e.target.value, 10);
      this.goToStep(targetStep);
    });

    this.dom.speedSelect.addEventListener('change', (e) => {
      this.playSpeedMs = parseInt(e.target.value, 10);
      if (this.isPlaying) {
        this.stopPlayback();
        this.startPlayback();
      }
    });

    this.dom.challengesBtn.addEventListener('click', () => this.openChallengesModal());
    this.dom.challengesClose.addEventListener('click', () => this.dom.challengesModal.classList.remove('open'));
    this.dom.cheatsheetBtn.addEventListener('click', () => this.dom.cheatsheetModal.classList.add('open'));
    this.dom.cheatsheetClose.addEventListener('click', () => this.dom.cheatsheetModal.classList.remove('open'));

    this.dom.vfsBtn.addEventListener('click', () => this.openVfsModal());
    this.dom.vfsClose.addEventListener('click', () => this.dom.vfsModal.classList.remove('open'));
    this.dom.vfsSaveBtn.addEventListener('click', () => this.saveVfsFile());

    window.addEventListener('click', (e) => {
      if (e.target === this.dom.challengesModal) this.dom.challengesModal.classList.remove('open');
      if (e.target === this.dom.cheatsheetModal) this.dom.cheatsheetModal.classList.remove('open');
      if (e.target === this.dom.vfsModal) this.dom.vfsModal.classList.remove('open');
    });
  }

  loadExample(exampleId) {
    const example = EXAMPLES.find(e => e.id === exampleId);
    if (!example) return;

    this.stopPlayback();
    this.editor.setValue(example.code);
    this.snapshots = [];
    this.currentStep = -1;
    this.updateStepControls();

    this.runCode();
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
    } catch (err) {
      this.showError(err.message);
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
    if (stepIndex < 0 || stepIndex >= this.snapshots.length) return;
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
    this.dom.btnPlay.innerHTML = '⏸ Pausa';
    this.dom.btnPlay.classList.add('btn-playing');

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
    this.dom.btnPlay.innerHTML = '▶ Reproducir';
    this.dom.btnPlay.classList.remove('btn-playing');
  }

  applySnapshot(snap) {
    if (!snap) return;

    this.editor.setActiveLine(snap.line);

    this.dom.stepLineTag.textContent = `Línea ${snap.line}`;
    this.dom.stepActionTag.textContent = snap.action;
    this.dom.stepDescription.textContent = snap.description;

    this.dom.consoleOutput.textContent = snap.consoleOutput || '(Consola vacía)';

    // Renderizar todos los visualizadores en cascada
    this.renderAllVisualizers(snap);
  }

  renderAllVisualizers(snap) {
    this.memoryView.render(snap);
    this.arrayView.render(snap);
    this.matrixView.render(snap);
    this.structView.render(snap);
    this.fileStreamView.render(snap);
  }

  updateStepControls() {
    const total = this.snapshots.length;
    const cur = this.currentStep;

    this.dom.stepSlider.min = 0;
    this.dom.stepSlider.max = Math.max(0, total - 1);
    this.dom.stepSlider.value = cur >= 0 ? cur : 0;

    if (total === 0) {
      this.dom.stepCounter.textContent = 'Paso 0 de 0';
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
    this.dom.stepLineTag.textContent = 'Error';
    this.dom.stepActionTag.textContent = 'Sintaxis / Ejecución';
    this.dom.stepDescription.textContent = msg;
    this.dom.consoleOutput.textContent = `❌ ${msg}`;
  }

  // --- Retos ---
  openChallengesModal() {
    let html = '';
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
            <small class="challenge-hint">💡 <em>Pista: ${c.hint}</em></small>
          </div>
        </div>
      `;
    }
    this.dom.challengesList.innerHTML = html;

    const loadBtns = this.dom.challengesList.querySelectorAll('.btn-load-challenge');
    loadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const ch = CHALLENGES.find(c => c.id === id);
        if (ch) {
          this.editor.setValue(ch.initialCode);
          this.dom.challengesModal.classList.remove('open');
          this.runCode();
        }
      });
    });

    this.dom.challengesModal.classList.add('open');
  }

  // --- VFS ---
  openVfsModal() {
    const files = this.vfs.listFiles();
    let tabsHtml = '';
    for (const f of files) {
      tabsHtml += `<button class="vfs-file-btn" data-file="${f}">📄 ${f}</button>`;
    }
    this.dom.vfsFileList.innerHTML = tabsHtml;

    const fileBtns = this.dom.vfsFileList.querySelectorAll('.vfs-file-btn');
    fileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const fname = btn.getAttribute('data-file');
        this.showVfsFile(fname);
      });
    });

    if (files.length > 0) {
      this.showVfsFile(files[0]);
    }

    this.dom.vfsModal.classList.add('open');
  }

  showVfsFile(fname) {
    this.dom.vfsCurrentFileName.textContent = fname;
    this.dom.vfsFileContent.value = this.vfs.getFile(fname) ?? '';
    const fileBtns = this.dom.vfsFileList.querySelectorAll('.vfs-file-btn');
    fileBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-file') === fname));
  }

  saveVfsFile() {
    const fname = this.dom.vfsCurrentFileName.textContent;
    const content = this.dom.vfsFileContent.value;
    this.vfs.setFile(fname, content);
    this.dom.vfsModal.classList.remove('open');
    this.runCode();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
