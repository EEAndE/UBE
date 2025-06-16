let currentTabID = null;

async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    return tab;
}

function formatValue(value) {
    if (value === null || value === undefined) {
        return '<span class="value">—</span>';
    }

    if (typeof value === 'number') {
        return `<span class="value number">${value.toLocaleString()}</span>`;
    }

    if (typeof value === 'string') {
        if (value.startsWith('http://') || value.startsWith('https://')) {
            return `<span class="value url">${value}</span>`;
        }

        return `<span class="value">${value}</span>`;
    }

    return `<span class="value">${String(value)}</span>`;
}

function showError(message) {
    const container = document.getElementById('result');

    container.innerHTML = `<div class="error">${message}</div>`;
}

function showLoading() {
    const container = document.getElementById('result');

    container.innerHTML = `
            <div class="loading">
                <div id="loading-text" class="loading-text">Analyzing page...</div>
                    <div class="loading-animation">
                    <div class="scanning-line"></div>
                    <div class="pulse-dots">
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                    </div>
                </div>
            </div>
        `;
}

function updateLoadingText(newText) {
    const loadingText = document.getElementById('loading-text');

    if (loadingText) {
        loadingText.textContent = newText;
    }
}

function displayResultsData(results) {
    const container = document.getElementById('result');

    if (!results || Object.keys(results).length === 0) {
        container.innerHTML = '<div class="no-data">No analysis data available</div>';

        return;
    }

    const processingTime = ((results.timestamps.end - results.timestamps.begin) / 1000).toFixed(3);

    let html = '';

    html += `<div class="section">
                 <div class="section-title">Page Information</div>
                 <div class="item">
                    <div class="key">URL:</div>
                    ${formatValue(results.url)}
                 </div>
                 <div class="item">
                    <div class="key">Process Time:</div>
                    <span class="value number">${processingTime}s</span>
                 </div>
                 <div class="item">
                    <div class="key">Analysis:</div>
                    <span class="value status-complete">Complete</span>
                 </div>
             </div>`;

    html += `<div class="section">
                <div class="section-title">Results</div>`;

    for (const [key, value] of Object.entries(results.result)) {
        html += `<div class="item">
                     <div class="key">${key}:</div>
                     ${formatValue(value)}
                 </div>`;
    }

    html += '</div>';

    container.innerHTML = html;
}

function handleResultsMessage(message, onSuccess) {
    if (chrome.runtime.lastError) {
        console.error(`Communication error: ${chrome.runtime.lastError.message}`);
        showError(`Communication error: ${chrome.runtime.lastError.message}`);

        return;
    }

    if (message.error) {
        showError(message.error);

        return;
    }

    if (message.processing) {
        return;
    }

    if (!message.result) {
        const container = document.getElementById('result');

        container.innerHTML = '<div class="no-data">No result available</div>';

        return;
    }

    updateLoadingText('Fetching results...');
    setTimeout(() => {
        onSuccess(message)
    }, 1000);
}

async function displayResults() {
    try {
        showLoading();

        const currentTab = await getCurrentTab();

        if (!currentTab?.id) {
            console.error('Could not get current tab information');
            return;
        }

        currentTabID = currentTab.id;

        chrome.runtime.sendMessage(
            {
                type: 'getCheckResult',
                source: 'popup',
                tabId: currentTab.id,
                url: currentTab.url
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError.message);
                    return;
                }

                if (response?.source === 'background') {
                    handleResultsMessage(response, (response) => {
                        displayResultsData(response.result);
                    });
                }
            }
        );
    } catch (error) {
        console.error('Unexpected error in popup:', error);
        showError(`Unexpected error: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', displayResults);

chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'analysisComplete' &&
        message.source === 'background' &&
        message.tabId === currentTabID) {

        handleResultsMessage(message, (message) => {
            displayResultsData(message.result);
        });
    }
});