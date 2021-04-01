import './content.css';
import $ from 'jquery';
import { fromEvent } from 'rxjs';
import { TRANSLATIO_NDISPLAY_MODE, LANGUAGES_TO_CHINESE } from '../common/scripts/modal';
import { LANGUAGES, BROWSER_LANGUAGES_MAP } from '../common/scripts/languages';
import Storager from '../common/scripts/storage';
import { injectScriptToPage } from '../common/scripts/injectScript';

$(() => {
    listenFriendListChange();
    listenEnterChatPage();
    listenLeaveChatPage();
    function listenFriendListChange() {
        const $friendList = $('#pane-side');
        $friendList.bind('DOMNodeInserted', (e) => {
            const $friend = $(e.target).find('[role="option"] > div > div:nth-child(2) > div:nth-child(1) span > span');
            if ($friend.length) {
                const friendId = $friend.text();
                chrome.runtime.sendMessage({ updateFriendList: friendId });
            }
        });
    }

    function listenEnterChatPage() {
        const $app = $('#app');
        const appDOMNodeInserted$ = fromEvent($app, 'DOMNodeInserted');
        appDOMNodeInserted$.subscribe((e) => {
            const $target = $(e.target);
            const id = $target.attr('id');
            const className = $target.prop('className');
            if (typeof className === 'string' && className.includes('two')) {
                injectScriptToPage(); // 注入WAPI脚本
                const $friendContainer = $target.find('#pane-side [role="region"] [role="option"] > div');
                const friendList = Array.from($friendContainer).reduce((list, friend) => {
                    const friendId = $(friend).find('> div:nth-child(2) > div:nth-child(1) span > span').text();
                    list.push(friendId);
                    return list;
                }, []);
                chrome.runtime.sendMessage({ setFriendList: friendList });
            }
            if (typeof id === 'string' && id === 'main') {
                renderMessageList(true);
                listenMessageListChange();
                injectInputContainer();
            }
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
        const friend = $('#main header > div:nth-child(2) > div:nth-child(1) span').text();
        chrome.runtime.sendMessage({ setCurrentFriend: friend }, () => rerenderDefaultText());
    }

    function cacheUnsentText(tText, sText) {
        chrome.runtime.sendMessage({ cacheUnsentText: { tText, sText } });
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
            getCurrentFriend();
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
                chrome.runtime.sendMessage({ getSupportLanguage: true }, (languages) => {
                    const languageSet = handleSelectLanguages(languages).reduce((set, lg) => {
                        if (lg === buttonLg) return set;
                        const $lgTmpl = $(`<li data-lg="${lg}">${getChinese(lg)}</li>`);
                        $lgTmpl.click((e) => {
                            chrome.runtime.sendMessage({
                                setLanguageSetting: {
                                    from: 'select',
                                    language: $(e.target).attr('data-lg'),
                                    target: buttonTarget,
                                },
                            }, () => {
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
                chrome.runtime.sendMessage({ translateInput: text }, (e) => {
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
            chrome.runtime.sendMessage({ changeDefaultTranslator: e.target.value }, () => {
                renderMessageList(true);
                handleInjectInputTranslateFlag();
            });
        });
    }

    async function handleInjectInputTranslateFlag() {
        try {
            const { LanguageSetting } = await Storager.get('LanguageSetting');
            const { tl } = LanguageSetting;
            chrome.runtime.sendMessage({ getSupportLanguage: true }, (languages) => {
                if (languages.indexOf(tl) === -1) {
                    chrome.runtime.sendMessage({
                        setLanguageSetting: {
                            from: 'select',
                            language: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
                            target: 'tl',
                        },
                    }, () => {
                        renderMessageList();
                    });
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
        chrome.runtime.sendMessage({
            setLanguageSetting: {
                from: 'message',
                text,
            },
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
        chrome.runtime.sendMessage({ translateMessage: text }, (e) => {
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
});
