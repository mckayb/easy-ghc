import * as vscode from 'vscode';
import { GHCIHandler } from './ghci'

let timeout: NodeJS.Timer | null = null

const decoUnderline = vscode.window.createTextEditorDecorationType({
  borderStyle: 'solid',
  borderColor: '#66f',
  borderWidth: '0px 0px 1px 0px'
});

const decoAside = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#999',
    margin: '0 0 0 20px'
  },
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
})

export const handleSelections = (handler: Promise<GHCIHandler>) =>
  vscode.window.onDidChangeTextEditorSelection(event => {
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
      let imports = []
      while (start < document.lineCount && !document.lineAt(start).text.startsWith("import ")) {
        start++
      }
      while (start < document.lineCount && (line = document.lineAt(start).text).startsWith("import ")) {
        const regex = /^import\ (qualified\ )?([^(\ ]+)/gm
        const matches = line.match(regex)
        if (matches !== null) {
          for (const match of matches) {
            handler = handler
              .then(ghci => ghci.send(match.trim()))

            const words = match.split(" ")
            const moduleName = words.slice(words.length - 1, words.length)
              .reduce((prev, curr) => prev + curr, "")
            imports.push(moduleName)
          }
        }
        start++
      }

      const getWordRangeIncludingChar = (char: string, range: vscode.Range) => {
        const handleIt = (r: vscode.Range): vscode.Range => {
          const beforePos = document.validatePosition(r.start.translate(0, -1))
          const afterPos = document.validatePosition(r.end.translate(0, 1))

          const charBefore = document.getText(new vscode.Range(beforePos, r.start))
          const charAfter = document.getText(new vscode.Range(r.end, afterPos))

          if (char === charBefore || char === charAfter) {
            return new vscode.Range(beforePos, afterPos)
          } else {
            return r
          }
        }

        // Fix this logic - Hovering over Baz.baz depends on which
        // side of the period you hovered over
        return range.start.isEqual(range.end)
          ? handleIt(document.getWordRangeAtPosition(range.start) || range)
          : range
      }

      // Next, we grab the selection
      const range = getWordRangeIncludingChar('"', selection)
      const text = document.getText(range).trim()

      // And do some last checks to make sure it's a value and not an import
      const isTypeNotValue = text.match(/^[A-Z]/) !== null && text.indexOf(".") == -1
      const isModule = imports.indexOf(text) >= 0
      const command = isTypeNotValue ? ":k" : ":t"

      if (!isModule) {
        // Finally, we send the selection to ghci to get the type
        handler.then(ghci => ghci.send(command + " " + text).waitFor("\n"))
          .then(ghci => ghci.print())
          .then(ghci => {
            const lineRange = document.lineAt(range.start.line).range;
            event.textEditor.setDecorations(decoUnderline, [{
              range,
              hoverMessage: ghci.getOutput()
            }]);
            event.textEditor.setDecorations(decoAside, [{
              range: lineRange,
              renderOptions: {
                after: {
                  contentText: ghci.getOutput()
                }
              }
            }]);
          })
          .catch(e => {
            console.log('Error: ', e)
            event.textEditor.setDecorations(decoUnderline, []);
            event.textEditor.setDecorations(decoAside, []);
          })
      } else {
        event.textEditor.setDecorations(decoUnderline, []);
        event.textEditor.setDecorations(decoAside, []);
      }
    }, 300)
  })