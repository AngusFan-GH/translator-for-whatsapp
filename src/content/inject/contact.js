import { sendToExtension, postToExtension } from '../../common/scripts/util';

window.addEventListener(
    "message",
    (e) => {
        const { to, title, message } = JSON.parse(e.data);
        if ('injectScript' !== to) return;
        console.log('injectScript', message);
        switch (title) {
            case 'getAllChatIds':
                postToExtension('content', message.responseTitle, window.WAPI.getAllChatIds());
                break;
        }
    },
    false
);

WAPI.waitNewMessages(false, msgs => {
    sendToExtension('background', 'gotNewMessages', msgs, (e) => {
        console.log('waitNewMessages-callback', e, msgs);
    });
});



