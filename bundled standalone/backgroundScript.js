import {processURL} from './dist/bundleBackgroundStages.js';
import {PhishingModel} from "./model.js";
import {customMd5HashVector} from "./dist/bundleHashing.js";

const tabResults = new Map();
const activeProcessing = new Map();
const processingQueue = [];
const MAX_CONCURRENT = 3;
const MAX_STORED_RESULTS = 30;


async function getFirstAndSecondStagesResults(tabId, url) {
    try {
        console.log(`⏳ (Stage 1) Processing Tab ${tabId}`);

        const urlResult = await processURL(url);

        console.log(`✅ (Stage 1) Successfully finished for Tab ${tabId}`);

        if (Object.keys(urlResult).length === 0) {
            console.warn(`ℹ️ (Stage 1) Empty result received for Tab ${tabId}`);

            return {};
        }

        return urlResult;
    } catch (error) {
        console.error(`❌ (Stage 1) Failed to process Tab ${tabId}`);
        throw error;
    }
}

async function getThirdStageResults(tabId, url) {
    // set up listener and return promise immediately
    let contentScriptReadyPromise = waitForContentScriptReady(tabId);

    // for timeout / race condition / other exceptions
    contentScriptReadyPromise.catch(() => {
        console.error(`❌ Ready Promise failed for Tab ${tabId}`);
    });

    try {
        console.log(`🛠️ (Stage 3) Injecting content script to Tab ${tabId}`);

        await injectContentScript(tabId, url);

        console.log(`⏳ (Stage 3) Waiting for 'content script ready' message for Tab ${tabId}`);

        // start the timeout AFTER injection
        contentScriptReadyPromise.startTimeout(2000);
        // now we await promise
        await contentScriptReadyPromise;

        console.log(`☑️ (Stage 3) Content script ready for Tab ${tabId}`);

        // send message to start processing html
        // (global listener catches 'ready' response)
        const response = await sendMessageToContentScript(tabId, {
            source: 'background',
            type: 'checkHTML',
            typeHTML: 'FULL',
            tabId: tabId,
            url: url
        });

        console.log(`✅ (Stage 3) Successfully finished for Tab ${tabId}`);

        if (!response.result || Object.keys(response.result).length === 0) {
            console.warn(`ℹ️ (Stage 3) Empty result received for Tab ${tabId}`);

            return {};
        }

        return response.result;
    } catch (error) {
        console.error(`❌ (Stage 3) Failed to process Tab ${tabId}`);

        throw error;
    } finally {
        // cancel (reject) the promise if not settled
        contentScriptReadyPromise?.cancel?.();
    }
}

async function processAllStages(tabId, url) {
    // await stages concurrently
    const [firstAndSecondStagesResult, thirdStageResult] = await Promise.all([
        getFirstAndSecondStagesResults(tabId, url),
        getThirdStageResults(tabId, url)
    ]);

    return {
        ...firstAndSecondStagesResult,
        ...thirdStageResult
    };
}

function waitForContentScriptReady(tabId) {
    console.log(`⚙️ (Stage 3) Setting up listener for 'content script ready' message for Tab ${tabId}`);

    let readyListener;
    let timeoutHandle;
    let promiseReject;

    // for clearing timeout and listener
    const cleanup = () => {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }

        if (readyListener) {
            chrome.runtime.onMessage.removeListener(readyListener);
            readyListener = null;
        }
    };

    const promise = new Promise((resolve, reject) => {
        promiseReject = reject;

        // listener for 'content script ready'
        readyListener = (message, sender) => {
            if (sender.tab?.id === tabId &&
                message.source === 'content-script' &&
                message.type === 'contentScriptReady') {
                cleanup();
                resolve();
            }
        };

        chrome.runtime.onMessage.addListener(readyListener);
    });

    // add as function so we can start timeout manually later
    promise.startTimeout = (timeoutMs = 5000) => {
        if (timeoutHandle) {
            return;
        }

        timeoutHandle = setTimeout(() => {
            cleanup();
            promiseReject(new Error(`'Content script ready' timeout for Tab ${tabId}`));
        }, timeoutMs);
    };

    promise.cancel = () => {
        cleanup();
        promiseReject(new Error('Cancelled'));
    };

    return promise;
}

async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['./dist/bundleContent.js']
        });

        console.log(`☑️ Content script injected to Tab ${tabId}`);
    } catch (error) {
        console.error(`⚠️ Content script injection failed for Tab ${tabId}`);
        throw error;
    }
}

function sendMessageToContentScript(tabId, message, timeoutMs = 10000) {
    console.log(`✉️ Sending message to Tab ${tabId} to start processing`);

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Message timeout for Tab ${tabId}`));
        }, timeoutMs);

        chrome.tabs.sendMessage(tabId, message,
            (response) => {
                clearTimeout(timeout);

                if (chrome.runtime.lastError) {
                    reject(new Error(`Failed to send message to Tab ${tabId}: ${chrome.runtime.lastError.message}`));

                    return;
                }

                if (response?.source === 'content-script' && response?.success) {
                    resolve(response);
                } else {
                    reject(new Error(response?.error || 'Unknown error from content script'));
                }
            });
    });
}

function checkAvailability(tabId) {
    if (processingQueue.length === 0) {
        console.log('ℹ️ Processing queue empty');

        return false;
    }

    if (activeProcessing.size >= MAX_CONCURRENT) {
        console.log(`🚨 At max capacity [${activeProcessing.size}/${MAX_CONCURRENT}], Tab ${tabId} waiting...`);

        return false;
    }

    return true;
}

function validateCapacity(tabId) {
    if (tabResults.size >= MAX_STORED_RESULTS) {
        const oldestEntry = Array.from(tabResults.entries())
            .sort((a, b) => a[1].timestamps.end - b[1].timestamps.end)[0];

        tabResults.delete(oldestEntry[0]);

        console.log(`🗑️ Removed oldest result (Tab ${oldestEntry[0]}) to accompany new results for Tab ${tabId}`);
    }
}

function sendCompleteMessageToPopup(details) {
    chrome.runtime.sendMessage(details, () => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
        }
    })
}


function testModel(results) {
    const parts =
        [
            HEADERS
    ]
    const hash_vector = customMd5HashVector([results["Final Domain"], results["SSL Issuer"], results["Domain Registrar"]]);
    const drop_indices = [13, 16, 19];
    const numeric_features = parts
        .filter((_, index) => !drop_indices.includes(index))
        .map(x => parseFloat(x));

    const full_input = [...numeric_features, ...hash_vector];
    const prediction = PhishingModel().predict(full_input);

    return prediction ? 'phishing!' : 'safe!';
}


async function processNext() {
    if (!checkAvailability(processingQueue[0])) {
        return;
    }

    const {tabId, url} = processingQueue.shift();

    activeProcessing.set(tabId, Date.now());

    console.log(`🚀 Started processing Tab ${tabId} [Queue: ${processingQueue.length}, Active: ${activeProcessing.size}]`);

    try {
        await chrome.tabs.get(tabId);

        const combinedResults = await processAllStages(tabId, url);

        if (Object.keys(combinedResults).length === 0) {
            console.warn(`ℹ️ No results received for Tab ${tabId}`)
        }

        console.log(`✅ Successfully received results for Tab ${tabId}`);

        validateCapacity(tabId);

        ///////
        combinedResults['Prediction'] = testModel(combinedResults);
        //////
        
        tabResults.set(tabId, {
            url: url,
            result: combinedResults,
            timestamps: {
                begin: activeProcessing.get(tabId),
                end: Date.now()
            }
        });

        sendCompleteMessageToPopup({
            source: 'background',
            type: 'analysisComplete',
            tabId: tabId,
            result: tabResults.get(tabId)
        });

        console.log(`💾 Saved results for Tab ${tabId} - ${url}`);
    } catch (error) {
        sendCompleteMessageToPopup({
            source: 'background',
            type: 'analysisComplete',
            tabId: tabId,
            error: 'Failed to process Tab.<br>Try refreshing.'
        });

        if (error.message?.includes('No tab with id')) {
            console.log(`ℹ️ Tab ${tabId} was closed before processing`);
        } else {
            console.error(`❌ Processing failed for Tab ${tabId} - ${url}: `, error.message);
        }
    } finally {
        activeProcessing.delete(tabId);
        console.log(`🔄 Finished Tab ${tabId} - ${ur}\nℹ️ [Queue: ${processingQueue.length}, Active: ${activeProcessing.size}]`);

        await processNext();
    }
}

chrome.webRequest.onResponseStarted.addListener(
    async (details) => {
        console.log("🔔 New WR response received!");

        if (!details || !details.tabId || !details.url) {
            console.error("⚠️ Invalid response details");

            return;
        }

        let currentWindowTabId = details.tabId;

        if (currentWindowTabId === -1) {
            const correctTab = await chrome.tabs.query({url: details.url, active: true, currentWindow: true});

            if (correctTab) {
                currentWindowTabId = correctTab[0].id;
            } else {
                console.error(`❌ Failed to get tabId for Tab URL ${details.url}`);
                return;
            }
        }

        // need to add a feature
        // that prevents from injecting
        // to subdomains of the same domain
        // (probably database checks later on)
        // for now can ignore

        console.log(`📥 New page loading at Tab ${currentWindowTabId} - ${details.url}`);

        processingQueue.push({
            tabId: currentWindowTabId,
            url: details.url,
            timestamp: Date.now()
        });

        await processNext();
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame']
    },
    ["responseHeaders"]
);

chrome.tabs.onRemoved.addListener((tabId) => {
    if (activeProcessing.has(tabId)) {
        console.log(`🗑️ Cleaned up closed tab ${tabId} from active processing`);
        activeProcessing.delete(tabId);
    }

    const queueIndex = processingQueue.findIndex(item => item.tabId === tabId);

    if (queueIndex !== -1) {
        processingQueue.splice(queueIndex, 1);
        console.log(`🗑️ Removed closed tab ${tabId} from queue`);
    }

    if (tabResults.has(tabId)) {
        tabResults.delete(tabId);
        console.log(`🗑️ Cleaned up results for closed tab ${tabId}`);
    }
});

// for cleaning up any idle entries
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [tabId, timestamp] of activeProcessing.entries()) {
        if (now - timestamp > staleThreshold) {
            console.log(`🧹 Cleaning up idle processing entry for tab ${tabId}`);
            activeProcessing.delete(tabId);
        }
    }
}, 60000); // 1 minute

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.source === 'popup' && request.type === 'getCheckResult') {
        const tabId = request.tabId;

        if (!tabId) {
            sendResponse({
                source: 'background',
                error: 'No tabId provided'
            });

            return;
        }

        const result = tabResults.get(tabId);

        if (result) {
            sendResponse({
                source: 'background',
                tabId: tabId,
                result: result
            });
        } else {
            if (activeProcessing.has(tabId)) {
                sendResponse({
                    source: 'background',
                    tabId: tabId,
                    processing: true
                });
            } else {
                sendResponse({
                    source: 'background',
                    tabId: tabId,
                    error: 'No analysis results available for this tab<br>Try refreshing the page'
                });
            }
        }
    } else if (request.source === 'content-script' && request.type === 'startedProcessing') {
        console.log(`⏳ (Stage 3) Processing Tab ${request.tabId}`);
    }
});