export const trace = (s: string) => <T>(t: T): T => {
  console.log(s);
  console.log(t);
  return t;
};