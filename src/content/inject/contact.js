import { sendToExtension, postToExtension } from '../../common/scripts/util';

window.addEventListener(
    "message",
    (e) => {
        const { to, title, message } = JSON.parse(e.data);
        if ('injectScript' !== to) return;
        console.log('injectScript', message);
        // sendToExtension('background', 'test-response-from-inject', data.message, (e) => {
        //     console.log('inject', e);
        // });
        switch (title) {
            case 'getAllChatIds':
                postToExtension('content', message.responseTitle, window.WAPI.getAllChatIds());
                break;
        }
    },
    false
);



