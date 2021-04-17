import { sendToExtension, postToExtension } from '../../common/scripts/util';
function getAllMessageIds() {
    const chatIds = WAPI.getAllChatIds();
    const promiseList = chatIds.map(chatId => new Promise((resolve, reject) => {
        WAPI.loadAllEarlierMessages(chatId, () => {
            const msgIds = WAPI.getAllMessageIdsInChat(chatId, true);
            resolve(msgIds);
        });
    }));
    return Promise.all(promiseList);
}
function getAllUnSendMessages(msgIds) {
    const unSendMessages = WAPI.getAllChatIds()
        .reduce((promiseList, chatId) => promiseList.concat(WAPI.getAllMessagesInChat(chatId, true)
            .filter(msg => msgIds.indexOf(msg.id.split('_').pop()) >= 0)
            .map(msg => handleMedia(msg))), []);
    return Promise.all(unSendMessages);
}

async function handleMedia(msg) {
    try {
        switch (msg.type) {
            case 'image':
            case 'video':
            case 'ptt':
            case 'document':
            case 'sticker':
                msg.mediaFile = await WAPI.getMediaFileByMessageId(msg.id);
                break;
        }
        return msg;
    } catch (err) {
        console.error(err);
    }
}

window.addEventListener(
    "message",
    (e) => {
        const { to, title, message } = JSON.parse(e.data);
        if ('injectScript' !== to) return;
        console.log('injectScript', message);
        switch (title) {
            case 'getAllChatIds':
                postToExtension('content', message.responseTitle, WAPI.getAllChatIds());
                break;
            case 'getAllMessageIds':
                getAllMessageIds()
                    .then((data) => sendToExtension('background', message.responseTitle, data.flat(Infinity)))
                    .catch(err => console.error(err));
                break;
            case 'getAllUnSendMessages':
                getAllUnSendMessages(message.data.data)
                    .then((data) => sendToExtension('background', message.responseTitle, data))
                    .catch(err => console.error(err));
                break;
        }
    },
    false
);

WAPI.waitNewMessages(false, messages => {
    Promise.all(messages.map(msg => handleMedia(msg)))
        .then(msgs => sendToExtension('background', 'gotNewMessages', msgs, (e) => {
            console.log('waitNewMessages-callback', e, msgs);
        }))
        .catch(err => console.error(err));
});



