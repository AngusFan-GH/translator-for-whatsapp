import { BROWSER_LANGUAGES_MAP } from '../common/modal/languages';
import TRANSLATOR_MANAGER from './translate/translate';
import { initWindow, TABID } from './handle-window';
import Storager from '../common/scripts/storage';
import { deepCopy } from '../common/scripts/util';
import Messager from '../common/scripts/messager';

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
listener('translateMessage').subscribe(({ data, response }) => TRANSLATOR_MANAGER.translate(data).then((result) => response(result)));
listener('translateInput').subscribe(({ data, response }) => TRANSLATOR_MANAGER.translate(data, true).then((result) => response(result)));
listener('changeDefaultTranslator').subscribe(({ data, response }) => TRANSLATOR_MANAGER.updateDefaultTranslator(data).then((result) => response(result)));
listener('getSupportLanguage').subscribe(({ response }) => TRANSLATOR_MANAGER.getSupportLanguage().then((result) => response(result)));
listener('updateFriendList').subscribe(({ data, response }) => updateFriendList(data, response));
async function updateFriendList(updateFriendList, response) {
    try {
        const { CacheUnsentTextMap } = await Storager.get('CacheUnsentTextMap');
        const friend = escape(updateFriendList.replace(' ', ''));
        CacheUnsentTextMap[friend] = { tText: '', sText: '' };
        Storager.set({ CacheUnsentTextMap }, () => response(CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
    }
}
listener('setFriendList').subscribe(({ data, response }) => {
    data.reduce((textList, firend) => {
        if (textList[escape(firend.replace(' ', ''))]) return;
        textList[escape(firend.replace(' ', ''))] = {
            tText: '',
            sText: '',
        };
        return textList;
    }, DEFAULT_SETTINGS.CacheUnsentTextMap);
    Storager.set({ CacheUnsentTextMap: DEFAULT_SETTINGS.CacheUnsentTextMap })
        .then(() => response(DEFAULT_SETTINGS.CacheUnsentTextMap))
        .catch(err => console.error(err));
});
listener('cacheUnsentText').subscribe(({ data, response }) => cacheUnsentText(data, response));
async function cacheUnsentText(cacheUnsentText, response) {
    try {
        const { CurrentFriends, CacheUnsentTextMap } = await Storager.get(['CurrentFriends', 'CacheUnsentTextMap']);
        CacheUnsentTextMap[CurrentFriends] = cacheUnsentText;
        Storager.set({ CacheUnsentTextMap }, () => response(CacheUnsentTextMap));
    } catch (err) {
        console.error(err);
    }
}

listener('setCurrentFriend').subscribe(({ data, response }) => {
    DEFAULT_SETTINGS.CurrentFriends = escape(data.replace(' ', ''));
    Storager.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends })
        .then(() => response(DEFAULT_SETTINGS.CurrentFriends))
        .catch(err => console.error(err));
});
listener('test-response-from-inject').subscribe(({ data, response }) => {
    console.log('onMessageExternal', data, response);
    response('got it!');
});
