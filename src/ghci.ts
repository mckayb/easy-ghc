'use strict';

import { Disposable, workspace } from "vscode";
import { ChildProcess, spawn } from "child_process";

type Listener = (type: "error" | "data", x: string) => void;
export type GHCIHandler = {
   waitFor: (str: string) => Promise<GHCIHandler>,
   print: () => GHCIHandler,
   send: (cmd: string) => GHCIHandler,
   getOutput: () => string,
   getErrOutput: () => string
}

export class GHCI implements Disposable {
  private outState: string = "";
  private errState: string = "";
  private lastWanted: string = "";
  private listener: Listener;
  private proc: ChildProcess;
  private timeout: NodeJS.Timer | null = null;

  constructor() {
    try {
      this.proc = spawn("stack", ["ghci"], {cwd: workspace.rootPath + "/test-shit"});

      this.listener = (type, x) => {}
      this.proc.stdout.on("data", (data) => {
        this.outState += data.toString();
        this.listener("data", data.toString());
      });

      this.proc.stderr.on("data", (data) => {
        this.errState += data.toString();
        this.listener("error", data.toString());
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

  handler(): GHCIHandler {
    return {
      waitFor: (str: string): Promise<GHCIHandler> => {
        return new Promise((resolve, reject) => {
          this.listener = (type, data) => {
            if (this.timeout !== null) {
              clearTimeout(this.timeout)
            }

            this.timeout = setTimeout(() => {
              if (type === "data") {
                const index = this.outState.indexOf(str);
                if (index > -1) {
                  this.lastWanted = this.outState.substr(0, index);
                  this.outState = "";
                  this.errState = "";
                  resolve(this.handler());
                }
              } else {
                const state = this.errState;
                this.errState = "";
                reject(state);
              }
            }, 300)
          }
        });
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