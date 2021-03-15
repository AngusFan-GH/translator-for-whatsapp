import { BROWSER_LANGUAGES_MAP } from '../common/scripts/languages.js';
import TRANSLATOR_MANAGER from './library/translate.js';
import initWindow from './handle-window';

const DEFAULT_SETTINGS = {
  languageSetting: {
    sl: 'auto',
    tl: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
    s2: 'en'
  },
  DefaultTranslator: 'GoogleTranslate',
  OtherSettings: {}
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
  if (request.setLanguageSettingByMessage) {
    TRANSLATOR_MANAGER.detect(request.setLanguageSettingByMessage).then(e => {
      TRANSLATOR_MANAGER.updateLanguageSetting({ s2: e });
    });
    return true;
  }
  if (request.changeDefaultTranslator) {
    TRANSLATOR_MANAGER.updateDefaultTranslator(request.changeDefaultTranslator).then(result => reponse(result));
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