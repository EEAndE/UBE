import {predictPhishing} from './model.js';

self.onmessage = (msg) => {
    const {id, tabId, what, input} = msg.data;

    try {
        switch (what) {
            case 'predict':
                const result = predictPhishing(input);
                self.postMessage({what: 'predictionResult', id: id, tabId: tabId, result: result, error: null});
                break;
        }
    } catch (error) {
        self.postMessage({what: 'error', id: id, tabId: tabId, result: null, error: error.message});
    }
};

self.postMessage({what: 'workerReady'});