const fs = require('fs');
let f = fs.readFileSync('components/HomeContent.tsx', 'utf8');

// Replace ALL carriage returns and newlines inside className="..." strings
// Walk character by character to find every className="..." block and flatten it
let res = [];
let i = 0;
while (i < f.length) {
    // Check if we're at start of className="
    if (f.slice(i, i + 11) === 'className="') {
        let j = i + 11;
        // Find closing quote (not escaped)
        while (j < f.length && f[j] !== '"') {
            j++;
        }
        // Extract the className value, replace \r\n and \r and \n with single space
        let clsValue = f.slice(i, j + 1);
        clsValue = clsValue.replace(/[\r\n]+/g, ' ');
        // Also collapse multiple spaces into one
        clsValue = clsValue.replace(/  +/g, ' ');
        res.push(clsValue);
        i = j + 1;
    } else {
        res.push(f[i]);
        i++;
    }
}

const fixed = res.join('');
fs.writeFileSync('components/HomeContent.tsx', fixed, 'utf8');

// Verify no more \r inside classNames
const verify = fs.readFileSync('components/HomeContent.tsx', 'utf8');
const classNameMatches = verify.match(/className="[^"]*[\r\n][^"]*"/g);
if (classNameMatches) {
    console.log('WARNING: Still found', classNameMatches.length, 'multiline classNames!');
    classNameMatches.forEach(m => console.log(' ->', JSON.stringify(m.substr(0, 100))));
} else {
    console.log('SUCCESS: All className strings are now single-line!');
}
