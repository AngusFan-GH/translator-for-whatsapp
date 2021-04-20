import { sendToExtension, postToExtension } from '../../common/scripts/util';
import { MESSAGER_SENDER } from '../../common/modal/';
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

function getAllContacts() {
    return WAPI.getAllContacts()
        .filter(contact => contact.isUser && !contact.isMe)
        .map(contact => {
            delete contact.isMe;
            delete contact.isMyContact;
            delete contact.type;
            contact.id = contact.id._serialized;
            return contact;
        });
}

window.addEventListener(
    "message",
    (e) => {
        const { id, to: target, from: to, title, message } = JSON.parse(e.data);
        if (MESSAGER_SENDER.INJECTSCRIPT !== target) return;
        console.log(MESSAGER_SENDER.INJECTSCRIPT, title, message);
        switch (title) {
            case 'getAllContacts':
                sendToExtension(MESSAGER_SENDER.BACKGROUND, title, getAllContacts());
                break;
            case 'getAllChatIds':
                postToExtension(id, MESSAGER_SENDER.CONTENT, title, WAPI.getAllChatIds());
                break;
            case 'getAllMessageIds':
                getAllMessageIds()
                    .then(data => sendToExtension(MESSAGER_SENDER.BACKGROUND, title, data.flat(Infinity)))
                    .catch(err => console.error(err));
                break;
            case 'getAllUnSendMessages':
                getAllUnSendMessages(message)
                    .then(data => sendToExtension(MESSAGER_SENDER.BACKGROUND, title, data))
                    .catch(err => console.error(err));
                break;
        }
    },
    false
);

WAPI.waitNewMessages(false, messages => {
    Promise.all(messages.map(msg => handleMedia(msg)))
        .then(msgs => sendToExtension(MESSAGER_SENDER.BACKGROUND, 'gotNewMessages', msgs))
        .catch(err => console.error(err));
});



