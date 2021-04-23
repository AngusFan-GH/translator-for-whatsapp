import { sendToExtension, postToExtension } from '../../common/scripts/util';
import { MESSAGER_SENDER, BASE64_IMAGE_HEADER } from '../../common/modal/';

function getAllMessageIds() {
    const chatIds = WAPI.getAllChatIds();
    const promiseList = chatIds.map(chatId => new Promise((resolve) => {
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

function getContactInfos(ids) {
    const contacts = !ids ? WAPI.getAllContacts() : ids.map(id => WAPI.getContact(id));
    return Promise.all(contacts.map(async (info) => {
        info.avatar = await getBase64Avatar(info.id);
        return info;
    }));
}

function getBase64Avatar(contactId) {
    return new Promise((resolve) => WAPI.getProfilePicFromId(contactId, e => {
        const avatar = e ? BASE64_IMAGE_HEADER + e : null;
        resolve(avatar);
    }));
}

window.addEventListener(
    "message",
    (e) => {
        const { id, to: target, from: to, title, message } = JSON.parse(e.data);
        if (MESSAGER_SENDER.INJECTSCRIPT !== target) return;
        console.log(MESSAGER_SENDER.INJECTSCRIPT, title, message);
        switch (title) {
            case 'getMe':
                getContactInfos([WAPI.getMe().id])
                    .then(contacts => sendToExtension(MESSAGER_SENDER.BACKGROUND, title, contacts[0]))
                    .catch(err => console.error(err));
                break;
            case 'getAllContacts':
                getContactInfos()
                    .then(contacts => sendToExtension(MESSAGER_SENDER.BACKGROUND, title, contacts))
                    .catch(err => console.error(err));
                break;
            case 'getContactInfos':
                getContactInfos(message)
                    .then(contacts => sendToExtension(MESSAGER_SENDER.BACKGROUND, title, contacts))
                    .catch(err => console.error(err));
                break;
            case 'getAllChatIds':
                postToExtension(MESSAGER_SENDER.CONTENT, title, WAPI.getAllChatIds(), id);
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



