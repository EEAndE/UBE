import {parse} from 'tldts';

const FEATURES_FULL = {
features
};
const INITIAL = 0;
const FULL = 1;

function analyzeTagAttributes(tagObj, tagList, tagAttribute, domain, isLinksObj) {
    for (let i = 0; i < tagList.length; i++) {
        const attributeContent = tagList[i].getAttribute(tagAttribute);

        if (!attributeContent) {
            continue;
        }

        const conDomain = getCleanDomain(attributeContent);

        if (conDomain !== domain) {
            tagObj.externalCount += 1;
        }

        if (!isLinksObj) {
            tagObj.susWords += countSuspiciousWords(attributeContent);
        }
    }

    if (isLinksObj) {
        tagObj.total = tagList.length;
    }

    tagObj.externalRatio = tagList.length ? tagObj.externalCount / tagList.length : 0;
}

function scanTagResources(domain) {
    const linksObj = {externalCount: 0, total: 0, externalRatio: 0};
    const scriptsObj = {externalCount: 0, susWords: 0, externalRatio: 0};
    const metasObj = {externalCount: 0, susWords: 0, externalRatio: 0};

    analyzeTagAttributes(linksObj, document.querySelectorAll('link'), 'href', domain, true);
    analyzeTagAttributes(scriptsObj, document.querySelectorAll('script'), 'src', domain, false);
    analyzeTagAttributes(metasObj, document.querySelectorAll('meta'), 'content', domain, false);

    const totalExternal = linksObj.externalCount + scriptsObj.externalCount + metasObj.externalCount;

    return {
        'External Metas': metasObj.externalCount,
        'External Metas Suspicious Words': metasObj.susWords,
        'External Metas Ratio': metasObj.externalRatio,
        'External Scripts': scriptsObj.externalCount,
        'External Scripts Suspicious Words': scriptsObj.susWords,
        'External Scripts Ratio': scriptsObj.externalRatio,
        'External Links': linksObj.externalCount,
        'External Links Ratio': linksObj.externalRatio,
        'Total Links': linksObj.total,
        'External Total': totalExternal,
    };
}

function checkStyleAnomalies(tag) {
    if (!(tag instanceof Element)) {
        return false;
    }

    const style = window.getComputedStyle(tag);

    return (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        tag.offsetWidth === 0 ||
        tag.offsetHeight === 0
    );
}

function checkIfAd(src) {
    if (typeof src !== 'string') {
        return false;
    }

    const keywords = ["ads", "analytics", "pixel", "tracker", "doubleclick"];

    return keywords.some(word => src.toLowerCase().includes(word));
}

function extractIFrameFeatures(baseDomain) {
    const counts = {
        src: 0,
        srcIFrameHidden: 0,
        IFrameSrcSize: 0,
        srcDifferentDomain: 0,
        srcNoSandbox: 0,
        srcdoc: 0,
        srcdocJS: 0,
        srcdocIFrameHidden: 0,
        srcdocSusWords: 0,
    };
    const IFrames = document.querySelectorAll('iframe');

    for (let i = 0; i < IFrames.length; i++) {
        try {
            const src = IFrames[i].getAttribute('src')?.trim().toLowerCase();

            if (src && !checkIfAd(src)) {
                counts.src++;

                if (checkStyleAnomalies(IFrames[i])) {
                    counts.srcIFrameHidden++;
                }

                const srcDomain = getCleanDomain(src);

                if (srcDomain && srcDomain !== baseDomain) {
                    counts.srcDifferentDomain++;
                }

                const width = IFrames[i].getAttribute('width')?.trim();
                const height = IFrames[i].getAttribute('height')?.trim();

                if (width && height && (width === "0" || height === "0")) {
                    counts.IFrameSrcSize++;
                }

                if (!IFrames[i].hasAttribute('sandbox')) {
                    counts.srcNoSandbox++;
                }
            }
        } catch (error) {
            console.log(`Failed to parse IFrame src: ${error}`);
        }

        try {
            const srcDoc = IFrames[i].getAttribute('srcdoc')?.trim().toLowerCase();

            if (srcDoc) {
                counts.srcdoc++;

                if (countSuspiciousWords(srcDoc) > 0) {
                    counts.srcdocSusWords++;
                }

                if (checkStyleAnomalies(IFrames[i])) {
                    counts.srcdocIFrameHidden++;
                }

                const jsRegex = /<script\b|javascript:/i;

                if (jsRegex.test(srcDoc)) {
                    counts.srcdocJS++;
                }
            }
        } catch (error) {
            console.log(`Failed to parse IFrame srcdoc: ${error}`);
        }
    }

    const externalSrcRatio = counts.src > 0 ? counts.srcDifferentDomain / counts.src : 0;


    return {
        'IFrame src': counts.src,
        'IFrame src Hidden': counts.srcIFrameHidden,
        'IFrame src Size': counts.IFrameSrcSize,
        'IFrame src Different Domains': counts.srcDifferentDomain,
        'IFrame src No Sandbox': counts.srcNoSandbox,
        'IFrame External src Ratio': externalSrcRatio,
        'IFrame srcdoc': counts.srcdoc,
        'IFrame srcdoc Scripts': counts.srcdocJS,
        'IFrame srcdoc Hidden': counts.srcdocIFrameHidden,
        'IFrame srcdoc Suspicious Words': counts.srcdocSusWords,
        'IFrame Total': counts.src + counts.srcdoc
    };
}

function countSuspiciousWords(text) {
    if (typeof text !== "string") {
        return 0;
    }

    const suspiciousWordRegex = /(log[\s\-]?in|sign[\s\-]?in|auth|user(name)?|email|phone|account|credential|password|passcode|pin|security[\s\-]?code|credit[\s\-]?card|cvv|expiry|iban|bank)/gi;
    const matches = text.match(suspiciousWordRegex);

    return matches ? matches.length : 0;
}

function detectRightClickBlock() {
    let suspiciousScriptCount = 0;
    let contextmenuTagsCount = document.querySelectorAll('[oncontextmenu]').length;

    const inlineScripts = document.querySelectorAll('script:not([src])');

    for (let i = 0; i < inlineScripts.length; i++) {
        const content = inlineScripts[i].textContent;

        if (!content) {
            continue;
        }

        if (/event\s*\.\s*button\s*==\s*2/i.test(content) || /contextmenu/i.test(content)) {
            suspiciousScriptCount++;
        }
    }

    return {
        'Right Click Scripts': suspiciousScriptCount,
        'Right Click Menu Tags': contextmenuTagsCount
    };
}

function detectAutoRedirect(baseDomain) {
    const result = {
        'AR Meta Refresh': 0,
        'AR JS': 0,
        'AR Cross Domain': 0
    };

    const metaTags = document.querySelectorAll('meta[http-equiv]');

    for (let i = 0; i < metaTags.length; i++) {
        const equiv = (metaTags[i].getAttribute('http-equiv') || "").trim().toLowerCase();

        if (equiv && equiv === 'refresh') {
            result['AR Meta Refresh'] = 1;
            break;
        }
    }

    const htmlText = document.documentElement.innerHTML;

    if (/(?:window\.)?location\.(?:href|replace)\s*=/i.test(htmlText)) {
        result['AR JS'] = 1;
    }

    const currentDomain = getCleanDomain(location.hostname);

    // doesn't this mean we're going to be
    // in a different site?
    if (currentDomain !== baseDomain) {
        result['AR Cross Domain'] = 1;
    }

    return result;
}

function checkNLP() {
    const text = document.body.textContent.trim();
    const sensitiveFieldPattern = /log[\s\-]?in|sign[\s\-]?in|sign[\s\-]?on|register|auth(?:enticate|entication)?|user(?:name)?|e[\s\-]?mail|phone|mobile|account|acct|credential|pass(?:word|code)?|pin|security[\s\-]?code|2fa|otp|credit[\s\-]?card|card[\s\-]?number|cvv|cvc|expiry|exp[\s\-]?date|iban|bic|swift|bank|routing[\s\-]?number/gi;
    const matches = Array.from(text.matchAll(sensitiveFieldPattern));

    return {"NLP": matches.length};
}

function detectSuspiciousJS(baseDomain) {
    const highRiskPatterns = [
        /eval\s*\(/i,
        /new\s+Function\s*\(/i,
        /document\.write\s*\(/i,
        /on(mouseover|error|click|submit)\s*=/i,
        /set(?:Timeout|Interval)\s*\(\s*['"]/i,
        /atob\s*\(/i,
        /unescape\s*\(/i,
        /String\.fromCharCode\s*\(/i
    ];

    const mediumRiskPatterns = [
        /(?:window|document)\.location(\.href)?\s*=/i,
        /innerHTML\s*=/i,
        /outerHTML\s*=/i,
        /onbeforeunload/i,
        /window\.open\s*\(/i,
        /history\.pushState\s*\(/i,
        /form\s+.*action\s*=.*login/i,
        /input\s+.*type\s*=\s*['"](password|email)['"]/i
    ];

    const lowRiskPatterns = [
        /navigator\.clipboard/i,
        /navigator\.sendBeacon\s*\(/i,
        /XMLHttpRequest/i,
        /fetch\s*\(/i,
        /new\s+WebSocket\s*\(/i,
        /postMessage\s*\(/i,
        /document\.cookie/i,
        /username\s*[:=]/i,
        /password\s*[:=]/i,
        /email\s*[:=]/i
    ];

    const knownScriptHosts =
        [
            "cdnjs.cloudflare.com",
            "cdn.jsdelivr.net",
            "ajax.googleapis.com",
            "fonts.googleapis.com",
            "fonts.gstatic.com",
            "stackpath.bootstrapcdn.com",
            "ajax.aspnetcdn.com",
            "maxcdn.bootstrapcdn.com",
            "code.jquery.com",
            "cdn.jsdelivr.net",
            "cdn.shopify.com",
            "cdn.wix.com",
            "unpkg.com",
            "polyfill.io",
            "bootstrapcdn.com",
            "gstatic.com",
            "google.com",
            "googleapis.com",
            "microsoft.com",
            "cloudflare.com",
            "cloudfront.net",
            "fbcdn.net",
            "facebook.com",
            "yahooapis.com",
            "notion.so",
            "vercel.app",
            "netlify.app",
            "res.cloudinary.com"
        ]
    let highRiskPatternsCount = 0;
    let mediumRiskPatternsCount = 0;
    let lowRiskPatternsCount = 0;
    let differentDomainsCount = 0;
    let onMouseOver = 0;

    const allScripts = Array.from(document.scripts);
    const inlineScripts = allScripts.filter(script => !script.hasAttribute('src'));
    const externalScripts = allScripts.filter(script => script.hasAttribute('src'));

    for (let i = 0; i < inlineScripts.length; i++) {
        const content = inlineScripts[i].textContent;
        const matchedHighRiskPattern = highRiskPatterns.find(pattern => pattern.test(content));
        const matchedMediumRiskPattern = mediumRiskPatterns.find(pattern => pattern.test(content));
        const matchedLowRiskPattern = lowRiskPatterns.find(pattern => pattern.test(content));

        if (matchedHighRiskPattern) {
            highRiskPatternsCount++;
        }

        if (matchedMediumRiskPattern) {
            mediumRiskPatternsCount++;
        }

        if (matchedLowRiskPattern) {
            lowRiskPatternsCount++;
        }

        if (/onmouseover/i.test(inlineScripts[i].textContent)) {
            onMouseOver++;
        }
    }

    const totalPatternsCount = lowRiskPatternsCount + mediumRiskPatternsCount + highRiskPatternsCount;

    for (let i = 0; i < externalScripts.length; i++) {
        const source = (externalScripts[i].getAttribute('src') || "").trim().toLowerCase();
        const sourceDomain = getCleanDomain(source);

        if (sourceDomain && sourceDomain !== baseDomain && !knownScriptHosts.includes(sourceDomain)) {
            differentDomainsCount++;
        }
    }

    const susJSBehaveRatio = externalScripts.length > 0 ? differentDomainsCount / externalScripts.length : 0;
    const riskPatternsRatio = inlineScripts.length > 0 ? totalPatternsCount / inlineScripts.length : 0;

    return {
        'JS Total': allScripts.length,
        'JS Inline': inlineScripts.length,
        'JS External': externalScripts.length,
        'JS High Risk Patterns': highRiskPatternsCount,
        'JS Medium Risk Patterns': mediumRiskPatternsCount,
        'JS Low Risk Patterns': lowRiskPatternsCount,
        'JS Different Domains': differentDomainsCount,
        'JS Behave Ratio': susJSBehaveRatio,
        'JS Risk Patterns Ratio': riskPatternsRatio,
        'JS OnMouseOver Scripts': onMouseOver,
        'JS OnMouseOver Tags': document.querySelectorAll('[onmouseover]').length
    };
}

function extractSFHFeatures(baseDomain) {
    const skipBlanks = new Set(["about:blank", "#", ""]);
    const susWords = new Set(["login", "signin", "sign-in", "sign in", "verify", "auth", "password", "2fa", "secure", "credentials"]);
    const forms = document.forms;
    const formsLength = forms.length;
    let blankActions = 0;
    let differentDomains = 0;
    let typePasswords = 0;
    let suspiciousWordsCount = 0;

    for (let i = 0; i < formsLength; i++) {
        const action = (forms[i].getAttribute('action') || "").trim().toLowerCase();

        if (!action || skipBlanks.has(action)) {
            blankActions++;
        } else {
            const actionDomain = getCleanDomain(action);

            if (actionDomain && actionDomain !== baseDomain) {
                differentDomains++;
            }
        }

        const inputs = forms[i].querySelectorAll('input, select, textarea');

        for (let j = 0; j < inputs.length; j++) {
            const inputType = inputs[j].getAttribute('type');
            const inputName = inputs[j].getAttribute('name');

            if (inputType && inputType.toLowerCase() === "password") {
                typePasswords++;
            }

            if (inputName) {
                for (let k = 0; k < susWords.length; k++) {
                    if (inputName.includes(susWords[k])) {
                        suspiciousWordsCount++;
                        break;
                    }
                }
            }
        }
    }

    return {
        'SFH Total': formsLength,
        'SFH Blank Actions': blankActions,
        'SFH Different Domains': differentDomains,
        'SFH Passwords': typePasswords,
        'SFH Suspicious Words': suspiciousWordsCount
    }
}

function extractRequestURLFeatures(baseDomain) {
    const resources = ["img", "source", "audio", "video", "embed", "iframe"]
        .flatMap(tag => Array.from(document.querySelectorAll(`${tag}[src]`)));
    const totalResources = resources.length;
    let srcValDiffDomainCount = 0;

    for (let i = 0; i < totalResources; i++) {
        const srcVal = (resources[i].getAttribute("src") || "").trim().toLowerCase();
        const srcValDomain = getCleanDomain(srcVal);

        if (srcValDomain && srcValDomain !== baseDomain) {
            srcValDiffDomainCount++;
        }
    }

    const srcRatio = totalResources > 0 ? (srcValDiffDomainCount / totalResources) : 0;

    return {
        'Resources Total': totalResources,
        'Resources External': srcValDiffDomainCount,
        'Resources External Ratio': srcRatio
    };
}

function extractURLOfAnchor(baseDomain) {
    const skipHrefs = new Set([
        "#",
        "#!",
        "javascript:",
        "javascript:;",
        "javascript:void(0)",
        "javascript:void(0);",
        "javascript:void(1);"
    ]);
    const hrefs = document.querySelectorAll('a[href]');
    const totalHrefs = hrefs.length;
    let anchorEmptyHrefCount = 0;
    let anchorDiffDomainCount = 0;

    for (let i = 0; i < totalHrefs; i++) {
        const link = (hrefs[i].getAttribute("href") || "").trim().toLowerCase();

        if (!link || skipHrefs.has(link)) {
            anchorEmptyHrefCount++;
            console.debug(`[DEBUG] Skipped anchor with empty or invalid href: "${link}"`);
            continue;
        }

        const hrefDomain = getCleanDomain(link);

        if (hrefDomain && hrefDomain !== baseDomain) {
            anchorDiffDomainCount++;
        }
    }

    const validAnchors = totalHrefs - anchorEmptyHrefCount;
    const anchorDiffRatio = validAnchors > 0 ? (anchorDiffDomainCount / validAnchors) : 0;

    return {
        'Anchor Tags': totalHrefs,
        'Anchor Empty Hrefs': anchorEmptyHrefCount,
        'Anchor Different Domains': anchorDiffDomainCount,
        'Anchor Different Domains Ratio': anchorDiffRatio
    };
}

function favicon(baseDomain) {
    let faviconDifferentDomains = 0;
    let faviconInvalidTypes = 0;
    const links = document.querySelectorAll('link');
    let hrefArray = [];

    for (let index = 0; index < links.length; index++) {
        const rel = links[index].getAttribute('rel');
        const href = links[index].getAttribute('href');

        if (rel && rel.toLowerCase().includes('icon') && href) {
            hrefArray.push(href);
        }
    }

    const hasIcon = hrefArray.length > 0 ? 1 : 0;

    hrefArray.forEach(href => {
        if (!checkIconLinkEnd(href)) {
            faviconInvalidTypes += 1;
        }

        const faviconDomain = getCleanDomain(href);

        if (faviconDomain && faviconDomain !== baseDomain) {
            faviconDifferentDomains += 1;
        }
    });

    return {
        'favicon Present': hasIcon,
        'favicon Different Domains': faviconDifferentDomains,
        'favicon Invalid Type': faviconInvalidTypes
    };
}

function checkLoginFormVisibility() {
    const forms = document.querySelectorAll('form');
    let result = 0;


    for (let i = 0; i < forms.length; i++) {
        if (checkStyleAnomalies()) {
            result++;
        }
    }

    return {"Hidden Login Forms": result};
}

function checkIconLinkEnd(hrefLink) { //string
    return /\.(ico|png|gif)([?#].*)?$/i.test(hrefLink);
}

function getCleanDomain(url) {
    const parsed = parse(url);

    return parsed.domain || null;
}

function getFeatureResults(baseDomain, feature) {
    let featureResults = {};

    if (feature === "favicon_check") {
        featureResults = favicon(baseDomain);
    } else if (feature === "url_anchor") {
        featureResults = extractURLOfAnchor(baseDomain);
    } else if (feature === "links_in_tags") {
        featureResults = scanTagResources(baseDomain);
    } else if (feature === "request_sources_from_diff_url") {
        featureResults = extractRequestURLFeatures(baseDomain);
    } else if (feature === "sfh") {
        featureResults = extractSFHFeatures(baseDomain);
    } else if (feature === "iframe") {
        featureResults = extractIFrameFeatures(baseDomain);
    } else if (feature === "suspicious_js") { // already returns scripts count and onmouseover
        featureResults = detectSuspiciousJS(baseDomain);
    } else if (feature === "nlp_text") {
        featureResults = checkNLP();
    } else if (feature === "detect_auto_redirect") {
        featureResults = detectAutoRedirect(baseDomain);
    } else if (feature === "check_login_form_visibility") {
        featureResults = checkLoginFormVisibility(baseDomain);
    } else if (feature === "detect_right_click_block") {
        featureResults = detectRightClickBlock(baseDomain);
    }

    return featureResults;
}

//type == initial/full
function getResults(type) {
    const baseDomain = getCleanDomain(window.location.hostname);
    const features = (type === INITIAL ? FEATURES_INITIAL :
        type === FULL ? FEATURES_FULL : []);
    const results = {}

    for (const [feature, length] of Object.entries(features)) {
        const featureResults = getFeatureResults(baseDomain, feature);
        const featureResultsLen = Object.keys(featureResults).length;

        if (featureResultsLen !== length) {
            console.error(`getFeatureResults for ${feature} failed due to incompatible lengths (Expected ${length}, Got ${featureResultsLen}`);
            continue;
        }

        Object.assign(results, featureResults);
    }

    return results;
}

function getInitialHTML() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                resolve(document.documentElement.outerHTML);
            }, {once: true});
        } else {
            resolve(document.documentElement.outerHTML);
        }
    });
}

function getFullHTML() {
    return new Promise((resolve) => {
        if (document.readyState === "complete") {
            resolve(document.documentElement.outerHTML);
        } else {
            window.addEventListener('load', () => {
                resolve(document.documentElement.outerHTML);
            }, {once: true});
        }
    });
}

async function processDOM(type) {
    const html = await (type === FULL ? getFullHTML() : getInitialHTML());

    return getResults(type);
}

chrome.runtime.sendMessage({type: 'contentScriptReady', source: 'content-script'});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.source === 'background' && request.type === 'checkHTML') {
        chrome.runtime.sendMessage({
            type: 'startedProcessing',
            source: 'content-script',
            tabId: request.tabId,
            url: request.url
        });

        (async () => {
            try {
                const type = request.typeHTML === 'INITIAL' ? INITIAL : FULL;
                const result = await processDOM(type);

                sendResponse({
                    source: 'content-script',
                    success: true,
                    result: result
                });
            } catch (error) {
                sendResponse({
                    source: 'content-script',
                    success: false,
                    error: error.message
                });
            }
        })();

        return true;
    }
});