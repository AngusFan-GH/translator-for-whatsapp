import $ from 'jquery';
import './content.css';
import { TRANSLATIO_NDISPLAY_MODE, LANGUAGES_TO_CHINESE } from '../common/scripts/modal';
import { LANGUAGES } from '../common/scripts/languages';

$(async () => {
  let TranslationDisplayMode = 1;
  listenEnterChatPage();
  listenLeaveChatPage();

  function listenEnterChatPage() {
    const app = $('#app');
    app.bind('DOMNodeInserted', function (e) {
      const target = $(e.target);
      const id = target.attr('id');
      if (typeof id === 'string' && 'main' === id) {
        renderMessageList();
        listenMessageListChange();
        injectInputContainer();
      }
    });
  }

  function listenLeaveChatPage() {
    const app = $('#app');
    app.bind('DOMNodeRemoved', function (e) {
      const target = $(e.target);
      const id = target.attr('id');
      if (typeof id === 'string' && 'main' === id) {
      }
    });
  }

  function injectInputContainer() {
    const $footer = $('#main footer').clone().attr('id', 'tfw_input_container');
    const $copyableArea = $($footer.children('.copyable-area').get(0));
    const $selectContainer = $($copyableArea.children('div').get(0));
    $selectContainer.html($(`
      <select class="default_translator">
        <option value="GoogleTranslate">谷歌翻译</option>
        <option value="BingTranslate">必应翻译</option>
        <option value="BaiduTranslate">百度翻译</option>
      </select>
    `));
    const $textArea = $($copyableArea.children('div').get(1)).addClass('translate_area');
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
  }

  function addTranslateFlag() {
    const $ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
    const $injectIpt = $($('#tfw_input_container .translate_area > div').children('div').get(1));
    chrome.storage.sync.get(
      'languageSetting',
      ({ languageSetting }) => {
        const { tl, s2 } = languageSetting;
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        $ipt.after($(`<div class="translate_flag">${getChinese(s2)}</div>`));
        $injectIpt.after($(`<div class="translate_flag">${getChinese(tl)}</div>`));
      }
    );
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes["languageSetting"]) {
        const { tl, s2 } = changes["languageSetting"].newValue;
        $ipt.next().text(getChinese(s2));
        $injectIpt.next().text(getChinese(tl));
      }
    });
  }

  function getChinese(code) {
    return LANGUAGES_TO_CHINESE[LANGUAGES[code] || code] || code;
  }

  function listenInputValueChange() {
    const $area = $('#tfw_input_container .translate_area > div');
    const $placeholder = $($area.children('div').get(0)).text('输入需要翻译的消息');
    const $input = $($area.children('div').get(1));
    $input.bind('DOMSubtreeModified', (e) => {
      if (e.target.innerText.trim()) {
        $placeholder.hide();
      } else {
        $placeholder.show();
        e.target.innerText = '';
      }
    });
    $input.keydown((e) => {
      if (e.keyCode === 13) {
        const text = e.target.innerText.trim();
        if (!text) return;
        setTimeout(() => $placeholder.hide(), 0);
        chrome.runtime.sendMessage({ translateInput: text }, (e) => {
          const ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
          ipt.text('');
          ipt.focus();
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

  function setCaret(el) {
    el.focus();
    if ($.support.msie) {
      const range = document.selection.createRange();
      range.moveToElementText(el);
      range.select();
      document.selection.empty(); //取消选中
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
    chrome.storage.sync.get('DefaultTranslator', ({ DefaultTranslator }) => {
      $defaultTranslator.val(DefaultTranslator);
    });
    $defaultTranslator.change((e) => {
      chrome.runtime.sendMessage({ changeDefaultTranslator: e.target.value }, () => {
        renderMessageList();
      });
    });
  }

  function clickTranslateBtn() {
    const $translateBtn = $('#tfw_input_container .translate_btn');
    $translateBtn.click(() => {
      if (++TranslationDisplayMode >= TRANSLATIO_NDISPLAY_MODE.length) {
        TranslationDisplayMode = 0;
      }
      $translateBtn.text(TRANSLATIO_NDISPLAY_MODE[TranslationDisplayMode]);
      renderMessageList();
    });
  }

  function renderMessageList() {
    const $msgList = $('#main .copyable-area .focusable-list-item div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text');
    const $last = $msgList.last();
    setLanguageSetting($last);

    switch (TranslationDisplayMode) {
      case 1:
        Array.from($msgList).reverse().forEach(msg => renderTranslateResult($(msg), true));
        break;
      case 2:
        $('#main .tfw_translate_result').show();
        Array.from($msgList).reverse().forEach(msg => renderTranslateResult($(msg)));
        break;
      default:
        $msgList.parent().show();
        $('#main .tfw_translate_result').hide();
        break;
    }

  }

  function setLanguageSetting($target) {
    const text = $($target.children().get(0)).text();
    chrome.runtime.sendMessage({ setLanguageSettingByMessage: text });
  }

  function renderTranslateResult($el, isHideSource = false) {
    const $resultContainer = $el.parent().next();
    if ($resultContainer && $resultContainer.css('display') === 'none') {
      $resultContainer.show();
      handleToggleSourceText($el, isHideSource);
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
      }
      $div.text(e.mainMeaning);
      $container.append($div);
      handleToggleSourceText($el, isHideSource);
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
    const msgListContaienr = $('#main .copyable-area .focusable-list-item').parent();
    msgListContaienr.bind('DOMNodeInserted', function (e) {
      const target = $(e.target);
      const className = target.prop('className');
      if (typeof className === 'string' && className.includes('focusable-list-item')) {
        const $newMsg = target.find('div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text');
        if (!$newMsg.length) return;
        switch (TranslationDisplayMode) {
          case 1:
            renderTranslateResult($newMsg, true);
            break;
          case 2:
            renderTranslateResult($newMsg);
            break;
        }
      }
    });
  }
});
