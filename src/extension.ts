'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GHCI } from './ghci';
import { handleSelections } from './selections'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Start up GHCI
  const ghci = new GHCI();
  let handler = ghci.handler()
    .waitFor(">")
    .then(x => x.send(":set prompt \"\""))

  const selectionSubscription = handleSelections(handler)

  context.subscriptions.push(ghci, selectionSubscription)
}

// this method is called when your extension is deactivated
export function deactivate() {
}