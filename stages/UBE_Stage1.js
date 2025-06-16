import {parse} from 'tldts';
import {Address4, Address6} from 'ip-address';

const HEADERS = [
    "URL Length",
    "Subdomains",
    "Hostname Length",
    "IP",
    "Shortener",
    "Hyphens",
    "At Signs",
    "Query Parameters",
    "Resources",
    "Suspicious Characters",
];

function hasSuspiciousChars(hostname) {
    const suspiciousCharsRegex = /[@^{}\[\]~|`%\\]/;

    return suspiciousCharsRegex.test(hostname) ? 1 : 0;
}

function numberOfResources(urlPath) {
    const segments = urlPath.replace(/^\/+|\/+$/g, '').split('/');

    return segments.filter(s => s && s.trim() !== '').length;
}

function numberOfQueryParameters(urlSearchParams) {
    return [...urlSearchParams.keys()].length;
}

function numberOfAtSigns(rawURL) {
    return (rawURL.match(/@/g) || []).length;
}

function numberOfHyphens(rawURL) {
    return (rawURL.match(/-/g) || []).length;
}

function isURLShortener(hostname) {
    const shorteners = [
        'bit\\.ly',
        'goo\\.gl',
        'shorte\\.st',
        'go2l\\.ink',
        'x\\.co',
        'ow\\.ly',
        't\\.co',
        'tinyurl\\.com',
        'tr\\.im',
        'is\\.gd',
        'cli\\.gs',
        'yfrog\\.com',
        'migre\\.me',
        'ff\\.im',
        'tiny\\.cc',
        'url4\\.eu',
        'twit\\.ac',
        'su\\.pr',
        'twurl\\.nl',
        'snipurl\\.com',
        'short\\.to',
        'budurl\\.com',
        'ping\\.fm',
        'post\\.ly',
        'just\\.as',
        'bkite\\.com',
        'snipr\\.com',
        'fic\\.kr',
        'loopt\\.us',
        'doiop\\.com',
        'short\\.ie',
        'kl\\.am',
        'wp\\.me',
        'rubyurl\\.com',
        'om\\.ly',
        'to\\.ly',
        'bit\\.do',
        'lnkd\\.in',
        'db\\.tt',
        'qr\\.ae',
        'adf\\.ly',
        'bitly\\.com',
        'cur\\.lv',
        'ity\\.im',
        'q\\.gs',
        'po\\.st',
        'bc\\.vc',
        'twitthis\\.com',
        'u\\.to',
        'j\\.mp',
        'buzurl\\.com',
        'cutt\\.us',
        'u\\.bb',
        'yourls\\.org',
        'prettylinkpro\\.com',
        'scrnch\\.me',
        'filoops\\.info',
        'vzturl\\.com',
        'qr\\.net',
        '1url\\.com',
        'tweez\\.me',
        'v\\.gd',
        'link\\.zip\\.net',
        'amzn\\.to',
        'murl\\.eu',
        'buff\\.ly',
        'shortlink\\.com',
        'qik\\.com',
        'linkd\\.in',
        'twitr\\.co',
        'shrtfly\\.com',
        '1drv\\.ms'
    ];

    const urlShortenerPattern = new RegExp(`^(${shorteners.join('|')})$`, 'i');

    return urlShortenerPattern.test(hostname) ? 1 : 0;
}

function isValidIPv4(ip) {
    return Address4.isValid(ip);
}

function isValidIPv6(ip) {
    return Address6.isValid(ip);
}

function isIPAddress(hostname) {
    return (isValidIPv4(hostname) || isValidIPv6(hostname)) ? 1 : 0;
}

function getCleanFullURL(parsedURL) {
    return parsedURL.hostname.replace(/^www\./, "")
        + parsedURL.pathname.replace(/\/+$/, '')
        + parsedURL.search.replace(/\/+$/, '');
}

function lengthHostname(cleanHostname) {
    return cleanHostname.length;
}

function numberOfSubdomains(urlSubDomain) {
    if (!urlSubDomain || urlSubDomain === "www") {
        return 0;
    }

    return urlSubDomain.replace(/^www\.?/, "").split(".").length;
}

function lengthURL(hostname) {
    return hostname.length;
}

function getCleanHostname(tldtsURL) {
    const cleanSubdomain = tldtsURL.subdomain.replace(/^www\.?/, "");
    return cleanSubdomain ? `${cleanSubdomain}.${tldtsURL.domainWithoutSuffix}` : tldtsURL.domainWithoutSuffix;
}

function constructResultsDict(rawURL, cleanFullURL, tldtsURL, cleanHostnameNoTLD, cleanHostNameWithTLD, parsedURL) {
    const parseResults = [
        lengthURL(cleanFullURL),
        numberOfSubdomains(tldtsURL.subdomain),
        lengthHostname(cleanHostnameNoTLD),
        isIPAddress(cleanHostNameWithTLD),
        isURLShortener(cleanHostNameWithTLD),
        numberOfHyphens(rawURL),
        numberOfAtSigns(rawURL),
        numberOfQueryParameters(parsedURL.searchParams),
        numberOfResources(parsedURL.pathname),
        hasSuspiciousChars(cleanFullURL)
    ]

    return Object.fromEntries(HEADERS.map((key, i) => [key, parseResults[i]]));
}

export async function processURL(rawURL) {
    // ip-address "url" might break this
    // *remember to fix
    let results = {};

    try {
        const parsedURL = new URL(rawURL);
        const tldtsURL = parse(rawURL)
        const cleanFullURL = getCleanFullURL(parsedURL);
        const cleanHostnameNoTLD = getCleanHostname(tldtsURL);
        const cleanHostNameWithTLD = `${cleanHostnameNoTLD}.${tldtsURL.publicSuffix}`;

        results = constructResultsDict(rawURL, cleanFullURL, tldtsURL, cleanHostnameNoTLD, cleanHostNameWithTLD, parsedURL);

        const response = await fetch(
            "url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: ""
        });

        if (response.ok) {
            const resultST2 = await response.json();

            Object.assign(results, resultST2);
        }
        else {
            console.error(`Failed to query API. API responded with status ${response.status}`);
        }
    } catch (error) {
        if (error instanceof TypeError) {
            console.error('Invalid URL:', error.message);
        }
        else {
            console.error('API or parsing error:', error);
        }
    }

    return results;
}

console.log("hey");