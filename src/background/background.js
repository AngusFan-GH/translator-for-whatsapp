import { BROWSER_LANGUAGES_MAP, LANGUAGES } from '../common/scripts/languages.js';
import TRANSLATOR_MANAGER from './library/translate.js';
import initWindow from './handle-window';

const DEFAULT_SETTINGS = {
  languageSetting: {
    sl: 'auto',
    tl: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
    s2: 'en',
    set: Object.keys(LANGUAGES)
  },
  DefaultTranslator: 'GoogleTranslate',
  CurrentFriends: '',
  CacheUnsentTextMap: {},
  OtherSettings: {
    TranslationDisplayMode: 0
  }
}

initWindow();

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get((result) => {
    let buffer = result;
    setDefaultSettings(buffer, DEFAULT_SETTINGS);
    chrome.storage.sync.set(buffer);
  });
});

chrome.runtime.onMessage.addListener((request, sender, reponse) => {
  if (request.translateMessage) {
    TRANSLATOR_MANAGER.translate(request.translateMessage).then(result => reponse(result));
    return true;
  }
  if (request.translateInput) {
    TRANSLATOR_MANAGER.translate(request.translateInput, true).then(result => reponse(result));
    return true;
  }
  if (request.setLanguageSetting) {
    const { from } = request.setLanguageSetting;
    switch (from) {
      case 'message':
        const { text } = request.setLanguageSetting
        TRANSLATOR_MANAGER.detect(text).then(e => {
          e = e === 'zh-CN' ? 'en' : e;
          TRANSLATOR_MANAGER.updateLanguageSetting({ s2: e });
        });
        break;
      case 'select':
        const { target, language } = request.setLanguageSetting;
        TRANSLATOR_MANAGER.updateLanguageSetting({ [target]: language }).then(() => reponse());
        break;
    }
    return true;
  }
  if (request.changeDefaultTranslator) {
    TRANSLATOR_MANAGER.updateDefaultTranslator(request.changeDefaultTranslator).then(result => reponse(result));
    return true;
  }
  if (request.getSupportLanguage) {
    TRANSLATOR_MANAGER.getSupportLanguage().then(result => reponse(result));
    return true;
  }
  if (request.setFriendList) {
    request.setFriendList.reduce((textList, firend) => {
      textList[escape(firend.replace(' ', ''))] = {
        tText: '',
        sText: '',
      };
      return textList;
    }, DEFAULT_SETTINGS.CacheUnsentTextMap)
    chrome.storage.sync.set({ CacheUnsentTextMap: DEFAULT_SETTINGS.CacheUnsentTextMap }, () => {
      reponse(DEFAULT_SETTINGS.CacheUnsentTextMap)
    });
    return true;
  }
  if (request.setCurrentFriend) {
    DEFAULT_SETTINGS.CurrentFriends = escape(request.setCurrentFriend.replace(' ', ''));
    chrome.storage.sync.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends }, () => {
      reponse(DEFAULT_SETTINGS.CurrentFriends)
    });
    return true;
  }
  if (request.cacheUnsentText) {
    chrome.storage.sync.get(['CurrentFriends', 'CacheUnsentTextMap'], ({ CurrentFriends, CacheUnsentTextMap }) => {
      CacheUnsentTextMap[CurrentFriends] = request.cacheUnsentText;
      chrome.storage.sync.set({ CacheUnsentTextMap }, () => reponse(CacheUnsentTextMap));
    });
    return true;
  }
});

function setDefaultSettings(result, settings) {
  for (let i in settings) {
    if (
      typeof settings[i] === 'object' &&
      !(settings[i] instanceof Array) &&
      Object.keys(settings[i]).length > 0
    ) {
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