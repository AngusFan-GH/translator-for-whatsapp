import { BROWSER_LANGUAGES_MAP, LANGUAGES } from '../common/scripts/languages';
import TRANSLATOR_MANAGER from './library/translate';
import { initWindow } from './handle-window';
import Storager from '../common/scripts/storage';
import { deepCopy } from '../common/scripts/util';

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

initWindow();

chrome.runtime.onInstalled.addListener(async () => {
    try {
        const result = await Storager.get(null);
        setDefaultSettings(result, DEFAULT_SETTINGS);
        Storager.set(deepCopy(result));
    } catch (err) {
        console.error(err);
    }
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    console.log('onMessageExternal', request, sender, sendResponse);
});

chrome.runtime.onMessage.addListener((request, sender, reponse) => {
    if (request.translateMessage) {
        TRANSLATOR_MANAGER.translate(request.translateMessage).then((result) => reponse(result));
    }
    if (request.translateInput) {
        TRANSLATOR_MANAGER.translate(request.translateInput, true).then((result) => reponse(result));
    }
    if (request.setLanguageSetting) {
        const { from } = request.setLanguageSetting;
        switch (from) {
            case 'message':
                const { text } = request.setLanguageSetting;
                TRANSLATOR_MANAGER.detect(text).then((e) => {
                    e = e === 'zh-CN' ? 'en' : e;
                    TRANSLATOR_MANAGER.updateLanguageSetting({ s2: e });
                });
                break;
            case 'select':
                const { target, language } = request.setLanguageSetting;
                TRANSLATOR_MANAGER.updateLanguageSetting({ [target]: language }).then(() => reponse());
                break;
        }
    }
    if (request.changeDefaultTranslator) {
        TRANSLATOR_MANAGER.updateDefaultTranslator(request.changeDefaultTranslator).then((result) => reponse(result));
    }
    if (request.getSupportLanguage) {
        TRANSLATOR_MANAGER.getSupportLanguage().then((result) => reponse(result));
    }
    if (request.setFriendList) {
        request.setFriendList.reduce((textList, firend) => {
            if (textList[escape(firend.replace(' ', ''))]) return;
            textList[escape(firend.replace(' ', ''))] = {
                tText: '',
                sText: '',
            };
            return textList;
        }, DEFAULT_SETTINGS.CacheUnsentTextMap);
        Storager.set({ CacheUnsentTextMap: DEFAULT_SETTINGS.CacheUnsentTextMap })
            .then(() => reponse(DEFAULT_SETTINGS.CacheUnsentTextMap))
            .catch(err => console.error(err));
    }
    if (request.setCurrentFriend) {
        DEFAULT_SETTINGS.CurrentFriends = escape(request.setCurrentFriend.replace(' ', ''));
        Storager.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends })
            .then(() => reponse(DEFAULT_SETTINGS.CurrentFriends))
            .catch(err => console.error(err));
    }
    if (request.cacheUnsentText) {
        cacheUnsentText(request.cacheUnsentText, reponse);
    }
    if (request.updateFriendList) {
        updateFriendList(request.updateFriendList, reponse);
    }
    if (request.changeStyles) {
        changeStyles(request.changeStyles);
    }
    return true;
});

async function cacheUnsentText(cacheUnsentText, reponse) {
    try {
        const { CurrentFriends, CacheUnsentTextMap } = await Storager.get(['CurrentFriends', 'CacheUnsentTextMap']);
        CacheUnsentTextMap[CurrentFriends] = cacheUnsentText;
        Storager.set({ CacheUnsentTextMap }, () => reponse(CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
    }
}

async function updateFriendList(updateFriendList, reponse) {
    try {
        const { CacheUnsentTextMap } = await Storager.get('CacheUnsentTextMap');
        const friend = escape(updateFriendList.replace(' ', ''));
        CacheUnsentTextMap[friend] = { tText: '', sText: '' };
        Storager.set({ CacheUnsentTextMap }, () => reponse(CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
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
