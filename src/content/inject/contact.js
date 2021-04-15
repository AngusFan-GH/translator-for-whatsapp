import { sendToExtension, postToExtension } from '../../common/scripts/util';

function getAllMessages() {
    const chatIds = WAPI.getAllChatIds();
    const promiseList = chatIds.map(chatId => new Promise((resolve, reject) => {
        WAPI.loadAllEarlierMessages(chatId, () => {
            const message = WAPI.getAllMessagesInChat(chatId, true)
                .map(async msg => {
                    try {
                        switch (msg.type) {
                            case 'image':
                            case 'video':
                            case 'ptt':
                            case 'document':
                                msg.mediaFile = await WAPI.getMediaFileByMessageId(msg.id);
                                console.log('file', msg);
                                break;
                        }
                        return msg;
                    } catch (err) {
                        reject(err);
                    }
                });
            Promise.all(message)
                .then(e => resolve(e))
                .catch(err => reject(err));
        });
    }));
    return Promise.all(promiseList);
}

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
            case 'getAllMessages':
                getAllMessages().then((data) => sendToExtension('background', message.responseTitle, data))
                    .catch(err => console.error(err));
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



