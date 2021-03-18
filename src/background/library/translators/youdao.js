import axios from "axios";
import crypto from "crypto";
import querystring from "querystring";

/**
 * Supported languages
 */
const LANGUAGES = [
    ["zh-CN", "zh-CHS"],
    ["en", "en"],
    ["ja", "ja"],
    ["ko", "ko"],
    ["fr", "fr"],
    ["es", "es"],
    ["pt", "pt"],
    ["it", "it"],
    ["ru", "ru"],
    ["vi", "vi"],
    ["de", "de"],
    ["ar", "ar"],
    ["id", "id"],
    ["af", "af"],
    ["bs", "bs"],
    ["bg", "bg"],
    ["ca", "ca"],
    ["hr", "hr"],
    ["cs", "cs"],
    ["da", "da"],
    ["nl", "nl"],
    ["et", "et"],
    ["fi", "fi"],
    ["el", "el"],
    ["ht", "ht"],
    ["he", "he"],
    ["hi", "hi"],
    ["hu", "hu"],
    ["sw", "sw"],
    ["lv", "lv"],
    ["lt", "lt"],
    ["ms", "ms"],
    ["mt", "mt"],
    ["no", "no"],
    ["fa", "fa"],
    ["pl", "pl"],
    ["ro", "ro"],
    ["sk", "sk"],
    ["sl", "sl"],
    ["sv", "sv"],
    ["th", "th"],
    ["tr", "tr"],
    ["uk", "uk"],
    ["ur", "ur"],
    ["cy", "cy"],
    ["sq", "sq"],
    ["am", "am"],
    ["hy", "hy"],
    ["az", "az"],
    ["bn", "bn"],
    ["eu", "eu"],
    ["be", "be"],
    ["ceb", "ceb"],
    ["co", "co"],
    ["eo", "eo"],
    ["fil", "tl"],
    ["fy", "fy"],
    ["gl", "gl"],
    ["ka", "ka"],
    ["gu", "gu"],
    ["ha", "ha"],
    ["haw", "haw"],
    ["is", "is"],
    ["ig", "ig"],
    ["ga", "ga"],
    ["jw", "jw"],
    ["kn", "kn"],
    ["kk", "kk"],
    ["km", "km"],
    ["ku", "ku"],
    ["lo", "lo"],
    ["la", "la"],
    ["lb", "lb"],
    ["mk", "mk"],
    ["mg", "mg"],
    ["ml", "ml"],
    ["mi", "mi"],
    ["mr", "mr"],
    ["mn", "mn"],
    ["my", "my"],
    ["ne", "ne"],
    ["ps", "ps"],
    ["ma", "pa"],
    ["sm", "sm"],
    ["gd", "gd"],
    ["st", "st"],
    ["sd", "sd"],
    ["si", "si"],
    ["so", "so"],
    ["su", "su"],
    ["tg", "tg"],
    ["ta", "ta"],
    ["te", "te"],
    ["uz", "uz"],
    ["xh", "xh"],
    ["yi", "yi"],
    ["yo", "yo"],
    ["zu", "zu"],
];

/**
 * Youdao translator interface.
 */
class YoudaoTranslator {
    constructor() {
        this.MAX_RETRY = 3; // Max retry times after failure.
        this.HOST = "http://fanyi.youdao.com"; // Youdao translation url
        this.sign = ""; // one of request parameters
        /**
         * Request headers
         */
        this.HEADERS = {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie:
                "OUTFOX_SEARCH_USER_ID=350012125@101.224.253.176;  UM_distinctid=1746d0c442e97f-042f749d1c0fb3-1711424a-1fa400-1746d0c442f8a3; OUTFOX_SEARCH_USER_ID_NCOO=608404064.645282; _ntes_nnid=15061f9646bde23f26634549a2af10f6,1599559922661; DICT_UGC=be3af0da19b5c5e6aa4e17bd8d90b28a|; JSESSIONID=abcEdBWwXs8mW8MJ2vXrx; ___rl__test__cookies=1599639537705",
            Referer: "http://fanyi.youdao.com/",
        };

        /**
         * Language to translator language code.
         */
        this.LAN_TO_CODE = new Map(LANGUAGES);

        /**
         * Translator language code to language.
         */
        this.CODE_TO_LAN = new Map(LANGUAGES.map(([lan, code]) => [code, lan]));

        /**
         * TTS audio instance.
         */
        this.AUDIO = new Audio();
    }

    /**
     * Parse the translate result.
     *
     * @param {Object} result translate result
     * @returns {Object} parsed result
     */
    parseResult(result) {
        let resText =
            result.translateResult && result.translateResult[0] && result.translateResult[0][0]
                ? result.translateResult[0][0].tgt
                : "";
        let originText = resText ? result.translateResult[0][0].src : "";
        // console.log('resText:', resText);

        let parsed = {};
        parsed.originalText = originText;
        parsed.mainMeaning = resText;

        return parsed;
    }

    /**
     * Get supported languages of this API.
     *
     * @returns {Set<String>} supported languages
     */
    supportedLanguages() {
        return new Set(this.LAN_TO_CODE.keys());
    }

    /**
     * Detect language of given text.
     *
     * @param {String} text text to detect
     * @returns {Promise} then(result) used to return request result. catch(error) used to catch error
     */
    detect(text) {
        return axios({
            url: "/translate_o",
            method: "post",
            baseURL: this.HOST,
            headers: this.HEADERS,
            data: this.getQueryStr(text),
            timeout: 5000
        }).then(result => {
            if (result.data.errorCode === 0) {
                return Promise.resolve(this.CODE_TO_LAN.get(result.data.type.split('2')[0]));
            }
            return Promise.reject(result.data);
        });
    }

    /**
     * Translate given text.
     *
     * @param {String} text text to translate
     * @param {String} from source language
     * @param {String} to target language
     * @returns {Promise} then(result) used to return request result. catch(error) used to catch error
     */
    translate(text, from = "AUTO") {
        let reTryCount = 0;
        // send translation request one time
        // if the first request fails, resend requests no more than {this.MAX_RETRY} times
        let translateOneTime = async function () {
            let detectedFrom = from;
            if (detectedFrom === "auto") {
                // detectedFrom = await this.detect(text);
            }

            // let toCode = this.LAN_TO_CODE.get(to),
            //     fromCode = this.LAN_TO_CODE.get(detectedFrom);

            return axios({
                url: "/translate_o", // + "?" + "from=" + fromCode + "&to=" + toCode,
                method: "post",
                baseURL: this.HOST,
                headers: this.HEADERS,
                data: this.getQueryStr(text), // includes sign
                timeout: 5000,
            }).then((result) => {
                //console.log("HTTP status:", result.status);
                // console.log("HTTP statusText:", result.statusText);
                // console.log("result.data\n", result.data);

                if (result.data.errorCode !== 0) {
                    if (reTryCount < this.MAX_RETRY) {
                        reTryCount++;
                        // get new token and gtk
                        return translateOneTime();
                    }
                    return Promise.reject(result);
                }
                return Promise.resolve(this.parseResult(result.data));
            });
        }.bind(this);

        //
        return translateOneTime();
    }

    /* eslint-disable */

    /**
     * get query string that includes necessary data for Youdao API.
     *
     * @param {String} text text to translate
     * @param {String} from source language
     * @param {String} to target language
     * @returns {String} uri encoded string
     */
    getQueryStr(text = "", from = "AUTO", to = "AUTO") {
        let sign = this.generateSign(text);
        // TODO support languages selecting
        let QSObj = {
            i: text,
            from: "AUTO",
            to: "AUTO",
            smartresult: "dict",
            client: "fanyideskweb",
            doctype: "json",
            ...sign,
            version: "2.1",
            keyfrom: "fanyi.web",
            action: "FY_BY_CLICKBUTTION",
        };
        const qs = querystring.stringify(QSObj);
        // console.log("qs\n", qs);
        return qs;
    }

    /**
     * get Youdai sign object
     *
     * @param {String} text text to translate
     * @returns {Object} sign object
     */
    generateSign(text = "") {
        let t = crypto.createHash("md5").update(navigator.appVersion).digest("hex"), // n.md5(navigator.appVersion)
            r = "" + new Date().getTime(),
            i = r + parseInt(10 * Math.random(), 10);
        let raw = "fanyideskweb" + text + i + "Tbh5E8=q6U3EXe+&L[4c@";
        let sign = crypto.createHash("md5").update(raw).digest("hex");
        return {
            lts: r, // date getTime ms
            bv: t, // md5 navigator.appVersion string
            salt: i, // radom number
            sign,
        };
    }
    /* eslint-enable */
}

/**
 * Create and export default Translator object.
 */
const TRANSLATOR = new YoudaoTranslator();
export default TRANSLATOR;
