import { sendToExtension, postToExtension } from '../../common/scripts/util';

function getAllMessages(done) {
    const chatMap = {};
    const chatIds = WAPI.getAllChatIds();
    let count = 0;
    chatIds.forEach((chatId) => {
        WAPI.loadAllEarlierMessages(chatId, () => {
            if (chatMap[chatId]) return;
            const msg = WAPI.getAllMessagesInChat(chatId, true).filter(msg => msg.type === 'chat');
            chatMap[chatId] = msg;
            if (count++ === chatIds.length - 1) {
                done(Object.values(chatMap));
            }
        });
    });
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
                getAllMessages((data) => {
                    sendToExtension('background', message.responseTitle, data);
                });
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



