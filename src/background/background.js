import { BROWSER_LANGUAGES_MAP } from '../common/modal/languages';
import TRANSLATOR_MANAGER from './translate/translate';
import { InitWindow } from './handle-window';
import Storager from '../common/scripts/storage';
import { deepCopy, base64ToFile } from '../common/scripts/util';
import Messager from '../common/scripts/messager';
import { Subject } from 'rxjs';
import { LOGIN_URL, URL, LOCAL_TOKEN_NAME } from '../common/modal/';
import ApiService from '../common/service/api';
const Mime = require('mime-types');


const gotToken$ = new Subject();
const navigateToURL$ = new Subject();
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

function listener(key) {
    return Messager.receive('background', key);
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

async function cacheUnsentText(cacheUnsentText, response) {
    try {
        const { CurrentFriends, CacheUnsentTextMap } = await Storager.get(['CurrentFriends', 'CacheUnsentTextMap']);
        CacheUnsentTextMap[CurrentFriends] = cacheUnsentText;
        Storager.set({ CacheUnsentTextMap }, () => response(CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
    }
}

function startListeners() {
    if (ListenersOpened) return;
    ListenersOpened = true;
    listener('setLanguageSetting').subscribe(({ data, response }) => {
        const { from } = data;
        switch (from) {
            case 'message':
                const { text } = data;
                TRANSLATOR_MANAGER.detect(text).then((e) => {
                    e = e === 'zh-CN' ? 'en' : e;
                    TRANSLATOR_MANAGER.updateLanguageSetting({ s2: e });
                });
                break;
            case 'select':
                const { target, language } = data;
                TRANSLATOR_MANAGER.updateLanguageSetting({ [target]: language }).then(() => response());
                break;
        }
    });
    listener('changeStyles').subscribe(({ data }) => changeStyles(data));
    listener('translateMessage').subscribe(({ data, response }) => TRANSLATOR_MANAGER.translate(data).then((result) => response(result)));
    listener('translateInput').subscribe(({ data, response }) => TRANSLATOR_MANAGER.translate(data, true).then((result) => response(result)));
    listener('changeDefaultTranslator').subscribe(({ data, response }) => TRANSLATOR_MANAGER.updateDefaultTranslator(data).then((result) => response(result)));
    listener('getSupportLanguage').subscribe(({ response }) => TRANSLATOR_MANAGER.getSupportLanguage().then((result) => response(result)));
    listener('setFriendList').subscribe(({ data, response }) => {
        data.reduce((textMap, firend) => {
            if (textMap[firend]) return textMap;
            textMap[firend] = {
                tText: '',
                sText: '',
            };
            return textMap;
        }, DEFAULT_SETTINGS.CacheUnsentTextMap);
        Storager.set({ CacheUnsentTextMap: DEFAULT_SETTINGS.CacheUnsentTextMap })
            .then(() => response(DEFAULT_SETTINGS.CacheUnsentTextMap))
            .catch(err => console.error(err));
    });
    listener('cacheUnsentText').subscribe(({ data, response }) => cacheUnsentText(data, response));
    listener('setCurrentFriend').subscribe(({ data, response }) => {
        DEFAULT_SETTINGS.CurrentFriends = data;
        Storager.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends })
            .then(() => response(DEFAULT_SETTINGS.CurrentFriends))
            .catch(err => console.error(err));
    });
    listener('gotNewMessages').subscribe(({ data, response }) => {
        console.log('onMessageExternal', data);
        if (data?.status === -1) return;
        const friendIds = data.map(({ id, content, from, to, sender, chat }) => {
            ApiService.addContactInfo({
                accountType: 'WhatsApp',
                pluginClientContactId: id,
                messageContext: content,
                messageType: '1',
                sendAccount: from,
                sendAccountName: sender.pushname,
                toAccount: to,
            }).catch(err => console.error(err));
            return chat.id;
        });
        updateFriendList(friendIds);
        response('got it!');
    });
    listener('responseGetAllMessages').subscribe(({ data }) => {
        const msgs = data.flat(Infinity).map(msg => {
            if (!msg.mediaFile) return msg;
            const ext = Mime.extension(msg.mimetype);
            const filename = msg.filename || `${msg.id}.${ext}`;
            msg.mediaFile = base64ToFile(msg.mediaFile, filename);
            return msg;
        });
        console.log('responseGetAllMessages', data);
        const promiseList = msgs.map(({ id, content, from, to, sender }) => ApiService.addContactInfo({
            accountType: 'WhatsApp',
            pluginClientContactId: id,
            messageContext: content,
            messageType: '1',
            sendAccount: from,
            sendAccountName: sender.pushname,
            toAccount: to,
        }));
        Promise.all(promiseList)
            .then(() => console.log('responseGetAllMessages done'))
            .catch(err => console.error(err));
    });
}
InitWindow().subscribe(({ TABID }) => {
    chrome.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
        if (tabId === TABID && status === 'complete' && url.startsWith(LOGIN_URL + 'dashboard/workplace')) {
            Messager.sendToTab('content', 'getAccessToken').then(({ value }) => {
                chrome.tabs.update(TABID, {
                    url: URL
                }, () => {
                    navigateToURL$.next(true);
                    gotToken$.next(value);
                });
            });
        }
    });
});

gotToken$.subscribe(token => {
    console.log('token', token);
    localStorage.setItem(LOCAL_TOKEN_NAME, token);
});

navigateToURL$.subscribe(() => startListeners());


