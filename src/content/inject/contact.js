window.addEventListener(
    "message",
    (e) => {
        console.log('injectScript', e);
        chrome.runtime.sendMessage(window.extensionId, {
            extensionId: window.extensionId,
            Store: window.Store
        });
    },
    false
);