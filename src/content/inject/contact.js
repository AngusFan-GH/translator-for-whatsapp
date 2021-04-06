window.addEventListener(
    "message",
    (e) => {
        const data = JSON.parse(e.data);
        console.log('injectScript', data);
        sendToExtension('background', 'test-response-from-inject', data.message, (e) => {
            console.log('inject', e);
        });
    },
    false
);

function sendToExtension(to, title, message, response) {
    let data = JSON.stringify({ to, title, message });
    chrome.runtime.sendMessage(window.extensionId, data, e => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        response && response(e);
    });
}

