import { URL } from '../modal/';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TABID } from '../../background/handle-window';

const Sub = new Subject();
chrome.runtime.onMessage.addListener((data, sender, response) => handleSendListener(data, response));
if (chrome.runtime.onMessageExternal) {
    chrome.runtime.onMessageExternal.addListener((data, sender, response) => handleSendListener(data, response));
}
function handleSendListener(data, response) {
    console.log('addListener', data);
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (err) {
            console.error(err);
        }
    };
    if (data.to == null) return;
    Sub.next({ data, response });
    return true;
}
window.addEventListener('message', (e) => handlePostListener(e), false);
function handlePostListener(event) {
    let { data, origin } = event;
    if (!URL.startsWith(origin) || typeof data === 'object') return;
    data = JSON.parse(data);
    if (data.to == null) return;
    Sub.next({ data });
}

const Subs = {};
function handleSender({ to, title, message }, handler) {
    if (!Subs[to]) {
        Subs[to] = Sub.pipe(filter((_) => _.to === to));
    }
    return new Promise((resolve, reject) => {
        let data = JSON.stringify({ to, title, message });
        handler({ data, resolve, reject });
    });
}

class Messager {
    static send(to, title, message) {
        return handleSender({ to, title, message }, ({ data, resolve, reject }) => {
            chrome.runtime.sendMessage(data, e => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(e);
            });
        });
    }

    static sendToTab(to, title, message) {
        return handleSender({ to, title, message }, ({ data, resolve, reject }) => {
            chrome.tabs.sendMessage(TABID, data, e => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(e);
            });
        });
    }

    static sendToExtension(to, title, message) {
        return handleSender({ to, title, message }, ({ data, resolve, reject }) => {
            chrome.runtime.sendMessage(window.extensionId, data, e => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(e);
            });
        });
    }

    static post(to, title, message, targetOrigin = URL) {
        if (!Subs[to]) {
            Subs[to] = Sub.pipe(filter((_) => _.to === to));
        }
        let data = JSON.stringify({ to, title, message });
        return window.postMessage(data, targetOrigin);
    }

    static receive(receiver, key) {
        if (!Subs[receiver]) {
            Subs[receiver] = Sub.pipe(filter(({ data }) => data.to === receiver));
        }
        return key ?
            Subs[receiver].pipe(
                filter(({ data }) => data.title === key),
                map(({ data, response }) => ({ data: data.message, response }))
            ) :
            Subs[receiver].pipe(map(({ data, response }) => ({ data: data.message, response })));
    }
}

export default Messager;
