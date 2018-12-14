'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GHCI } from './ghci';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Start up GHCI
  const ghci = new GHCI();
  let handler = ghci.handler()
    .waitFor(">")
    .then(x => x.send(":set prompt \"\""))

  let timeout: NodeJS.Timer | null = null

  const selectionSubscription = vscode.window.onDidChangeTextEditorSelection(event => {
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

      // We need to make sure we have all the imports that are in the file
      let start = 0
      let line = ""
      while (start < document.lineCount && !document.lineAt(start).text.startsWith("import ")) {
        start++
      }
      while (start < document.lineCount && (line = document.lineAt(start).text).startsWith("import ")) {
        const regex = /^import\ (qualified\ )?([^(\ ]+)/gm
        const matches = line.match(regex)
        if (matches !== null) {
          for (const match in matches) {
            handler = handler.then(ghci => ghci.send(match.trim()).waitFor("\n"))
          }
        }
        start++
      }

      // Next, we grab the selection
      const text = selection.start.isEqual(selection.end)
        // TODO: Make sure the selection grabs raw strings (include the quotes)
        ? document.getText(document.getWordRangeAtPosition(selection.start))
        : document.getText(selection)

      // TODO: Could probably be smarter about qualified imports
      // Instead of just looking for a ".", you could verify the "."
      // against a list of qualified imports collected above
      const isTypeNotValue = text.match(/^[A-Z]/) !== null && text.indexOf(".") == -1
      const command = isTypeNotValue ? ":k" : ":t"

      // Finally, we send the selection to ghci to get the type
      handler.then(ghci => ghci.send(command + " " + text).waitFor("\n"))
        .then(ghci => ghci.print())
        .catch(e => {
          console.log('Error: ', e)
        })
    }, 300)
  })

  context.subscriptions.push(ghci, selectionSubscription)
}

// this method is called when your extension is deactivated
export function deactivate() {
}