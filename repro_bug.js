const text = "hello";
const lines = text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

console.log("Input:", text);
console.log("Output:", lines);

const text2 = "hello, world";
const lines2 = text2
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
console.log("Input 2:", text2);
console.log("Output 2:", lines2);
