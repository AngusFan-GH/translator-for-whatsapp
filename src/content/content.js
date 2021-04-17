import './content.css';
import $ from 'jquery';
import { fromEvent, Subject, zip } from 'rxjs';
import { TRANSLATIO_NDISPLAY_MODE } from '../common/modal/';
import { LANGUAGES, BROWSER_LANGUAGES_MAP, LANGUAGES_TO_CHINESE } from '../common/modal/languages';
import { injectScriptToPage } from './inject/injectScript';
import Storager from '../common/scripts/storage';
import Messager from '../common/scripts/messager';
import { filter, map } from 'rxjs/operators';

const BACKGROUND = 'background';
const InjectScript = 'injectScript';
const Content = 'content';
const InjectContactLoaded$ = new Subject();
const InjectWAPILoaded$ = new Subject();
const InjectScriptLoaded$ = zip(InjectContactLoaded$, InjectWAPILoaded$);

$(() => {
    listenInjectScriptLoaded();
    listenEnterChatPage();
    listenLeaveChatPage();
});

function listenEnterChatPage() {
    const $app = $('#app');
    const appDOMNodeInserted$ = fromEvent($app, 'DOMNodeInserted').pipe(map(e => {
        const $target = $(e.target);
        const id = $target.attr('id');
        const className = $target.prop('className');
        return { id, className, $target };
    }));
    const pageInited$ = appDOMNodeInserted$.pipe(filter(({ className }) => typeof className === 'string' && className.includes('two')));
    pageInited$.subscribe(() => {
        injectScriptToPage(); // 向页面注入脚本
    });
    InjectScriptLoaded$.subscribe(() => {
        getAllChatIds();
        getAllMessageIds();
    });
    const enterChatPage$ = appDOMNodeInserted$.pipe(filter(({ id }) => typeof id === 'string' && id === 'main'));
    enterChatPage$.subscribe(() => {
        getCurrentFriend();
        renderMessageList(true);
        listenMessageListChange();
        injectInputContainer();
    });
}

function listenInjectScriptLoaded() {
    Messager.receive('content', 'injectScriptLoaded').subscribe(({ data }) => {
        if (data === 'content/wapi.js') InjectWAPILoaded$.next(true);
        if (data === 'content/contact.js') InjectContactLoaded$.next(true);
    });
}

function setFriendList(data) {
    Messager.send(BACKGROUND, 'setFriendList', data).then(e => {
        console.log('setFriendList', e);
    });
}

function getAllChatIds() {
    const responseTitle = 'responseGetAllChatIds';
    Messager.post(InjectScript, 'getAllChatIds', { responseTitle });
    Messager.receive(Content, responseTitle)
        .subscribe(({ data }) => setFriendList(data));
}

function getAllMessageIds() {
    const responseTitle = 'responseGetAllMessageIds';
    Messager.post(InjectScript, 'getAllMessageIds', { responseTitle });
    getAllUnSendMessages();
}

function getAllUnSendMessages() {
    Messager.receive(Content, 'getAllUnSendMessages')
        .subscribe(msgIds => {
            const responseTitle = 'responseGetAllUnSendMessages';
            Messager.post(InjectScript, 'getAllUnSendMessages', { data: msgIds, responseTitle });
        });
}

function listenLeaveChatPage() {
    const $app = $('#app');
    const appDOMNodeRemoved$ = fromEvent($app, 'DOMNodeRemoved');
    appDOMNodeRemoved$.subscribe((e) => {
        const $target = $(e.target);
        const id = $target.attr('id');
        if (typeof id === 'string' && id === 'main') {
            const iptText = $target.find('footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text').text();
            const injectIptText = $target.find('footer#tfw_input_container .copyable-area .copyable-text.selectable-text').text();
            cacheUnsentText(iptText, injectIptText);
        }
    });
}

function getCurrentFriend() {
    const currentId = $('#main .focusable-list-item[data-id]').attr('data-id').split('_')[1];
    Messager.send(BACKGROUND, 'setCurrentFriend', currentId).then(() => rerenderDefaultText());
}

function cacheUnsentText(tText, sText) {
    Messager.send(BACKGROUND, 'cacheUnsentText', { tText, sText });
}

async function rerenderDefaultText() {
    try {
        const { CurrentFriends, CacheUnsentTextMap } = await Storager.get(['CurrentFriends', 'CacheUnsentTextMap']);
        const { tText, sText } = CacheUnsentTextMap[CurrentFriends] || { tText: '', sText: '' };
        cacheUnsentText('', '');
        const $ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
        $ipt.text('');
        $ipt.focus();
        document.execCommand('insertText', false, tText);
        const $injectIpt = $('#main footer#tfw_input_container .copyable-area .copyable-text.selectable-text');
        $injectIpt.text('');
        $injectIpt.focus();
        document.execCommand('insertText', false, sText);
        setTimeout(() => {
            window.getSelection().removeAllRanges();
            $injectIpt.focus();
        }, 0);
    } catch (err) {
        console.error(err);
    }
}

async function injectInputContainer() {
    if ($('#tfw_input_container').length) $('#tfw_input_container').remove();
    const $footer = $('#main footer').clone().attr('id', 'tfw_input_container');
    const $copyableArea = $($footer.children('.copyable-area').get(0));
    const $selectContainer = $($copyableArea.children('div').get(0));
    $selectContainer.html($(`<select class="default_translator">
        <option value="GoogleTranslate">谷歌翻译</option>
        <option value="BingTranslate">必应翻译</option>
        <option value="BaiduTranslate">百度翻译</option>
    </select>`));
    const $textArea = $($copyableArea.children('div').get(1)).addClass('translate_area');
    try {
        const { TranslationDisplayMode } = await Storager.get('TranslationDisplayMode');
        const $btn = $(`
            <button class="translate_btn">${TRANSLATIO_NDISPLAY_MODE[TranslationDisplayMode]}</button>
        `);
        $copyableArea.empty().append([$selectContainer, $textArea, $btn]);
        $footer.empty().append($copyableArea);
        $('#main').append($footer);
        defaultTranslatorChange();
        clickTranslateBtn();
        listenInputValueChange();
        addTranslateFlag();
    } catch (err) {
        console.error(err);
    }
}

function addTranslateFlag() {
    const $ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
    const $injectIpt = $($('#tfw_input_container .translate_area > div').children('div').get(1));
    Storager.get('LanguageSetting').then(({ LanguageSetting }) => {
        const { tl, s2 } = LanguageSetting;
        $ipt.after($(`<div class="translate_flag">
            <span class="translate_flag_button" data-target="s2" data-lg="${s2}">${getChinese(s2)}</span>
        </div>`));
        $injectIpt.after($(`<div class="translate_flag">
            <span class="translate_flag_button" data-target="tl" data-lg="${tl}">${getChinese(tl)}</span>
        </div>`));
        const flagButtonClick$ = fromEvent($('#main footer .translate_flag .translate_flag_button'), 'click');
        flagButtonClick$.subscribe((event) => {
            const $button = $(event.target);
            const $container = $('#main');
            const buttonTarget = $button.attr('data-target');
            const buttonLg = $button.attr('data-lg');
            const $selectContainer = $('<div class="translate_flag_select_container"></div>');
            const $selectSearch = $('<input class="translate_flag_select_search" type="text" autocomplete="off" placeholder="输入语种"/>');
            $selectContainer.append($selectSearch);
            Messager.send(BACKGROUND, 'getSupportLanguage').then((languages) => {
                const languageSet = handleSelectLanguages(languages).reduce((set, lg) => {
                    if (lg === buttonLg) return set;
                    const $lgTmpl = $(`<li data-lg="${lg}">${getChinese(lg)}</li>`);
                    $lgTmpl.click((e) => {
                        Messager.send(BACKGROUND, 'setLanguageSetting', {
                            from: 'select',
                            language: $(e.target).attr('data-lg'),
                            target: buttonTarget,
                        }).then(() => {
                            $selectContainer.remove();
                            if (buttonTarget === 'tl') renderMessageList();
                        });
                    });
                    set.push($lgTmpl);
                    return set;
                }, []);
                const $selectUl = $('<ul></ul>').append(...languageSet);
                const $empty = $('<li class="empty">无匹配项</li>');
                $selectUl.append($empty.hide());
                const mainWidth = $('#main').width();
                const sideWidth = $('#pane-side').width();
                $selectContainer.append($selectUl).css({
                    right: `${mainWidth + sideWidth - ($button.offset().left + $button.width())}px`,
                    bottom: `${$('#main').height() + -($button.offset().top - 5)}px`,
                });
                $container.append($selectContainer);
                $selectSearch.focus();
                $selectSearch.on('input propertychange', (e) => {
                    const text = $(e.target).val().trim();
                    if (text == null || text === '') {
                        $('.translate_flag_select_container ul > li').show();
                        $empty.hide();
                        return;
                    }
                    let count = 0;
                    languageSet.forEach((lg) => {
                        lg.text().toLowerCase().includes(text.toLowerCase()) ? lg.show() : (count++, lg.hide());
                    });
                    if (count === languageSet.length) {
                        $empty.show();
                    } else {
                        $empty.hide();
                    }
                });
            });
        });
    });
    Storager.onChanged('LanguageSetting').subscribe((e) => {
        const { tl, s2 } = e.newValue;
        $ipt.next().find('.translate_flag_button').attr('data-lg', s2).text(getChinese(s2));
        $injectIpt.next().find('.translate_flag_button').attr('data-lg', tl).text(getChinese(tl));
    });
    const documentClick$ = fromEvent($(document), 'click');
    documentClick$.subscribe((e) => {
        if ($(e.target).closest('.translate_flag_select_search').length) return;
        const $selectContaienr = $('.translate_flag_select_container');
        if ($selectContaienr.length) $selectContaienr.remove();
    });
}

function handleSelectLanguages(languages) {
    const commonLanguages = ['zh-CN', 'en', 'es', 'fr', 'pt', 'ar', 'ru', 'de', 'ta', 'hi'];
    return commonLanguages.concat(languages.filter((lg) => lg !== 'auto' && commonLanguages.indexOf(lg) === -1));
}

function getChinese(code) {
    return LANGUAGES_TO_CHINESE[LANGUAGES[code] || code] || code;
}

function listenInputValueChange() {
    const $ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
    const $area = $('#tfw_input_container .translate_area > div');
    const $placeholder = $($area.children('div').get(0)).text('输入需要翻译的消息');
    const $input = $($area.children('div').get(1));
    const $sendBtnContainer = $('#main footer:not(#tfw_input_container) .copyable-area > div:nth-last-child(1)');
    $ipt.keydown((e) => {
        if (e.keyCode === 13) {
            clearInjectInputValue(e.target, $input, $placeholder);
        }
    });
    $sendBtnContainer.on('click', 'button:has(span[data-icon="send"])', () => {
        clearInjectInputValue($ipt[0], $input, $placeholder);
    });
    $input.bind('DOMSubtreeModified', (e) => {
        if (e.target.innerText.trim()) {
            $placeholder.css({ visibility: 'hidden' });
        } else {
            $placeholder.css({ visibility: 'initial' });
            e.target.innerText = '';
        }
    });
    $input.keydown((e) => {
        if (e.keyCode === 13) {
            const text = e.target.innerText.trim();
            if (!text) return;
            setTimeout(() => $placeholder.hide(), 0);
            Messager.send(BACKGROUND, 'translateInput', text).then(e => {
                $ipt.text('');
                $ipt.focus();
                document.execCommand('insertText', false, e.mainMeaning);
            });
        }
    });
    $input.focus((e) => {
        setCaret(e.target);
        $(e.target).parent().addClass('focused');
    });
    $input.blur((e) => $(e.target).parent().removeClass('focused'));
}

function clearInjectInputValue(e, $input, $placeholder) {
    const text = e.innerText.trim();
    if (!text) return;
    $input.text('');
    $placeholder.show();
    setTimeout(() => {
        $input.focus();
    }, 0);
}

function setCaret(el) {
    el.focus();
    if ($.support.msie) {
        const range = document.selection.createRange();
        range.moveToElementText(el);
        range.select();
        document.selection.empty();
    } else {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function defaultTranslatorChange() {
    const $defaultTranslator = $('#tfw_input_container .default_translator');
    Storager.get('DefaultTranslator').then(({ DefaultTranslator }) => $defaultTranslator.val(DefaultTranslator));
    const defaultTranslatorChange$ = fromEvent($defaultTranslator, 'change');
    defaultTranslatorChange$.subscribe((e) => {
        Messager.send(BACKGROUND, 'changeDefaultTranslator', e.target.value).then(() => {
            renderMessageList(true);
            handleInjectInputTranslateFlag();
        });
    });
}

async function handleInjectInputTranslateFlag() {
    try {
        const { LanguageSetting } = await Storager.get('LanguageSetting');
        const { tl } = LanguageSetting;
        Messager.send(BACKGROUND, 'getSupportLanguage').then((languages) => {
            if (languages.indexOf(tl) === -1) {
                Messager.send(BACKGROUND, 'setLanguageSetting', {
                    from: 'select',
                    language: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
                    target: 'tl',
                }).then(() => renderMessageList());
            }
        });
    } catch (err) {
        console.error(err);
    }
}

function clickTranslateBtn() {
    const $translateBtn = $('#tfw_input_container .translate_btn');
    const translateBtnClick$ = fromEvent($translateBtn, 'click');

    translateBtnClick$.subscribe(async () => {
        try {
            let { TranslationDisplayMode } = await Storager.get('TranslationDisplayMode');
            if (++TranslationDisplayMode >= TRANSLATIO_NDISPLAY_MODE.length) {
                TranslationDisplayMode = 0;
            }
            Storager.set({ TranslationDisplayMode }).then(() => {
                $translateBtn.text(TRANSLATIO_NDISPLAY_MODE[TranslationDisplayMode]);
                renderMessageList();
            });
        } catch (err) {
            console.error(err);
        }
    });
}

async function renderMessageList(isAutoDetect = false) {
    const $msgList = $('#main .copyable-area .focusable-list-item div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text:not(:has(> span > a))');
    if (isAutoDetect && $msgList.length) {
        const $last = $msgList.last();
        setLanguageSetting($last);
    }
    try {
        const { TranslationDisplayMode } = await Storager.get('TranslationDisplayMode');
        switch (TranslationDisplayMode) {
            case 1:
                Array.from($msgList).reverse().forEach((msg) => renderTranslateResult($(msg), true));
                break;
            case 2:
                $('#main .tfw_translate_result').show();
                Array.from($msgList).reverse().forEach((msg) => renderTranslateResult($(msg)));
                break;
            default:
                $msgList.parent().show();
                $('#main .tfw_translate_result').hide();
                break;
        }
    } catch (err) {
        console.error(err);
    }
}

function setLanguageSetting($target) {
    const text = $($target.children().get(0)).text();
    Messager.send(BACKGROUND, 'setLanguageSetting', {
        from: 'message',
        text,
    });
}

function renderTranslateResult($el, isHideSource = false) {
    const $resultContainer = $el.parent().next();
    if ($resultContainer && $resultContainer.css('display') === 'none') {
        $resultContainer.show();
        handleToggleSourceText($el, isHideSource);
        if (isHideSource) {
            $resultContainer.addClass('only');
        } else {
            $resultContainer.removeClass('only');
        }
        return;
    }
    let readMoreBtn = null;
    const $next = $el.next();
    if ($next.attr('role') === 'button') {
        readMoreBtn = $next;
    }
    const $container = $el.parent().parent();
    if (readMoreBtn) {
        setTimeout(() => {
            readMoreBtn.click();
            setTimeout(() => {
                handleRenderTranslateResult($el, $container, isHideSource);
            }, 0);
        }, 0);
        return;
    }
    handleRenderTranslateResult($el, $container, isHideSource);
}

function handleRenderTranslateResult($el, $container, isHideSource) {
    const text = $($el.children().get(0)).text();
    Messager.send(BACKGROUND, 'translateMessage', text).then(e => {
        let $div = null;
        if ($container.find('.tfw_translate_result').get(0)) {
            $div = $($container.find('.tfw_translate_result').get(0));
        } else {
            $div = $('<div class="tfw_translate_result"></div>');
            Storager.get('Styles').then(({ Styles }) => {
                const { lineColor, textColor } = Styles;
                $div.css({
                    color: textColor,
                    borderTopColor: lineColor,
                });
            });
        }
        Storager.onChanged('Styles').subscribe((e) => {
            const { lineColor, textColor } = e.newValue;
            $div.css({
                color: textColor,
                borderTopColor: lineColor,
            });
        });
        $div.text(e.mainMeaning);
        $div.append($('<span class="placeholder"></span>'));
        $container.append($div);
        handleToggleSourceText($el, isHideSource);
        if (isHideSource) {
            $div.addClass('only');
        } else {
            $div.removeClass('only');
        }
    });
}

function handleToggleSourceText($el, isHideSource) {
    if (isHideSource) {
        $el.parent().hide();
    } else {
        $el.parent().show();
    }
}

function listenMessageListChange() {
    const $msgListContaienr = $('#main .copyable-area .focusable-list-item').parent();
    const msgListContaienrDOMNodeInserted$ = fromEvent($msgListContaienr, 'DOMNodeInserted');
    msgListContaienrDOMNodeInserted$.subscribe(async (e) => {
        const $target = $(e.target);
        const className = $target.prop('className');
        if (typeof className === 'string' && className.includes('focusable-list-item')) {
            const $newMsg = $target.find('div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text:not(:has(> span > a))');
            if (!$newMsg.length) return;
            try {
                const { TranslationDisplayMode } = await Storager.get('TranslationDisplayMode');
                switch (TranslationDisplayMode) {
                    case 1:
                        renderTranslateResult($newMsg, true);
                        break;
                    case 2:
                        renderTranslateResult($newMsg);
                        break;
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
}
