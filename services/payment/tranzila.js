const https = require('https');
const CryptoJS = require("crypto-js");
require('dotenv').config();

function makeid(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateHeaders() {
  const key = process.env.APP_PUBLIC_KEY;
  const private = process.env.APP_PRIVATE_KEY;
  const time = Math.round(new Date().getTime() / 1000);
  const nonce = makeid(80);
  const hash = CryptoJS.HmacSHA256(key, private + time + nonce).toString(CryptoJS.enc.Hex);

    return {
        'X-tranzila-api-app-key': key,
      'X-tranzila-api-request-time': time,
      'X-tranzila-api-nonce': nonce,
      'X-tranzila-api-access-token': hash,
       'Content-Type': 'application/json'
    };
}

function makeTranzilaRequest(payload, endpoint = process.env.TRANZILA_ENDPOINT || '/v1/transaction/credit_card/create') {
    return new Promise((resolve, reject) => {
        const headers = generateHeaders();
        
        const data = JSON.stringify(payload);
        headers['Content-Length'] = Buffer.byteLength(data);

        const options = {
            hostname: process.env.TRANZILA_BASE,
            path: endpoint,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedResponse = JSON.parse(responseBody);
                    resolve(parsedResponse);
                } catch (err) {
                    reject(new Error('Invalid JSON response from Tranzila'));
                }
            });
        });

        req.on('error', (err) => {
            console.error('Tranzila request error:', err.message);
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

module.exports = {
    makeTranzilaRequest
};
