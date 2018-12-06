import { TextDocument, Position, CancellationToken } from "vscode";
import { exec } from "child_process";
import { Maybe } from "monet";
import { trace } from "./utils";

const parse = (document: TextDocument, position: Position, token: CancellationToken): Promise<Maybe<string>> => {
  return new Promise((resolve, reject) => {
    exec("cat " + document.fileName, (err, stdout, stderr) => {
      const line = stdout.split("\n")[position.line];
      const index = position.character;

      const maybeWord: Maybe<string> = Maybe.of(getWordFromLineAndIndex(line, index))
        .map(cleanWord)
        .map(trace("Word: "))
        .chain(isValueNotType);

      resolve(maybeWord);
    });
  });
};

const capitalize = (word: string): string =>
  word.length === 0
    ? ""
    : word.charAt(0).toUpperCase() + word.slice(1, word.length);

// TODO: This isn't good enough. If I pass in word="\"foo\"", then capitalize("\"foo\"") == "\"foo\""
const isValueNotType = (word: string): Maybe<string> =>
  capitalize(word) === word
    ? Maybe.Nothing()
    : Maybe.Just(word);

const cleanWord = (word: string): string =>
  word.trim()
    .split("")
    .filter(l => ["(", ")"].indexOf(l) === -1)
    .reduce((prev, curr) => prev + curr, "");

const getWordFromLineAndIndex = (line: string, index: number): string => {
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

    const getWord = (l: string, i: number): string => {
      const init = getChar(l, i);
      return init
        ? getWordDesc(l, i) + init + getWordAsc(l, i)
        : init;
    };

    return getWord(line, index);
};

export default parse;