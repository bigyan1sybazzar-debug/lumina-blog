const https = require('https');

function test() {
    const options = {
        hostname: 'api.guerrillamail.com',
        path: '/ajax.php?f=get_email_address',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    };

    console.log('Testing Guerrilla Mail...');

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => console.log(`Body: ${data}`));
    });

    req.on('error', e => console.error(e));
    req.end();
}

test();
