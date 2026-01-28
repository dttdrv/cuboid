/********************************************************************************
 * Copyright (C) 2019 Elliott Wen.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/


export enum EngineStatus {
    Init = 1,
    Ready,
    Busy,
    Error
}

const ENGINE_PATH = '/swiftlatex/swiftlatexpdftex.js';

export class CompileResult {
    pdf: Uint8Array | undefined = undefined;
    status: number = -254;
    log: string = 'No log';
}

export class PdfTeXEngine {
    private latexWorker: Worker | undefined = undefined;
    public latexWorkerStatus: EngineStatus = EngineStatus.Init;
    constructor() {

    }

    public async loadEngine(): Promise<void> {
        if (this.latexWorker !== undefined) {
            throw new Error('Other instance is running, abort()');
        }
        this.latexWorkerStatus = EngineStatus.Init;
        await new Promise<void>((resolve, reject) => {
            this.latexWorker = new Worker(ENGINE_PATH);
            this.latexWorker.onmessage = (ev: any) => {
                const data: any = ev['data'];
                const cmd: string = data['result'] as string;
                if (cmd === 'ok') {
                    this.latexWorkerStatus = EngineStatus.Ready;
                    resolve();
                } else {
                    this.latexWorkerStatus = EngineStatus.Error;
                    reject();
                }
            };
        });
        this.latexWorker!.onmessage = (_: any) => {
        };
        this.latexWorker!.onerror = (_: any) => {
        };
    }

    public isReady(): boolean {
        return this.latexWorkerStatus === EngineStatus.Ready;
    }

    private checkEngineStatus(): void {
        if (this.latexWorkerStatus !== EngineStatus.Ready) {
            throw new Error('Engine not ready!');
        }
    }

    public compileLaTeX(): Promise<CompileResult> {
        this.checkEngineStatus();
        this.latexWorkerStatus = EngineStatus.Busy;
        return new Promise((resolve, reject) => {
            this.latexWorker!.onmessage = (ev: any) => {
                const data: any = ev['data'];
                const cmd: string = data['cmd'] as string;
                if (cmd !== "compile") return;
                const result: string = data['result'] as string;
                const log: string = data['log'] as string;
                // const status: number = data['status'] as number;
                this.latexWorkerStatus = EngineStatus.Ready;
                if (result === 'ok') {
                    const formatArray = data['pdf']; /* PDF for result */
                    const cr = new CompileResult();
                    cr.pdf = new Uint8Array(formatArray);
                    cr.status = 0;
                    cr.log = log;
                    resolve(cr);
                } else {
                    const cr = new CompileResult();
                    cr.status = 1;
                    cr.log = log;
                    resolve(cr); // Resolve with error log
                }
            };
            this.latexWorker!.postMessage({ 'cmd': 'compilelatex' });
        });
    }

    public setEngineMainFile(filename: string): void {
        this.checkEngineStatus();
        if (this.latexWorker !== undefined) {
            this.latexWorker.postMessage({ 'cmd': 'setmainfile', 'url': filename });
        }
    }

    public writeMemFSFile(filename: string, srccode: string | Uint8Array): void {
        this.checkEngineStatus();
        if (this.latexWorker !== undefined) {
            this.latexWorker.postMessage({ 'cmd': 'writefile', 'url': filename, 'src': srccode });
        }
    }

    public makeMemFSFolder(folder: string): void {
        this.checkEngineStatus();
        if (this.latexWorker !== undefined) {
            if (folder === '' || folder === '/') {
                return;
            }
            this.latexWorker.postMessage({ 'cmd': 'mkdir', 'url': folder });
        }
    }

    public flushCache(): void {
        this.checkEngineStatus();
        if (this.latexWorker !== undefined) {
            // console.warn('Flushing');
            this.latexWorker.postMessage({ 'cmd': 'flushcache' });
        }

    }

    public setTexliveEndpoint(url: string): void {
        if (this.latexWorker !== undefined) {
            this.latexWorker.postMessage({ 'cmd': 'settexliveurl', 'url': url });
        }
    }

    public closeWorker(): void {
        if (this.latexWorker !== undefined) {
            this.latexWorker.postMessage({ 'cmd': 'grace' });
            this.latexWorker = undefined;
        }
    }
}