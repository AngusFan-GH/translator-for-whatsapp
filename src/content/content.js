import './content.css';
import $ from 'jquery';
import { combineLatest, fromEvent, Subject, zip } from 'rxjs';
import { TRANSLATIO_NDISPLAY_MODE, MESSAGER_SENDER } from '../common/modal/';
import { LANGUAGES, BROWSER_LANGUAGES_MAP, LANGUAGES_TO_CHINESE } from '../common/modal/languages';
import { injectScriptToPage } from './inject/injectScript';
import Storager from '../common/scripts/storage';
import Messager from '../common/scripts/messager';
import { filter, first, map } from 'rxjs/operators';

const IFRAME_URL = process.env.NODE_ENV === 'production' ?
    `chrome-extension://${chrome.runtime.id}/popup/index.html` :
    'http://localhost:8080/';

const EnterChatPage$ = new Subject();
const $Messager = new Messager(MESSAGER_SENDER.CONTENT);
const PopupLoaded$ = new Subject();
const GetCustomPortraitFinish$ = new Subject();
const SendCustomPortraitResult$ = combineLatest(PopupLoaded$, GetCustomPortraitFinish$);
const GetCustomInfo$ = new Subject();
const SendCustomInfo$ = combineLatest(PopupLoaded$, GetCustomInfo$);
const CurrentFriendChange$ = new Subject();
const SendCurrentFriendChange$ = combineLatest(PopupLoaded$, CurrentFriendChange$);
const InjectContactLoaded$ = new Subject();
const InjectWAPILoaded$ = new Subject();
const InjectScriptLoaded$ = zip(InjectContactLoaded$, InjectWAPILoaded$);

$(() => {
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
    // 联系人页面加载完成
    const pageInited$ = appDOMNodeInserted$.pipe(filter(({ className }) => typeof className === 'string' && className.includes('two')));
    pageInited$.pipe(first()).subscribe(() => {
        listenInjectScriptLoaded(); // 监听注入脚本加载完成
        injectScriptToPage(); // 向页面注入脚本
    });
    //进入聊天对话界面
    appDOMNodeInserted$.pipe(filter(({ id }) => typeof id === 'string' && id === 'main')).subscribe(() => EnterChatPage$.next(true));
    EnterChatPage$.subscribe(() => {
        injectInputContainer(); // 注入辅助输入框
        getCurrentFriend(); // 获取当前对话用户
        listenMessageListChange(); // 监听消息列表改变
        renderMessageList(true); // 渲染消息列表
    });
    EnterChatPage$.pipe(first()).subscribe(() => {
        injectIframeContainer();
    });

    injectIframeContainerBtn();
}

function injectIframeContainerBtn() {

    combineLatest(PopupLoaded$, EnterChatPage$).subscribe(() => {
        const $openIframeContainerBtn = $(`<div>
            <div class="_2n-zq">
                <div aria-disabled="false" role="button" tabindex="0" data-tab="8" title="打开辅助面板" aria-label="打开辅助面板">
                    <span class="panel-btn">
                        <svg t="1621433103257" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1189" width="24" height="24">
                            <path fill="currentColor" d="M511.44 162.76c-231.04 0-429.74 143.28-508.32 346.6 78.6 203.32 277.28 346.6 508.32 346.6 231.04 0 429.8-143.28 508.32-346.6-78.52-203.32-277.28-346.6-508.32-346.6m0 577.64c-129.36 0-231.04-101.62-231.04-231.04 0-129.44 101.68-231.04 231.04-231.04 129.44 0 231.04 101.62 231.04 231.04S640.88 740.4 511.44 740.4m0-369.68c-78.52 0-138.64 60.12-138.64 138.64 0 78.52 60.12 138.64 138.64 138.64 78.6 0 138.64-60.12 138.64-138.64 0-78.52-60.04-138.64-138.64-138.64" p-id="1190"></path>
                        </svg>
                    </span>
                </div>
            </div>
        </div>`);
        const $closeIframeContainerBtn = $(`<div>
            <div class="_2n-zq">
                <div aria-disabled="false" role="button" tabindex="0" data-tab="8" title="关闭辅助面板" aria-label="关闭辅助面板">
                    <span class="panel-btn">
                    <svg t="1621434583569" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2779" width="24" height="24">
                        <path d="M599.54 491.87l57.84 55.35c2.76-11.37 4.62-23.04 4.62-35.22 0-82.71-67.29-150-150-150-14.46 0-28.14 2.7-41.4 6.54l57.6 55.11c35.31 6.45 63.33 33.48 71.34 68.22z m-46.05 163.56l-57.54-55.08c-35.43-6.42-63.6-33.51-71.55-68.4l-57.78-55.26c-2.76 11.4-4.62 23.1-4.62 35.31 0 82.71 67.29 150 150 150 14.49 0 28.2-2.73 41.49-6.57zM199.76 160.31c-12-11.43-30.99-11.01-42.42 0.96-11.46 11.97-11.04 30.96 0.93 42.42l690 660A29.91 29.91 0 0 0 869 872c7.92 0 15.78-3.12 21.69-9.27 11.46-11.97 11.01-30.96-0.93-42.42l-690-660z" p-id="2780" fill="#bfbfbf"></path><path d="M512 782c-158.7 0-314.37-106.47-388.95-266.19-0.15-0.57-0.33-1.08-0.51-1.62-0.06-0.51-0.21-0.93-0.27-1.23-0.03-0.33-0.27-0.75-0.27-1.17v-0.39c0-0.69 0.42-1.38 0.51-2.07 0.12-0.42 0.33-0.78 0.45-1.2 27.87-60.12 67.5-112.74 114.51-154.98l-43.41-41.49c-52.02 47.49-95.7 106.08-126.21 172.74-0.99 1.98-1.68 3.84-2.13 5.52a15.625 15.625 0 0 0-0.6 1.5c-1.65 4.74-1.65 7.95-1.53 7.23-0.75 3.51-1.5 10.5-1.5 10.5-0.21 2.1-0.18 3.78 0.06 5.88 0 0 0.66 12.63 0.99 13.89l4.26 12.78C150.5 723.26 329.18 843.65 512 843.65c65.46 0 130.29-16.68 190.41-44.94l-46.74-45.54C609.62 771.8 560.96 782 512 782z m450-269.91c0-5.43-0.93-9.93-1.2-10.44-0.18-2.73-1.08-7.59-1.95-10.14-0.24-0.63-0.51-1.29-0.78-1.95-0.45-1.47-0.96-2.91-1.5-4.05C873.56 303.95 694.91 182 512 182c-65.4 0-130.2 15.81-190.32 44.13l46.74 44.67C414.47 252.2 463.07 242 512 242c159.15 0 315.18 106.92 388.83 265.95 0.09 0.3 0.15 0.57 0.24 0.75 0.06 0.27 0.15 0.57 0.24 0.81 0.15 1.2 0.3 2.34 0.45 2.97-0.15 0.63-0.24 1.2-0.36 1.83-0.03 0.15-0.09 0.3-0.12 0.45-0.12 0.39-0.27 0.81-0.39 1.29-27.84 60-67.38 112.53-114.33 154.74L830 712.34c51.87-47.34 95.37-105.63 125.64-171.9 1.29-2.34 2.1-4.53 2.67-6.48 0.24-0.57 0.45-1.11 0.63-1.65 1.44-4.2 1.74-7.83 1.62-7.83 0 0 0 0.03-0.03 0.03 0.57-2.88 1.47-7.2 1.47-12.42z" p-id="2781" fill="currentColor"></path>
                    </svg>
                    </span>
                </div>
            </div>
        </div>`);

        fromEvent($openIframeContainerBtn, 'click').subscribe(() => {
            $iframeContaienr.show();
            $closeIframeContainerBtn.show();
            $openIframeContainerBtn.hide();
        });
        fromEvent($closeIframeContainerBtn, 'click').subscribe(() => {
            $iframeContaienr.hide();
            $closeIframeContainerBtn.hide();
            $openIframeContainerBtn.show();
        });
        const $btnContainer = $($('#main header').children("div:last-child").children().get(0));
        $btnContainer.append($openIframeContainerBtn.hide());
        $btnContainer.append($closeIframeContainerBtn.hide());
        const $iframeContaienr = $('#tfw_iframe_container');
        const isHidden = $iframeContaienr.css('display') === 'none';
        if (!isHidden) {
            $openIframeContainerBtn.hide();
            $closeIframeContainerBtn.show();
        } else {
            $openIframeContainerBtn.show();
            $closeIframeContainerBtn.hide();
        }
    });
}

function injectIframeContainer() {
    const $iframeContaienr = $(`<iframe width="30%" 
        height="100%" 
        id="tfw_iframe_container"
        name="tfw_iframe_container"
        frameborder='no'
        marginheight='0'
        marginwidth='0'
        allowTransparency='true'
        src="${IFRAME_URL}">
    </iframe>`);
    $iframeContaienr.hide();
    $('#app .two').append($iframeContaienr);

    $Messager.receive(MESSAGER_SENDER.POPUP, 'customPortraitPageInit').subscribe(() => {
        $iframeContaienr.show();
        PopupLoaded$.next(true);
    });
    $Messager.receive(MESSAGER_SENDER.BACKGROUND, 'getCustomPortraitFinish').subscribe(e => {
        GetCustomPortraitFinish$.next(e.message);
    });
    SendCustomPortraitResult$.subscribe(([_, e]) => $Messager.post(MESSAGER_SENDER.POPUP, 'getCustomPortraitFinish', e, IFRAME_URL, $iframeContaienr[0].contentWindow));

    SendCustomInfo$.subscribe(([_, e]) => $Messager.post(MESSAGER_SENDER.POPUP, 'getCustomInfo', e, IFRAME_URL, $iframeContaienr[0].contentWindow));
    SendCurrentFriendChange$.subscribe(([_, e]) => $Messager.post(MESSAGER_SENDER.POPUP, 'currentFriendChange', e, IFRAME_URL, $iframeContaienr[0].contentWindow));

    $Messager.receive(MESSAGER_SENDER.POPUP, 'addCustomPortrait').subscribe(({ title, message }) => {
        $Messager.send(MESSAGER_SENDER.BACKGROUND, title, message);
    });
}

function listenInjectScriptLoaded() {
    $Messager.receive(MESSAGER_SENDER.INJECTSCRIPT, 'injectScriptLoaded').subscribe(({ message }) => {
        if (message === 'content/wapi.js') InjectWAPILoaded$.next(true);
        if (message === 'content/contact.js') InjectContactLoaded$.next(true);
    });
    InjectScriptLoaded$.subscribe(() => getMe());
}

function getMe() {
    const title = 'getMe';
    $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, title);
    $Messager.receive(MESSAGER_SENDER.BACKGROUND, title)
        .subscribe(({ message: account }) => {
            console.log('get account: ' + account);
            getAllContacts();
            getAllChatIds();
            getAllMessageIds();
            listenGetContactInfos();
        });
}

function listenGetContactInfos() {
    $Messager.receive(MESSAGER_SENDER.BACKGROUND, 'getContactInfos')
        .subscribe(({ message, title }) => $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, title, message));
}

function setFriendList(data) {
    $Messager.send(MESSAGER_SENDER.BACKGROUND, 'setFriendList', data);
}

function getAllChatIds() {
    $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, 'getAllChatIds').subscribe(data => setFriendList(data));
}

function getAllContacts() {
    $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, 'getAllContacts');
}

function getAllMessageIds() {
    $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, 'getAllMessageIds');
    getAllUnSendMessages();
}

function getAllUnSendMessages() {
    const title = 'getAllUnSendMessages';
    $Messager.receive(MESSAGER_SENDER.BACKGROUND, title)
        .subscribe(({ message }) => $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, title, message));
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
    $Messager.post(MESSAGER_SENDER.INJECTSCRIPT, 'getCustomInfo', currentId).subscribe(e => GetCustomInfo$.next(e));
    $Messager.send(MESSAGER_SENDER.BACKGROUND, 'setCurrentFriend', currentId).subscribe(() => rerenderDefaultText());
    CurrentFriendChange$.next(currentId);
}

function cacheUnsentText(tText, sText) {
    $Messager.send(MESSAGER_SENDER.BACKGROUND, 'cacheUnsentText', { tText, sText });
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
            $Messager.send(MESSAGER_SENDER.BACKGROUND, 'getSupportLanguage').subscribe(languages => {
                const languageSet = handleSelectLanguages(languages).reduce((set, lg) => {
                    if (lg === buttonLg) return set;
                    const $lgTmpl = $(`<li data-lg="${lg}">${getChinese(lg)}</li>`);
                    $lgTmpl.click((e) => {
                        $Messager.send(MESSAGER_SENDER.BACKGROUND, 'setLanguageSetting', {
                            from: 'select',
                            language: $(e.target).attr('data-lg'),
                            target: buttonTarget,
                        }).subscribe(() => {
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
            $Messager.send(MESSAGER_SENDER.BACKGROUND, 'translateInput', text).subscribe(e => {
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
    Storager.get('DefaultTranslator')
        .then(({ DefaultTranslator }) => $defaultTranslator.val(DefaultTranslator));
    const defaultTranslatorChange$ = fromEvent($defaultTranslator, 'change');
    defaultTranslatorChange$.subscribe((e) => {
        $Messager.send(MESSAGER_SENDER.BACKGROUND, 'changeDefaultTranslator', e.target.value)
            .subscribe(() => {
                renderMessageList(true);
                handleInjectInputTranslateFlag();
            });
    });
}

async function handleInjectInputTranslateFlag() {
    try {
        const { LanguageSetting } = await Storager.get('LanguageSetting');
        const { tl } = LanguageSetting;
        $Messager.send(MESSAGER_SENDER.BACKGROUND, 'getSupportLanguage').subscribe((languages) => {
            if (languages.indexOf(tl) === -1) {
                $Messager.send(MESSAGER_SENDER.BACKGROUND, 'setLanguageSetting', {
                    from: 'select',
                    language: BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()],
                    target: 'tl',
                }).subscribe(() => renderMessageList());
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
    $Messager.send(MESSAGER_SENDER.BACKGROUND, 'setLanguageSetting', {
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
    $Messager.send(MESSAGER_SENDER.BACKGROUND, 'translateMessage', text)
        .subscribe(e => {
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
