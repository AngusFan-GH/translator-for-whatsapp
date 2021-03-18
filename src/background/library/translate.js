import BAIDU from './translators/baidu';
import BING from './translators/bing';
import GOOGLE from './translators/google';
import YOUDAO from './translators/youdao';

class TranslatorManager {
    constructor() {
        /**
         * Supported translators.
         */
        this.TRANSLATORS = {
            BaiduTranslate: BAIDU,
            BingTranslate: BING,
            GoogleTranslate: GOOGLE,
            YouDaoTranslate: YOUDAO,
        };

        /**
         * Language setting.
         */
        this.LANGUAGE_SETTING = {};

        /**
         * Default translator.
         */
        this.DEFAULT_TRANSLATOR = '';

        this.TRANSLATE_RESULT_CACHE = Object.keys(this.TRANSLATORS).reduce((set, translator) => (set[translator] = Object.create(null), set), Object.create(null));

        this.DETECT_LANGUAGE_CACHE = Object.keys(this.TRANSLATORS).reduce((set, translator) => (set[translator] = Object.create(null), set), Object.create(null));
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
        if (this.DETECT_LANGUAGE_CACHE[this.DEFAULT_TRANSLATOR][escape(text)]) {
            return Promise.resolve(this.DETECT_LANGUAGE_CACHE[this.DEFAULT_TRANSLATOR][escape(text)]);
        }
        return this.TRANSLATORS[this.DEFAULT_TRANSLATOR].detect(text).then(res => {
            this.DETECT_LANGUAGE_CACHE[this.DEFAULT_TRANSLATOR][escape(text)] = res;
            return Promise.resolve(res);
        });
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
            const slCache = this.TRANSLATE_RESULT_CACHE[this.DEFAULT_TRANSLATOR][escape(sl)];
            if (slCache) {
                const tlCache = slCache[escape(tl)];
                if (tlCache) {
                    const result = tlCache[escape(text)];
                    if (result) {
                        return Promise.resolve(result);
                    }
                } else {
                    this.TRANSLATE_RESULT_CACHE[this.DEFAULT_TRANSLATOR][escape(sl)][escape(tl)] = Object.create(null);
                }
            } else {
                this.TRANSLATE_RESULT_CACHE[this.DEFAULT_TRANSLATOR][escape(sl)] = Object.create(null);
                this.TRANSLATE_RESULT_CACHE[this.DEFAULT_TRANSLATOR][escape(sl)][escape(tl)] = Object.create(null);
            }
            // Do translate.
            return this.TRANSLATORS[this.DEFAULT_TRANSLATOR].translate(text, sl, tl).then(result => {
                result.sourceLanguage = sl;
                result.targetLanguage = tl;
                this.TRANSLATE_RESULT_CACHE[this.DEFAULT_TRANSLATOR][escape(sl)][escape(tl)][escape(text)] = result;
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