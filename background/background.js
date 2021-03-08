let HOST = "web.whatsapp.com",
    HREF = "https://".concat(HOST, "/"),
    ISINSTALLED = false,
    WINDOWID = 0;

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if ("install" !== reason) return;
    handleInstalled();
});

chrome.browserAction.onClicked.addListener(function (t) {
    handleInstalled();
});

chrome.windows.onRemoved.addListener((tabId) => {
    if (WINDOWID !== tabId) {
        return;
    }
    ISINSTALLED = false;
    chrome.browserAction.setIcon({
        path: {
            19: "icons/19_off.png",
            38: "icons/38_off.png"
        }
    });
    chrome.browserAction.setBadgeText({
        text: ""
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(tabId, changeInfo, tab);
    if (validUrl(changeInfo.url) && tab.windowId !== WINDOWID) {
        console.log(123);
        if (ISINSTALLED) {
            chrome.tabs.remove(tabId);
            focuseWindow();
        } else {
            handleInstalled();
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, reponse) => {
    if (request.translateIt) {
        console.log(request.translateIt);
        setTimeout(() => {
            reponse('翻译后：' + request.translateIt);
        }, 1000);
        return true;
    }
});

function validUrl(_url) {
    return void 0 !== _url && _url.indexOf(HREF) > -1;
}

function handleInstalled() {
    ISINSTALLED ? focuseWindow() : openWindows();
}

function setDefaultOptions() {
    chrome.storage.sync.set({
        isOpenedPanel: false,
        source: 1,
        rule: 1,
    });
}

function openWindows() {
    chrome.tabs.query(
        {
            url: "".concat(HREF, "*")
        },
        (tabs) => {
            const tabIds = tabs.map((t) => t.id);
            chrome.tabs.remove(tabIds, createWindow);
        }
    );
}

function createWindow() {
    const heigth = 1396,
        width = 931,
        position = {
            left: screen.availLeft + screen.availWidth / 2 - heigth / 2,
            top: screen.availTop + screen.availHeight / 2 - width / 2
        };
    chrome.windows.create({
        url: HREF,
        focused: true,
        left: Math.floor(position.left),
        top: Math.floor(position.top),
        width: heigth,
        height: width,
        type: "panel"
    }, ({ id }) => {
        ISINSTALLED = true;
        WINDOWID = id;
        chrome.browserAction.setIcon({
            path: {
                19: "icons/19.png",
                38: "icons/38.png"
            }
        });
        setDefaultOptions();
    });
}

function focuseWindow() {
    chrome.windows.update(WINDOWID, {
        focused: true
    });
}