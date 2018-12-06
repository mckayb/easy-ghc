'use strict';

import { Disposable, workspace } from "vscode";
import { ChildProcess, spawn } from "child_process";

type Listener = (x: string) => void;

export class GHCI implements Disposable {
  private outState: string = "";
  private errState: string = "";
  private lastWanted: string = "";
  private listeners: Listener[] = [];
  private proc: ChildProcess;

  constructor() {
    try {
      this.proc = spawn("stack", ["ghci"], {cwd: workspace.rootPath + "/test-shit"});

      this.proc.stdout.on("data", (data) => {
        this.outState += data.toString();
        this.listeners.forEach(f => f(data.toString()));
      });

      this.proc.stderr.on("data", (data) => {
        this.errState += data.toString();
      });

      this.proc.on("close", (code) => {
        console.log("PROCESS CLOSED: ", code);
      });

      this.proc.on("error", (err) => {
        console.log("Error: ", err);
      });
    } catch (e) {
      throw e;
    }
  }

  handler() {
    return {
      waitFor: (str: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          const oldListeners = this.listeners;
          this.listeners = this.listeners.concat([(x) => {
            const index = this.outState.indexOf(str);
            if (index > -1) {
              this.lastWanted = this.outState.substr(0, index);
              this.outState = "";
              this.listeners = oldListeners;
              resolve(this.handler());
            }
          }]);
        });
      },

      addListener: (f: (x: string) => void) => {
        this.listeners = this.listeners.concat([f]);
        return this.handler();
      },

      print: () => {
        console.log(this.lastWanted);
        return this.handler();
      },

      send: (cmd: string) => {
        this.proc.stdin.write(cmd + "\n");
        return this.handler();
      },

      getOutput: (): string => {
        return this.lastWanted;
      },

      getErrOutput: (): string => {
        return this.errState;
      }
    };
  }

  dispose() {
    if (this.proc) {
      this.proc.kill();
    }
  }
}