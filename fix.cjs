const fs = require('fs');
let f = fs.readFileSync('components/HomeContent.tsx', 'utf8');

// The regex will match any `className="..."` string that contains a newline character.
f = f.replace(/className="([^"]*\n[^"]*)"/g, (match, p1) => {
    return 'className="' + p1.replace(/\n|\\n/g, ' ') + '"';
});

// Since the `replace` function above natively supports multiline matches without `/m` (because [\s\S] or typical regex inside capturing groups doesn't stop at line boundaries unless `.` is used), let me make sure it covers ALL newlines.
// A simpler way is to just find all `className="` and `"` pairs and replace all newlines within them.
let inClassName = false;
let res = [];
for (let i = 0; i < f.length; i++) {
    if (f.slice(i, i + 11) === 'className="') {
        let j = i + 11;
        while (j < f.length && f[j] !== '"') {
            j++;
        }
        let clsValue = f.slice(i, j + 1).replace(/\r?\n/g, ' ');
        res.push(clsValue);
        i = j;
    } else {
        res.push(f[i]);
    }
}
fs.writeFileSync('components/HomeContent.tsx', res.join(''), 'utf8');
console.log('Fixed newlines in className!');
