
const getWordDesc = (l, i) => {
  if ((i - 1) >= 0 && l[i - 1] && l[i - 1].trim() !== "") {
    return getWordDesc(l, i - 1) + l[i - 1];
  } else {
    return "";
  }
}

const getWordAsc = (l, i) => {
  if ((i + 1) >= 0 && l[i + 1] && l[i + 1].trim() !== "") {
    return l[i + 1] + getWordAsc(l, i + 1);
  } else {
    return "";
  }
}

const getChar = (l, i) => {
  if (i >= 0 && l[i] && l[i].trim() !== "") {
    return l[i];
  } else {
    return "";
  }
}

const getWord = (l, c) => {
  const init = getChar(l, c);
  return init
    ? getWordDesc(l, c) + init + getWordAsc(l, c)
    : init;
}

const line = "The doc went to the market";
const char = 5;

console.log(getWord(line, char));
console.log(testDesc(line, char));
