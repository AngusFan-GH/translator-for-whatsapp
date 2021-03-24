import { BROWSER_LANGUAGES_MAP, LANGUAGES } from '../common/scripts/languages.js';
import TRANSLATOR_MANAGER from './library/translate.js';
import { initWindow, TABID } from './handle-window';

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
  },
  Styles: {
    lineColor: '#EC1C23',
    textColor: '#00A1E7'
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
  }
  if (request.translateInput) {
    TRANSLATOR_MANAGER.translate(request.translateInput, true).then(result => reponse(result));
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
  }
  if (request.changeDefaultTranslator) {
    TRANSLATOR_MANAGER.updateDefaultTranslator(request.changeDefaultTranslator).then(result => reponse(result));
  }
  if (request.getSupportLanguage) {
    TRANSLATOR_MANAGER.getSupportLanguage().then(result => reponse(result));
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
  }
  if (request.setCurrentFriend) {
    DEFAULT_SETTINGS.CurrentFriends = escape(request.setCurrentFriend.replace(' ', ''));
    chrome.storage.sync.set({ CurrentFriends: DEFAULT_SETTINGS.CurrentFriends }, () => {
      reponse(DEFAULT_SETTINGS.CurrentFriends)
    });
  }
  if (request.cacheUnsentText) {
    chrome.storage.sync.get(['CurrentFriends', 'CacheUnsentTextMap'], ({ CurrentFriends, CacheUnsentTextMap }) => {
      CacheUnsentTextMap[CurrentFriends] = request.cacheUnsentText;
      chrome.storage.sync.set({ CacheUnsentTextMap }, () => reponse(CacheUnsentTextMap));
    });
  }
  if (request.updateFriendList) {
    chrome.storage.sync.get('CacheUnsentTextMap', ({ CacheUnsentTextMap }) => {
      const friend = escape(request.updateFriendList.replace(' ', ''));
      CacheUnsentTextMap[friend] = { tText: '', sText: '' };
      chrome.storage.sync.set({ CacheUnsentTextMap }, () => reponse(CacheUnsentTextMap));
    });
  }
  if (request.changeStyles) {
    const { target, color } = request.changeStyles;
    chrome.storage.sync.get('Styles', ({ Styles }) => {
      switch (target) {
        case 'line':
          Styles.lineColor = color;
          break;
        case 'text':
          Styles.textColor = color;
          break;
      }
      chrome.storage.sync.set({ Styles });
    });
  }
  return true;
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