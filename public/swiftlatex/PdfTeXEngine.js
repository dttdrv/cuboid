(function () {
  var ENGINE_PATH = '/swiftlatex/swiftlatexpdftex.js';

  function CompileResult() {
    this.pdf = undefined;
    this.status = -254;
    this.log = 'No log';
  }

  function PdfTeXEngine() {
    this.latexWorker = undefined;
    this.ready = false;
    this.busy = false;
  }

  PdfTeXEngine.prototype.loadEngine = function () {
    var self = this;
    if (self.latexWorker) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      self.latexWorker = new Worker(ENGINE_PATH);
      self.latexWorker.onmessage = function (event) {
        var data = event.data || {};
        if (data.result === 'ok') {
          self.ready = true;
          resolve();
          return;
        }
        reject(new Error('Failed to initialize SwiftLaTeX worker.'));
      };
      self.latexWorker.onerror = function (error) {
        reject(error);
      };
    });
  };

  PdfTeXEngine.prototype.isReady = function () {
    return this.ready && !this.busy;
  };

  PdfTeXEngine.prototype.writeMemFSFile = function (filename, content) {
    if (!this.latexWorker || !this.ready) throw new Error('Engine not ready.');
    this.latexWorker.postMessage({ cmd: 'writefile', url: filename, src: content });
  };

  PdfTeXEngine.prototype.setEngineMainFile = function (filename) {
    if (!this.latexWorker || !this.ready) throw new Error('Engine not ready.');
    this.latexWorker.postMessage({ cmd: 'setmainfile', url: filename });
  };

  PdfTeXEngine.prototype.compileLaTeX = function () {
    var self = this;
    if (!self.latexWorker || !self.ready) {
      return Promise.reject(new Error('Engine not ready.'));
    }
    self.busy = true;
    return new Promise(function (resolve) {
      self.latexWorker.onmessage = function (event) {
        var data = event.data || {};
        if (data.cmd !== 'compile') return;
        self.busy = false;
        var result = new CompileResult();
        if (data.result === 'ok') {
          result.status = 0;
          result.pdf = new Uint8Array(data.pdf);
          result.log = data.log || '';
        } else {
          result.status = 1;
          result.log = data.log || 'Compilation failed.';
        }
        resolve(result);
      };
      self.latexWorker.postMessage({ cmd: 'compilelatex' });
    });
  };

  PdfTeXEngine.prototype.closeWorker = function () {
    if (!this.latexWorker) return;
    this.latexWorker.postMessage({ cmd: 'grace' });
    this.latexWorker = undefined;
    this.ready = false;
    this.busy = false;
  };

  self.PdfTeXEngine = PdfTeXEngine;
})();
