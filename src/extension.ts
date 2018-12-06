'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GHCI } from './ghci';
import parse from "./doc_parser";
import { trace } from "./utils";

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
          .then(trace("Parse Result: "))
          .then(res => res.cata(
            () => Promise.reject(),
            (x) => handler.then(ghci => ghci.send(":t " + x).waitFor("\n"))
                          .then(ghci => ghci.print())
                          .then(ghci => new vscode.Hover(ghci.getOutput()))
          ));
      }
    });

    context.subscriptions.push(hover, ghci);
}

// this method is called when your extension is deactivated
export function deactivate() {
}