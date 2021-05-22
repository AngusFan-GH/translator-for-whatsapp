import { BROWSER_LANGUAGES_MAP } from '../common/modal/languages';
import TRANSLATOR_MANAGER from './translate/translate';
import { InitWindow } from './handle-window';
import Storager from '../common/scripts/storage';
import { deepCopy, base64ToFile } from '../common/scripts/util';
import Messager from '../common/scripts/messager';
import { MESSAGER_SENDER, CURRENT_ACCOUNT } from '../common/modal/';
import ApiService from '../common/service/api';
const Mime = require('mime-types');

const $Messager = new Messager(MESSAGER_SENDER.BACKGROUND);

let ListenersOpened = false;

const DEFAULT_SETTINGS = {
    LanguageSetting: {
        sl: 'auto',
        tl: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
        s2: 'en',
    },
    DefaultTranslator: 'GoogleTranslate',
    TranslationDisplayMode: 2,
    CurrentFriends: '',
    CacheUnsentTextMap: {},
    OtherSettings: {},
    Styles: {
        lineColor: '#EC1C23',
        textColor: '#00A1E7',
    },
};

chrome.runtime.onInstalled.addListener(async () => {
    try {
        const result = await Storager.get(null);
        setDefaultSettings(result, DEFAULT_SETTINGS);
        Storager.set(deepCopy(result));
    } catch (err) {
        console.error(err);
    }
});

function setDefaultSettings(result, settings) {
    for (let i in settings) {
        if (settings[i] instanceof Object) {
            if (result[i]) {
                setDefaultSettings(result[i], settings[i]);
            } else {
                result[i] = settings[i];
            }
        } else if (result[i] === undefined) {
            result[i] = settings[i];
        }
    }
}

async function changeStyles(changeStyles) {
    try {
        const { target, color } = changeStyles;
        const { Styles } = await Storager.get('Styles');
        switch (target) {
            case 'line':
                Styles.lineColor = color;
                break;
            case 'text':
                Styles.textColor = color;
                break;
        }
        Storager.set({ Styles });
    } catch (err) {
        console.error(err);
    }
}

async function updateFriendList(friendIds) {
    try {
        const { CacheUnsentTextMap } = await Storager.get('CacheUnsentTextMap');
        friendIds.forEach(id => {
            if (id && !CacheUnsentTextMap[id]) {
                CacheUnsentTextMap[id] = { tText: '', sText: '' };
            }
        });
        Storager.set({ CacheUnsentTextMap });
    } catch (err) {
        console.error(err);
    }
}

function updateContactInfo(friendIds) {
    Storager.get('Contacts').then(({ Contacts }) => {
        const newIds = friendIds.filter(id => Contacts.indexOf(id) === -1);
        if (!newIds.length) return;
        $Messager.sendToTab('getContactInfos', newIds);
    });
}

function addAccountInfos(message, customResourceType = 'new') {
    if (!message.length) return;
    const account = window.localStorage.getItem(CURRENT_ACCOUNT);
    formatContactInfos(message)
        .then(accounts => ApiService.addAccountInfoList(accounts.map(info => {
            info.customResourceType = customResourceType;
            info.account = account;
            return info;
        })))
        .catch(err => console.error(err));
}

function formatContactInfos(list, isMe) {
    try {
        const infos = list.filter(contact => contact.isUser && (contact.isMe === !!isMe) && contact.isPSA === false);
        const promiseList = infos.map(async contact => {
            delete contact.isMe;
            delete contact.isMyContact;
            delete contact.type;
            delete contact.profilePicThumbObj;
            contact.phone = '+' + contact.id.split('@')[0];
            contact.avatar = await uploadAvatar(contact.avatar, contact.id);
            return contact;
        });
        return Promise.all(promiseList);
    } catch (err) {
        console.error(err);
    }
}

async function uploadAvatar(avatar, id) {
    try {
        if (!avatar) return null;
        const filename = 'avatar_' + id + '.jpg';
        const file = base64ToFile(avatar, filename);
        console.log(file);
        return await uploadFile(file);
    } catch (err) {
        console.error(err);
    }
}

function addAccountInfoExcludeExists(message) {
    const contactIds = message.map(contact => contact.id);
    ApiService.checkAccount(contactIds)
        .then(({ result }) => {
            const noExistAccountIds = result.noExistAccountIds || [];
            const noExistAccount = message.filter(contact => noExistAccountIds.indexOf(contact.id) >= 0);
            console.log('noExistAccount', noExistAccount);
            addAccountInfos(noExistAccount, 'new');
        })
        .catch(err => console.error(err));
}

async function cacheUnsentText(cacheUnsentText) {
    try {
        const { CurrentFriends, CacheUnsentTextMap } = await Storager.get(['CurrentFriends', 'CacheUnsentTextMap']);
        CacheUnsentTextMap[CurrentFriends] = cacheUnsentText;
        Storager.set({ CacheUnsentTextMap }, () => console.log('cacheUnsentText', CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
    }
}

function startListeners() {
    if (ListenersOpened) return;
    ListenersOpened = true;
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'getMe').subscribe(({ message, title }) => {
        const account = message.id;
        localStorage.setItem(CURRENT_ACCOUNT, account);
        $Messager.sendToTab(title, account);
        formatContactInfos([message], true)
            .then(accounts => ApiService.addSelfAccountInfos(accounts))
            .catch(err => console.error(err));
    });
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'setLanguageSetting').subscribe(({ message, title, id }) => {
        const { from } = message;
        switch (from) {
            case 'message':
                const { text } = message;
                TRANSLATOR_MANAGER.detect(text).then((e) => {
                    e = e === 'zh-CN' ? 'en' : e;
                    TRANSLATOR_MANAGER.updateLanguageSetting({ s2: e });
                });
                break;
            case 'select':
                const { target, language } = message;
                TRANSLATOR_MANAGER.updateLanguageSetting({ [target]: language }).then(() => $Messager.replay(id).sendToTab(title));
                break;
        }
    });
    $Messager.receive(MESSAGER_SENDER.OPTION, 'changeStyles')
        .subscribe(({ message }) => changeStyles(message));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'translateMessage')
        .subscribe(({ message, title, id }) => TRANSLATOR_MANAGER.translate(message)
            .then(result => $Messager.replay(id).sendToTab(title, result)));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'translateInput')
        .subscribe(({ message, title, id }) => TRANSLATOR_MANAGER.translate(message, true)
            .then(result => $Messager.replay(id).sendToTab(title, result)));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'changeDefaultTranslator')
        .subscribe(({ message, title, id }) => TRANSLATOR_MANAGER.updateDefaultTranslator(message)
            .then(result => $Messager.replay(id).sendToTab(title, result)));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'getSupportLanguage')
        .subscribe(({ id, title }) => TRANSLATOR_MANAGER.getSupportLanguage()
            .then(result => $Messager.replay(id).sendToTab(title, result)));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'setFriendList')
        .subscribe(({ message }) => {
            message.reduce((textMap, firend) => {
                if (textMap[firend]) return textMap;
                textMap[firend] = {
                    tText: '',
                    sText: '',
                };
                return textMap;
            }, DEFAULT_SETTINGS.CacheUnsentTextMap);
            Storager.set({ CacheUnsentTextMap: DEFAULT_SETTINGS.CacheUnsentTextMap })
                .then(() => console.log('setFriendList', DEFAULT_SETTINGS.CacheUnsentTextMap))
                .catch(err => console.error(err));
        });
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'cacheUnsentText')
        .subscribe(({ message }) => cacheUnsentText(message));
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'setCurrentFriend')
        .subscribe(({ message, title, id }) => {
            DEFAULT_SETTINGS.CurrentFriends = message;
            Storager.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends })
                .then(() => $Messager.replay(id).sendToTab(title, DEFAULT_SETTINGS.CurrentFriends))
                .catch(err => console.error(err));
            ApiService.getCustomPortraitByAccount({
                customerAccount: message,
                account: localStorage.getItem(CURRENT_ACCOUNT)
            })
                .then(e => $Messager.sendToTab('getCustomPortraitFinish', e?.result))
                .catch(err => console.error(err));
        });
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'gotNewMessages')
        .subscribe(({ message }) => {
            console.log('onMessageExternal', message);
            if (message?.status === -1) return;
            const friendIds = message.map(msg => {
                addNewMessage(msg);
                return msg.chat.id;
            });
            updateFriendList(friendIds);
            updateContactInfo(friendIds);
        });
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'getContactInfos')
        .subscribe(({ message }) => addAccountInfos(message));
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'getAllContacts')
        .subscribe(({ message }) => {
            Storager.set({ Contacts: message.map(info => info.id) });
            addAccountInfos(message, 'old');
        });
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'getAllMessageIds').subscribe(({ message }) => {
        getUnSentMessageIds(message)
            .then(msgIds => $Messager.sendToTab('getAllUnSendMessages', msgIds))
            .catch(err => console.error(err));
    });
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'getAllUnSendMessages').subscribe(({ message }) => {
        return addMessageList(message);
        const msgs = message.map(msg => handleMediaFile2File(msg));
        console.log('getAllUnSendMessages', message);
        const promiseList = msgs.map(msg => ApiService.addMessageInfo(addMessageParamsMaker(msg)));
        Promise.all(promiseList)
            .then(() => console.log('getAllUnSendMessages done'))
            .catch(err => console.error(err));
    });
    $Messager.receive(MESSAGER_SENDER.CONTENT, 'addCustomPortrait').subscribe(({ message, title, id }) => {
        const params = [{ ...message, account: localStorage.getItem(CURRENT_ACCOUNT) }];
        console.log('addCustomPortrait', params);
        ApiService.addCustomPortrait(params)
            .then(e => $Messager.replay(id).sendToTab(title, e))
            .catch(err => $Messager.replay(id).sendToTab(title, err?.data));
    });
}

async function addNewMessage(msg) {
    if (msg.mediaFile) {
        msg.mediaFile = await uploadFile(handleMediaFile2File(msg));
        return ApiService.addMessageInfo(addMessageParamsMaker(msg))
            .catch(err => console.error(err));
    }
    ApiService.addMessageInfo(addMessageParamsMaker(msg))
        .catch(err => console.error(err));
}

async function addMessageList(data) {
    try {
        const account = localStorage.getItem(CURRENT_ACCOUNT);
        let msgs = await Promise.all(data.map(async msg => {
            msg.account = account;
            if (msg.mediaFile) {
                msg.mediaFile = await uploadFile(handleMediaFile2File(msg));
            }
            if (msg.type === 'location') {
                msg.content = JSON.stringify({
                    lat: msg.lat,
                    lng: msg.lng
                });
            }
            return addMessageParamsMaker(msg);
        }));
        msgs = msgs.filter(({ messageContext, messageType }) => messageType !== 'revoked' && messageContext != null && messageContext !== '');
        console.log('unSendMessages', msgs);
        if (!msgs.length) return;
        ApiService.addMessageInfoList(msgs)
            .then(() => console.log('responseGetAllUnSendMessages done'))
            .catch(err => console.error(err));
    } catch (err) {
        console.error(err);
    }
}

function uploadFile(file) {
    return ApiService.uploadFile(file);
}

function getUnSentMessageIds(msgIds) {
    const ids = msgIds.map(id => id.split('_').pop());
    if (!ids.length) return Promise.resolve([]);
    return ApiService.getUnSentMessageIds(ids)
        .then(({ result }) => Promise.resolve(result?.unSendMessageIds))
        .catch(err => console.error(err));
}

function handleMediaFile2File(msg) {
    if (!msg.mediaFile) return null;
    let ext = Mime.extension(msg.mimetype);
    ext = ext === 'oga' ? 'ogg' : ext;
    const filename = msg.filename || `${msg.id.split('_').pop()}.${ext}`;
    return base64ToFile(msg.mediaFile, filename);
}

function addMessageParamsMaker(msg) {
    const { id, content, from, to, sender, type, mediaFile, timestamp } = msg;
    const pluginClientContactId = id.split('_').pop();
    return {
        accountType: 'WhatsApp',
        pluginClientContactId,
        messageContext: mediaFile || content,
        messageType: type,
        sendAccount: from,
        sendAccountName: sender.pushname,
        toAccount: to,
        timestamp
    };
}
InitWindow().subscribe(() => startListeners());


