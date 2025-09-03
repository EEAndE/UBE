import {ubolog} from '../console.js';
import {UBECore} from './core.js';

const _state = {
    instance: null,
    listeners: {
        boundOnPopupWindowClosed: null,
        boundOnTabChanged: null,
        boundOnTabUpdated: null,
    },
    open: false
};

export const UBEPopup = {
    isOpen() {
        return _state.open;
    },

    getInstance() {
        return {..._state.instance};
    },

    async openPopupWindow(tabId, hostname) {
        try {
            if (_state.instance) {
                await this.closePopupWindow();
            }

            if (!vAPI.windows && !browser.windows) {
                ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Windows API not available`);
                return;
            }

            const currentWindow = await vAPI.windows.get(browser.windows.WINDOW_ID_CURRENT);
            const popupWidth = 365;
            const popupHeight = 500;
            const toolbarHeight = 80;
            const rightMargin = 5;

            let left, top;

            if (currentWindow) {
                left = currentWindow.left + currentWindow.width - popupWidth - rightMargin;
                top = currentWindow.top + toolbarHeight;
            }

            const createOptions = {
                url: vAPI.getURL(`/js/ube/popupWindow.html?tabId=${tabId}&hostname=${encodeURIComponent(hostname)}`),
                type: 'popup',
                width: popupWidth,
                height: popupHeight,
                focused: true,
            };

            if (left !== undefined && top !== undefined) {
                createOptions.left = left;
                createOptions.top = top;
            }

            if (vAPI.windows.create) {
                const popupWindow = await vAPI.windows.create(createOptions);

                if (!popupWindow) {
                    ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to create window: popupWindow is null`);
                    return;
                }

                _state.instance = {
                    id: popupWindow.id,
                    tabId: tabId,
                    hostname: hostname
                };

                //ubolog(`${UBECore.LOG_ICONS.INFO} UBE: Popup window opened for tab ${tabId}`);

                this.setupPopupWindowListeners();

                return _state.open = true;
            }
        } catch (error) {
            ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Failed to create popup window: ${error.message}`);

            return _state.open = false;
        }
    },

    async closePopupWindow() {
        if (!_state.instance) {
            return;
        }

        const {id, tabId} = _state.instance;
        _state.instance = null;

        try {
            if (vAPI.windows && vAPI.windows.update) {
                try {
                    await vAPI.windows.update(id, {state: 'minimized'});
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    ubolog(`${UBECore.LOG_ICONS.WARNING} UBE: Could not minimize window: ${error.message}`);
                }
            }

            await browser.windows.remove(id);

            _state.open = false;
            ubolog(`${UBECore.LOG_ICONS.INFO} UBE: Popup window closed for tab ${tabId}`);
        } catch (error) {
            ubolog(`${UBECore.LOG_ICONS.ERROR} UBE: Error closing popup window: ${error.message}`);
        }

        this.removePopupWindowListeners();
    },

    onPopupWindowClosed(windowId) {
        if (_state.instance?.id === windowId) {
            ubolog(`${UBECore.LOG_ICONS.INFO} UBE: Popup window for Tab ${_state.instance.tabId} was closed by user`);

            _state.instance = null;
            _state.open = false;
            this.removePopupWindowListeners();
        }
    },

    onTabChanged(activeInfo) {
        if (_state.instance?.tabId !== activeInfo.tabId) {
            const currentTabId = _state.instance?.tabId;

            if (currentTabId) {
                this.closePopupWindow().then(() => {
                    ubolog(`${UBECore.LOG_ICONS.INFO} UBE Debug: Closed popup due to tab change ${currentTabId} => ${activeInfo.tabId}`);
                });
            }
        }
    },

    onTabUpdated(tabId, changeInfo, tabInfo) {
        if (_state.instance?.tabId === tabId && changeInfo.url) {
            this.closePopupWindow().then(() => {
                ubolog(`${UBECore.LOG_ICONS.INFO} UBE Debug: Closed popup due to navigation in Tab ${tabId} to ${changeInfo.url}`);
            });
        }
    },

    setupPopupWindowListeners() {
        if (!_state.listeners.boundOnPopupWindowClosed) {
            _state.listeners.boundOnPopupWindowClosed = this.onPopupWindowClosed.bind(this);
            _state.listeners.boundOnTabChanged = this.onTabChanged.bind(this);
            _state.listeners.boundOnTabUpdated = this.onTabUpdated.bind(this);
        }

        if (!browser.windows.onRemoved.hasListener(_state.listeners.boundOnPopupWindowClosed)) {
            browser.windows.onRemoved.addListener(_state.listeners.boundOnPopupWindowClosed);
        }

        if (!browser.tabs.onActivated.hasListener(_state.listeners.boundOnTabChanged)) {
            browser.tabs.onActivated.addListener(_state.listeners.boundOnTabChanged);
        }

        if (!browser.tabs.onUpdated.hasListener(_state.listeners.boundOnTabUpdated)) {
            browser.tabs.onUpdated.addListener(_state.listeners.boundOnTabUpdated);
        }
    },

    removePopupWindowListeners() {
        if (_state.listeners.boundOnPopupWindowClosed) {
            browser.windows.onRemoved.removeListener(_state.listeners.boundOnPopupWindowClosed);
            browser.tabs.onActivated.removeListener(_state.listeners.boundOnTabChanged);
            browser.tabs.onUpdated.removeListener(_state.listeners.boundOnTabUpdated);

            _state.listeners.boundOnPopupWindowClosed = null;
            _state.listeners.boundOnTabChanged = null;
            _state.listeners.boundOnTabUpdated = null;
        }
    }
};