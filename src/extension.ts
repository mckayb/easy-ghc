'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GHCI } from './ghci';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const ghci = new GHCI();

    const handler = ghci.handler()
      .waitFor(">")
      .then(x => x.send(":set prompt \"\""))

    let timeout: NodeJS.Timer | null = null

    const selection = vscode.window.onDidChangeTextEditorSelection(event => {
      const document = event.textEditor.document
      if (document.languageId !== "haskell") {
        return
      }

      if (timeout !== null) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        const selection = event.selections[0]
        const startLine = document.lineAt(selection.start.line)
        const endLine = document.lineAt(selection.end.line)

        // If the line is worthless, ignore it
        if (startLine.isEmptyOrWhitespace && endLine.isEmptyOrWhitespace) {
          return
        }

        // TODO: Get the imports in the document and import them

        const text = selection.start.isEqual(selection.end)
          ? document.getText(document.getWordRangeAtPosition(selection.start))
          : document.getText(selection)

        handler.then(ghci => ghci.send(":t " + text).waitFor("\n"))
          .then(ghci => ghci.print())
          .catch(e => {
            console.log('Error: ', e)
          })
      }, 300)
    })

    context.subscriptions.push(ghci, selection)
}

// this method is called when your extension is deactivated
export function deactivate() {
}