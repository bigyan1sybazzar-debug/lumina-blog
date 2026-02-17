const https = require('https');

function test(headers) {
    const options = {
        hostname: 'www.1secmail.com',
        path: '/api/v1/?action=genRandomMailbox&count=1',
        method: 'GET',
        headers: headers
    };

    console.log('Testing with headers:', JSON.stringify(headers));

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => console.log(`Body partial: ${data.substring(0, 100)}`));
    });

    req.on('error', e => console.error(e));
    req.end();
}

// Test 1: Standard User-Agent
test({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
});

// Test 2: Simulating Curl
setTimeout(() => {
    test({
        'User-Agent': 'curl/7.64.1'
    });
}, 2000);

// Test 3: No User-Agent
setTimeout(() => {
    test({});
}, 4000);
