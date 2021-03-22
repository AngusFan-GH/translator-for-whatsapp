const HOST = 'web.whatsapp.com';
const HREF = 'https://'.concat(HOST, '/');
let ISINSTALLED = false;
let WINDOWID = 0;

export default function initWindow() {
    chrome.runtime.onInstalled.addListener(({ reason }) => {
        if (reason !== 'install') return openWindows();
        handleInstalled();
    });

    chrome.browserAction.onClicked.addListener((t) => {
        handleInstalled();
    });

    chrome.windows.onRemoved.addListener((tabId) => {
        if (WINDOWID !== tabId) {
            return;
        }
        ISINSTALLED = false;
        chrome.browserAction.setIcon({
            path: {
                19: 'icons/19_off.png',
                38: 'icons/38_off.png',
            },
        });
        chrome.browserAction.setBadgeText({
            text: '',
        });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (validUrl(changeInfo.url) && tab.windowId !== WINDOWID) {
            if (ISINSTALLED) {
                chrome.tabs.remove(tabId);
                focuseWindow();
            } else {
                handleInstalled();
            }
        }
    });
}

function validUrl(_url) {
    return void 0 !== _url && _url.indexOf(HREF) > -1;
}

function handleInstalled() {
    // ISINSTALLED ? focuseWindow() : openWindows();
    ISINSTALLED ? focuseWindow() : createWindow();
}

function openWindows() {
    chrome.tabs.query(
        {
            url: ''.concat(HREF, '*'),
        },
        (tabs) => {
            const tabIds = tabs.map((t) => t.id);
            chrome.tabs.remove(tabIds, createWindow);
        },
    );
}

function createWindow() {
    const heigth = 1396;
    const width = 931;
    const position = {
        left: screen.availLeft + screen.availWidth / 2 - heigth / 2,
        top: screen.availTop + screen.availHeight / 2 - width / 2,
    };
    chrome.windows.create({
        url: HREF,
        focused: true,
        left: Math.floor(position.left),
        top: Math.floor(position.top),
        width: heigth,
        height: width,
        type: 'panel',
    }, ({ id }) => {
        ISINSTALLED = true;
        WINDOWID = id;
        chrome.browserAction.setIcon({
            path: {
                19: 'icons/19.png',
                38: 'icons/38.png',
            },
        });
    });
}

function focuseWindow() {
    chrome.windows.update(WINDOWID, {
        focused: true,
    });
}