import https from 'node:https';
import {URL} from 'node:url';

const API_URL = "";
const TIMEOUT_API = 2000;

export async function fetchJson(finalDomain) {
    const headers = {
	};

    return new Promise((resolve, reject) => {
        const urlObj = new URL(API_URL);

        const requestOptions = {
            
        };

        const req = https.get(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    return reject(new Error(`Request failed with status ${res.statusCode}`));
                }

                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });

        req.on('error', reject);

        // optional timeout to abort hanging connections
        req.setTimeout(TIMEOUT_API, () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
    });
}
