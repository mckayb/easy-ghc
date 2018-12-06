import { TextDocument, Position, CancellationToken } from "vscode";
import { exec } from "child_process";

const parse = (document: TextDocument, position: Position, token: CancellationToken): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec("cat " + document.fileName, (err, stdout, stderr) => {
      const line = stdout.split("\n")[position.line];

      const index = position.character;

      // TODO: Find a way to refactor this hot garbage.
      const getWordDesc = (l: string, i: number): string => {
        if ((i - 1) >= 0 && l[i - 1] && l[i - 1].trim() !== "") {
          return getWordDesc(l, i - 1) + l[i - 1];
        } else {
          return "";
        }
      };

      const getWordAsc = (l: string, i: number): string => {
        if ((i + 1) >= 0 && l[i + 1] && l[i + 1].trim() !== "") {
          return l[i + 1] + getWordAsc(l, i + 1);
        } else {
          return "";
        }
      };

      const getChar = (l: string, i: number): string => {
        if (i >= 0 && l[i] && l[i].trim() !== "") {
          return l[i];
        } else {
          return "";
        }
      };

      const getWord = (l: string, c: number): string => {
        const init = getChar(l, c);
        return init
          ? getWordDesc(l, c) + init + getWordAsc(l, c)
          : init;
      };

      // TODO: Check if this thing is a type, rather than a value (check for capital letter)
      resolve(getWord(line, index));
      // resolve("foo");
    });
    // console.log(document);
    // console.log(position);
  });
};

export default parse;