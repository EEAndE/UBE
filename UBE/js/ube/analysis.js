import {ubolog} from '../console.js';
import {UBEContentScript} from './content-script.js';
import {UBECore} from './core.js';
import {processURL} from './Bundled_UBE_Stage1.js';


const TIMEOUT = 3000;
const modelWorker = {
    instance: null,
    ready: null,
    pending: new Map(),
};

const _sendToWorker = (tabId, data) => {
    // generates a new UUID
    //
    const id = crypto.randomUUID();
    // resolves through worker's onmessage via the appropriate id
    return new Promise((resolve, reject) => {
        modelWorker.pending.set(id, {resolve, reject});
        modelWorker.instance.postMessage({what: 'predict', tabId: tabId, id: id, input: data})

        setTimeout(() => {
            if (modelWorker.pending.has(id)) {
                modelWorker.pending.delete(id);
                reject(new Error('Worker timeout'));
            }
        }, TIMEOUT);
    });
};

const _getStageResults = async (tabId, url, fn, stage) => {
    try {
        // await result via passed function (fn) argument
        const result = await fn(tabId, url);

        ubolog(`${UBECore.LOG_ICONS.ADVANCED} UBE: (Stage ${stage}) Finished for Tab ${tabId}`);

        return result ?? {};
    } catch (error) {
        throw new Error(`(Stage ${stage}) Failed to process Tab ${tabId}: ${error}`, {cause: error});
    }
};

const _isEmptyResults = (tabId, stage, results) => {
    if (Object.keys(results).length === 0) {
        ubolog(`${UBECore.LOG_ICONS.WARNING} UBE: (Stage ${stage}) Empty result received for Tab ${tabId}`);
        return true;
    }

    return false;
}

export const UBEAnalysis = {
    async initWorker() {
        if (modelWorker.instance) {
            return;
        }

        // create a new worker instance
        // add an onmessage handler for requests
        return new Promise((resolve, reject) => {
            modelWorker.instance = new Worker(
                vAPI.getURL('/js/ube/model_worker.js'),
                {type: 'module'});
            // onmessage handler
            modelWorker.instance.onmessage = (msg) => {
                const data = msg.data;

                if (!data) {
                    reject(new Error('No data in worker message'));
                    return;
                }

                // web worker ready message
                if (data.what === 'workerReady') {
                    modelWorker.ready = true;
                    resolve();
                    ubolog(`${UBECore.LOG_ICONS.ADVANCED} UBE: Worker initialized`);
                    return;
                }

                if (!modelWorker.ready) {
                    reject(new Error(`Unexpected message during initialization: ${data.what || 'Unknown'}`));
                    return;
                }

                const {id, tabId, result, error} = msg.data;
                const pending = modelWorker.pending.get(id);

                // handle pending result
                if (pending) {
                    modelWorker.pending.delete(id);

                    if (data.what === 'predictionResult') {
                        pending.resolve(result);
                        ubolog(`${UBECore.LOG_ICONS.ADVANCED} UBE: Received prediction result for Tab ${tabId}`);
                    } else if (data.what === 'error') {
                        pending.reject(new Error(error || "Unknown error in worker"));
                    } else {
                        pending.reject(new Error("Invalid message 'what' from worker"));
                    }
                }
            }

            modelWorker.instance.onerror = (error) => {
                ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Web worker error: ${error}`);
                reject(error);
            };
        });
    },

    terminateWorker() {
        if (modelWorker.instance) {
            modelWorker.ready = false;
            modelWorker.instance.terminate();
            modelWorker.instance = null;
        }

        modelWorker.pending.clear();
        ubolog(`${UBECore.LOG_ICONS.SUCCESS} UBE: Terminated worker`);
    },

    async getFirstAndSecondStagesResults(tabId, url) {
        const fn = (_tabId, _url) => processURL(_url);

        ubolog(`${UBECore.LOG_ICONS.WAIT} UBE: (Stage 1) Started for Tab ${tabId}`);

        return _getStageResults(tabId, url, fn, 1);
    },

    async getThirdStageResults(tabId, url) {
        await UBEContentScript.injectContentScript(tabId);

        const fn = (_tabId, _url) => UBEContentScript.triggerContentScriptCheck(_tabId, _url);

        return _getStageResults(tabId, url, fn, 3);
    },

    async predict(tabId, combinedResults) {
        // send a request to worker to predict
        // validate response and return results
        try {
            const prediction = await _sendToWorker(tabId, combinedResults);
            const validation = prediction.validation;

            if (!validation.isValid) {
                ubolog(`${UBECore.LOG_ICONS.WARNING} UBE: Received [${validation.present.length}/${validation.required}] features`);
                ubolog(`${UBECore.LOG_ICONS.WARNING} UBE: Missing required features: ${validation.missing}`);
                return 'N/A';
            }

            ubolog(`${UBECore.LOG_ICONS.INFO} UBE: Model result data output: `, {
                label: prediction.label,
                probabilities: prediction.probabilities,
                isPhishing: prediction.isPhishing,
                presentFeatures: prediction.validation.features
            });

            return prediction.label;
        } catch (error) {
            ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Model error: ${error}`);
            return 'N/A';
        }
    },

    async processAllStages(tabId, url) {
        // awaits all stages and prediction
        // constructs and returns a result dictionary
        const [firstAndSecondStagesResult, thirdStageResult] = await Promise.all([
            this.getFirstAndSecondStagesResults(tabId, url),
            this.getThirdStageResults(tabId, url)
        ]);

        if (_isEmptyResults(tabId, 1, firstAndSecondStagesResult) ||
            _isEmptyResults(tabId, 3, thirdStageResult)) {
            return {};
        }

        const finalResults = {...firstAndSecondStagesResult, ...thirdStageResult};

        finalResults['Prediction'] = await this.predict(tabId, finalResults);

        return finalResults;
    }
};