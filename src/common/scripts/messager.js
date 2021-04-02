
class Messager {
    static send(to, title, message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, e => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(e);
            });
        });
    }

    static sendToTab() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, e => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(e);
            });
        });
    }

    static sendToExtension() {

    }

    static post() {

    }
}