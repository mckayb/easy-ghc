'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GHCI } from './ghci';
import parse from "./doc_parser";

const trace = (s: any) => (t: any) => {
  console.log(s);
  console.log(t);
  return t;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const ghci = new GHCI();

    const handler = ghci.handler()
      .waitFor(">")
      .then(x => x.send(":set prompt \"\""));

    let hover = vscode.languages.registerHoverProvider({ language: "haskell", scheme: "file" }, {
      provideHover(document, position, token): Promise<vscode.Hover> {
        return parse(document, position, token)
          .then(res => handler.then(ghci => ghci.send(":t " + res).waitFor("\n")))
          .then(x => new vscode.Hover(x.getOutput()));
      }
    });

    // context.subscriptions.push(hover, ghci);
    context.subscriptions.push(hover);
}

// this method is called when your extension is deactivated
export function deactivate() {
}