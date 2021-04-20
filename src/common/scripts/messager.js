import { MESSAGER_SENDER, URL } from '../modal/';
import { Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { TABID } from '../../background/handle-window';
import { uuid } from './util'

const Sub = new Subject();
chrome.runtime.onMessage.addListener(data => handleSendListener(data));
if (chrome.runtime.onMessageExternal) {
    chrome.runtime.onMessageExternal.addListener(data => handleSendListener(data));
}
function handleSendListener(data) {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
            console.log('addListener', data);
        } catch (err) {
            console.error(err);
        }
    };
    if (data.to == null) return;
    Sub.next(data);
    return true;
}
window.addEventListener('message', (e) => handlePostListener(e), false);
function handlePostListener(event) {
    let { data, origin } = event;
    if (!URL.startsWith(origin) || typeof data === 'object') return;
    data = JSON.parse(data);
    if (data.to == null) return;
    Sub.next(data);
}

const Subs = {};
function handleSender({ from, to, title, message }, handler) {
    if (!Subs[to]) {
        Subs[to] = Sub.pipe(filter((_) => _.to === from));
    }
    const id = uuid();
    const data = JSON.stringify({ id, from, to, title, message });
    handler(data);
    return this.receive(to, title)
        .pipe(
            filter(data => data.id === id),
            take(1),
            map(data => data.message)
        );
}
class Messager {
    constructor(from) {
        this.from = from;
    }

    send(to, title, message) {
        return handleSender.call(this, { from: this.from, to, title, message }, (data) => chrome.runtime.sendMessage(data));
    }

    sendToTab(title, message) {
        return handleSender.call(this, { from: this.from, to: MESSAGER_SENDER.CONTENT, title, message }, (data) => chrome.tabs.sendMessage(TABID, data));
    }

    sendToExtension(to, title, message) {
        return handleSender.call(this, { from: this.from, to, title, message }, (data) => chrome.runtime.sendMessage(window.extensionId, data));
    }

    post(to, title, message, targetOrigin = URL) {
        return handleSender.call(this, { from: this.from, to, title, message }, (data) => window.postMessage(data, targetOrigin));
    }

    receive(sender, title) {
        if (!Subs[sender]) {
            Subs[sender] = Sub.pipe(filter(data => data.from === sender));
        }
        return title ?
            Subs[sender].pipe(filter(data => data.title === title)) :
            Subs[sender];
    }

    replay(id) {
        const from = this.from;
        return {
            send(to, title, message) {
                const data = JSON.stringify({ id, from, to, title, message });
                chrome.runtime.sendMessage(data);
            },
            sendToTab(title, message) {
                const data = JSON.stringify({ id, from, to: MESSAGER_SENDER.CONTENT, title, message });
                chrome.tabs.sendMessage(TABID, data);
            },
            sendToExtension(to, title, message) {
                const data = JSON.stringify({ id, from, to: MESSAGER_SENDER.CONTENT, title, message });
                chrome.runtime.sendMessage(window.extensionId, data);
            },
            post(to, title, message, targetOrigin = URL) {
                const data = JSON.stringify({ id, from, to, title, message });
                window.postMessage(data, targetOrigin);
            }
        }
    }
}

export default Messager;
