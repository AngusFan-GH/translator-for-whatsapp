class Messager {
    static send(to, title, detail) {
        if ('string' === typeof to) {
            to = [to];
        }
        let receivers = {};
        for (let receiver of to) {
            receivers[receiver] = true;
        }

        return new Promise((resolve, reject) => {
            let message = JSON.stringify({ to: receivers, title, detail });
            chrome.runtime.sendMessage(message, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    }
}