import {UBEDebug} from './debug.js';
import {UBEEvents} from './events.js';
import {UBEAnalysis} from './analysis.js';
import {ubolog} from '../console.js';
import µb from '../background.js';
import io from '../assets.js';
import {UBENetwork} from './network.js';
import {getAssetSourceRegistry} from '../assets.js';

const _state = {
    enabled: false,
    tabResults: new Map(),
    activeProcessing: new Map(),
    processingQueue: [],
    allResults: []
};

const _constants = {
    MAX_CONCURRENT: 10,
    MAX_STORED_RESULTS: 30,
    PHISHING_LIST_ID:'phishing-UBE',
    MESSAGE_TYPES: {
        ANALYSIS_COMPLETE: 'analysisComplete',
        ANALYSIS_STARTED: 'analysisStarted',
    },
    LOG_ICONS: {
        START: '🚀',
        SUCCESS: '✅',
        ADVANCED: '☑️',
        WARNING: '⚠️',
        ERROR: '❌',
        SAVE: '💾',
        FINISH: '🔄',
        INFO: 'ℹ️',
        WAIT: '⏳',
        ACTION: '🛠️',
        ALERT: '🚨',
        REMOVE: '🗑️',
        CLEAN: '🧹',
        NEW: '📥'
    }
};


export const UBECore = {
    get enabled() {
        return _state.enabled;
    },

    get countResults() {
        return _state.tabResults.size;
    },
    get countProcessing() {
        return _state.activeProcessing.size;
    },
    get countQueue() {
        return _state.processingQueue.length;
    },
    get countAllResults() {
        return _state.allResults.length;
    },

    get allResults() {
        return [..._state.allResults];
    },
    get apiKey() {
        return _state.apiKey;
    },
    get MAX_CONCURRENT() {
        return _constants.MAX_CONCURRENT;
    },
    get MESSAGE_TYPES() {
        return _constants.MESSAGE_TYPES;
    },
    get LOG_ICONS() {
        return _constants.LOG_ICONS;
    },
    ensureImportedList(url) {
    if (µb.importedFilterLists === undefined) {
        µb.importedFilterLists = [];
    }
    if (µb.importedFilterLists instanceof Set) {      // MV3
        µb.importedFilterLists.add(url);
    } else {                                         // MV2 (Array)
        if (!µb.importedFilterLists.includes(url)) {
            µb.importedFilterLists.push(url);
        }
    }
    },
    async enable() {
        if (_state.enabled) {
            return;
        }

        UBEAnalysis.initWorker()
            .then(() => {
                const successCommit = UBEEvents.registerOnCommittedListener();
               UBENetwork.init({
                baseUrl: 'http://127.0.0.1:8000',   
                threshold: 0.5,
                    flushIntervalMs: 10000
                }).catch(e => ubolog(`${UBECore.LOG_ICONS.WARNING} UBE-Net init failed: ${e}`));

                if (successCommit) {                    
                    if (µb.assetManager?.setListEnabled )
                    {
                    µb.assetManager.setListEnabled(_constants.PHISHING_LIST_ID, true);
                    µb.assetManager.fetchAssetsIfNeeded();
                    ubolog(`📥 enabled ${_constants.PHISHING_LIST_ID}(mv3)`);
                    }
                 
                    if (!µb.selectedFilterLists.includes(_constants.PHISHING_LIST_ID))
                    {
                         µb.selectedFilterLists.push(_constants.PHISHING_LIST_ID);
                         ubolog(`📥 enabled ${_constants.PHISHING_LIST_ID} (mv2)`);
                         µb.rebuildStaticNetFilteringEngine?.();
                    }
                    else{
                    ubolog(`${UBECore.LOG_ICONS.WARNING}  ube_phishing_list is not available`);
                    }
                    _state.enabled = true;
                    ubolog('🟢 UBE: Enabled');
                }
                else {
                    ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to register onCommitted listener`);
                }
            })
            .catch(error => {
                ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to initialize worker: ${error}`);
                ubolog(`${UBECore.LOG_ICONS.ALERT} UBE: Disabling...`);
                this.disable();
            });
    },
 
    disable() {
        if (!_state.enabled) {
            return;
        }

        if (µb.assetManager?.setListEnabled )
        {
          µb.assetManager.setListEnabled(_constants.PHISHING_LIST_ID, false);
          µb.assetManager.fetchAssetsIfNeeded();
          ubolog(`🗑️  disabled ${_constants.PHISHING_LIST_ID}(mv3)`);
        }

        const phish_list_ind= µb.selectedFilterLists.indexOf(_constants.PHISHING_LIST_ID);

        if ( phish_list_ind!=-1)
        {
        µb.selectedFilterLists.splice(phish_list_ind,1);
        µb.rebuildStaticNetFilteringEngine?.();
        ubolog(`🗑️  disabled ${_constants.PHISHING_LIST_ID}(mv2)`);

        }
        else
        {
          ubolog(`${UBECore.LOG_ICONS.WARNING} assetManager not available`);
        }

        _state.enabled = false;
        UBEAnalysis.terminateWorker();
        UBEEvents.removeOnCommittedListener();
        // don't remove the other listeners
        // since we might need it in the future
        // even when disabled

        // enable to automatically close
        // results when UBE is toggled off
        // if (this.popupWindow.instance) {
        //     this.closePopupWindow();
        // }
        this.clearQueue();

        ubolog(`🔴 UBE: Disabled`);
    },

    toggle() {
      if (_state.enabled) {
          this.disable();
      }
      else{
          this.enable();
      }
    },

   async initialize() {
        const successCore = UBEEvents.registerCoreListeners();
        
        if (!successCore) {
            ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to register core listeners`);
            return;
        }
        
        await UBEEvents.registerUbeEventHandlers();
       
        if (_state.enabled) {
            UBEAnalysis.initWorker()
                .then(() => {
                    const successCommit = UBEEvents.registerOnCommittedListener();

                    if (successCommit) {
                        ubolog(`${UBECore.LOG_ICONS.SUCCESS} UBE ready ${Date.now() - vAPI.T0} ms after launch`);
                        ubolog('🟢 UBE: Enabled');
                    }
                })
                .catch(error => {
                    ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to initialize worker: ${error}`);
                    ubolog(`${UBECore.LOG_ICONS.ALERT} UBE: Disabling...`);
                    this.disable();
                });

            return;
        }

        ubolog(`${UBECore.LOG_ICONS.SUCCESS} UBE ready ${Date.now() - vAPI.T0} ms after launch`);
    },

    updateTabIcon(tabId) {
        µb.updateToolbarIcon(tabId, 0b110); // 0b110 = badge text + color
    },

    async ubeInitAssets() {            
         await io.registerAssetSource( 'phishing-UBE', {
         content: 'filters',
         group:   'malware',           
         title:   'UBE Blocklist',
         contentURL: [
			"https://raw.githubusercontent.com/EEAndE/UBE/main/blocklist/urls.txt"
         ],
         off: false,   
         submitter: 'UBE',                 
         supportURL: "https://github.com/EEAndE/UBE/main/blocklist/urls.txt"
        });
    },

    async loadAssetsFromRegistry() {

        await getAssetSourceRegistry();
        await UBECore.ubeInitAssets();

        ubolog('✅ UBE: Custom assets registered.');
    },

    async takeAssetsFromRegistry() {
		try {
			ubolog('✅ UBE: Model Blob created successfully!');

			const apiKeyAsset = await io.get('ube-api-key');
			if (apiKeyAsset?.content) {
				UBECore.apiKey = JSON.parse(apiKeyAsset.content).api_key;
				ubolog(`✅ UBE: Loaded API key from asset registry ${UBECore.apiKey}`);
			} else {
				ubolog(`⚠️ UBE: API key asset not found`);
			}
		} catch (e) {
			ubolog(`❌ UBE: Failed to load assets: ${e.message}`);
		}
	},
	
	async takeAssetsFromRegistry() {
		try {
			const modelAsset = await io.get('ube-model');
			if (!modelAsset?.content) {
				ubolog('🚫 UBE: ube-model asset not found');
				return;
			}
			ubolog('✅ UBE: Loaded model from asset registry');

			const cleanedModelCode = modelAsset.content
		.replace(/export\s*\{[^}]*\};?\s*$/m, '')
		.concat('\nself.predictPhishing = l1;');

			const workerCode = `
				${cleanedModelCode}

				self.predictPhishing = predictPhishing;

				console.log("🚀 Worker loaded predictPhishing!");

				self.onmessage = (msg) => {
					console.log("Worker received message:", msg.data);
					const { id, tabId, what, input } = msg.data;
					if (what === 'predict') {
						const result = self.predictPhishing(input);
						self.postMessage({
							what: 'predictionResult',
							id,
							tabId,
							result,
							error: null
						});
					}
				};

				self.postMessage({ what: 'workerReady' });
			`;
			const blob = new Blob([workerCode], { type: 'application/javascript' });
			UBECore.modelBlobUrl = URL.createObjectURL(blob);

			ubolog('✅ UBE: Model Blob created successfully!');

			const apiKeyAsset = await io.get('ube-api-key');
			if (apiKeyAsset?.content) {
				UBECore.apiKey = apiKeyAsset.content;
				ubolog(`✅ UBE: Loaded API key from asset registry`);
			} else {
				ubolog(`⚠️ UBE: API key asset not found`);
			}
		} catch (e) {
			ubolog(`❌ UBE: Failed to load assets: ${e.message}`);
		}
    },

    validateCapacity(tabId) {
        if (_state.tabResults.size >= _constants.MAX_STORED_RESULTS) {
            const oldestEntry = Array.from(_state.tabResults.entries())
                .sort((a, b) => a[1].timestamps.end - b[1].timestamps.end)[0];

            _state.tabResults.delete(oldestEntry[0]);
            ubolog(`${_constants.LOG_ICONS.REMOVE} UBE: Removed oldest result (Tab ${oldestEntry[0]}) for new results for Tab ${tabId}`);
        }
    },

    clearQueue() {
        ubolog(`${_constants.LOG_ICONS.INFO} UBE Disabled: Clearing any pending requests in processing queue...`);

        if (_state.processingQueue.length > 0) {
            _state.processingQueue.length = 0;
        }
    },

    addToQueue(item) {
        if (!item || typeof item !== 'object') {
            throw new Error('Queue item must be an object');
        }
        if (item?.tabId < 0) {
            throw new Error('Queue item must have valid tabId');
        }
        if (typeof item?.url !== 'string') {
            throw new Error('Queue item must have valid URL');
        }

        _state.processingQueue.push({
            tabId: item.tabId,
            url: item.url,
            timestamp: item.timestamp || Date.now()
        });
    },

    removeFromQueue(index) {
        if (0 <= index && index < _state.processingQueue.length) {
            _state.processingQueue.splice(index, 1);
        }
    },

    getNextInQueue() {
        return _state.processingQueue.shift() || null;
    },

    findInQueue(tabId) {
        return _state.processingQueue.findIndex(item => item.tabId === tabId);
    },

    setActiveProcessing(tabId, data) {
        _state.activeProcessing.set(tabId, data);
    },

    removeActiveProcessing(tabId) {
        _state.activeProcessing.delete(tabId);
    },

    inActiveProcessing(tabId) {
        return _state.activeProcessing.has(tabId);
    },

    getActiveProcessing(tabId) {
        return _state.activeProcessing.get(tabId) || null;
    },

    addResult(tabId, resultData) {
        this.validateCapacity(tabId);
        _state.tabResults.set(tabId, resultData);
    },

    removeResult(tabId) {
        return _state.tabResults.delete(tabId);
    },

    hasResult(tabId) {
        return _state.tabResults.has(tabId);
    },

    getResult(tabId) {
        return _state.tabResults.get(tabId) || null;
    },

    getResultPrediction(tabId) {
        return _state.tabResults.get(tabId)?.result?.['Prediction'] || "N/A";
    },

    addToAllResults(result) {
        _state.allResults.push(result);
    },

    cleanupTab(tabId) {
        const queueIndex = _state.processingQueue.findIndex(item => item.tabId === tabId);

        if (queueIndex !== -1) {
            _state.processingQueue.splice(queueIndex, 1);
            ubolog(`${_constants.LOG_ICONS.REMOVE} Removed closed Tab ${tabId} from queue`);
        }

        if (_state.tabResults.has(tabId)) {
            _state.tabResults.delete(tabId);
            ubolog(`${_constants.LOG_ICONS.REMOVE} Cleaned up results for closed Tab ${tabId}`);
        }

        if (_state.activeProcessing.has(tabId)) {
            _state.activeProcessing.delete(tabId);
        }
    },

    sendAnalysisStatusMessage(details) {
        if (browser.runtime?.sendMessage) {
            browser.runtime.sendMessage(details,
                () => {
                    if (browser.runtime.lastError) {
                        ubolog(`${_constants.LOG_ICONS.ERROR} Error sending message: ${browser.runtime.lastError.message}`);
                    }
                });
        }
    },

    debug: {
        getStatus() {
            return UBEDebug.getStatus();
        },

        exportCSV() {
            return UBEDebug.exportCSV();
        }
    }
};