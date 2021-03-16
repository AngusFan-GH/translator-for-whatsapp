import BAIDU from './translators/baidu.js';
import BING from './translators/bing.js';
import GOOGLE from './translators/google.js';

class TranslatorManager {
    constructor() {
        /**
         * Supported translators.
         */
        this.TRANSLATORS = {
            BaiduTranslate: BAIDU,
            BingTranslate: BING,
            GoogleTranslate: GOOGLE
        };

        /**
         * Language setting.
         */
        this.LANGUAGE_SETTING = {};

        /**
         * Default translator.
         */
        this.DEFAULT_TRANSLATOR = '';
    }

    /**
     * Load default translator if it is not loaded.
     * @returns {Promise<void>} loading Promise.
     */
    loadConfig() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(
                ['DefaultTranslator', 'languageSetting', 'OtherSettings'],
                (res) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    this.LANGUAGE_SETTING = res.languageSetting;
                    this.DEFAULT_TRANSLATOR = res.DefaultTranslator;
                    resolve();
                }
            );
        });
    }

    /**
     * detect text
     * @param {string} text
     * @returns {Promise<String>} detected language Promise
     */
    async detect(text) {
        await this.loadConfig();
        return this.TRANSLATORS[this.DEFAULT_TRANSLATOR].detect(text);
    }

    /**
     * This is a translation client function
     * @param {String} text original text to be translated
     * @param {Boolean} mutual exchange language setting
     */
    async translate(text, mutual = false) {
        await this.loadConfig();
        let sl = mutual ? this.LANGUAGE_SETTING.tl : this.LANGUAGE_SETTING.sl,
            tl = mutual ? this.LANGUAGE_SETTING.s2 : this.LANGUAGE_SETTING.tl;
        try {
            // Detect language first.
            sl = sl === 'auto' ? await this.detect(text) : sl;
            tl = tl === 'auto' ? await this.detect(text) : tl;
            // Do translate.
            return this.TRANSLATORS[this.DEFAULT_TRANSLATOR].translate(text, sl, tl).then(result => {
                result.sourceLanguage = sl;
                result.targetLanguage = tl;
                return Promise.resolve(result);
            })
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Update translator.
     * @param {string} translator the new translator to use.
     * @returns {Promise<void>} update finished promise.
     */
    updateDefaultTranslator(translator) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ DefaultTranslator: translator }, () => {
                resolve(translator);
            });
        });
    }

    /**
     * Update language setting.
     *
     * @param {string} translator the new translator to use.
     *
     * @returns {Promise<void>} update finished promise.
     */
    updateLanguageSetting(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ languageSetting: Object.assign(this.LANGUAGE_SETTING, settings) }, () => {
                resolve();
            });
        });
    }
}
const TRANSLATOR_MANAGER = new TranslatorManager();
export default TRANSLATOR_MANAGER;