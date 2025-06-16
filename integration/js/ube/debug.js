import {ubolog} from '../console.js';
import {UBECore} from './core.js';

export const UBEDebug = {
    getStatus() {
        return {
            enabled: UBECore.enabled,
            queueLength: UBECore.countQueue,
            activeProcessing: UBECore.countProcessing,
            activeResults: UBECore.countResults,
            allResultsCount: UBECore.countAllResults
        };
    },

    exportCSV() {
        const headers = [
				HEADERS
        ];

        try {
            const csvRows = [
                headers.join(','),
                ...UBECore.allResults.map(row =>
                    headers.map(h => JSON.stringify(row[h] ?? "N/A")).join(',')
                )
            ];

            const blob = new Blob([csvRows.join('\n')], {type: 'text/csv'});
            const blobUrl = URL.createObjectURL(blob);

            browser.downloads.download({
                url: blobUrl,
                filename: `ube_collected_results_${new Date().toISOString().slice(0, 10)}.csv`,
                saveAs: true
            }, (downloadId) => {
                if (browser.runtime.lastError) {
                    ubolog(`${UBECore.LOG_ICONS.ERROR} Download failed: ${browser.runtime.lastError.message}`);
                } else {
                    ubolog(`${UBECore.LOG_ICONS.SUCCESS} Download started, ID: ${downloadId}`);
                }
            });

            ubolog(`${UBECore.LOG_ICONS.SUCCESS} UBE: CSV export initiated using browser.download`);

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 10000);
        } catch (error) {
            ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: CSV export failed: ${error.message}`);
        }
    }
};