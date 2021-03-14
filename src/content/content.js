import $ from 'jquery';
import './content.css';

$(() => {
  listenEnterChatPage();
  listenLeaveChatPage();

  function listenEnterChatPage() {
    const app = $('#app');
    app.bind('DOMNodeInserted', function (e) {
      const target = $(e.target);
      const id = target.attr('id');
      if (typeof id === 'string' && 'main' === id) {
        renderMessageList();
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
      <button class="translate_btn">翻译</button>
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
        $ipt.after($(`<div class="translate_flag">${s2}</div>`));
        $injectIpt.after($(`<div class="translate_flag">${tl}</div>`));
      }
    );
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes["languageSetting"]) {
        const { tl, s2 } = changes["languageSetting"].newValue;
        $ipt.next().text(s2)
        $injectIpt.next().text(tl);
        console.log($ipt.next().text(s2), $injectIpt.next().text(tl));
      }
    });
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
  }

  function defaultTranslatorChange() {
    const $defaultTranslator = $('#tfw_input_container .default_translator');
    chrome.storage.sync.get('DefaultTranslator', ({ DefaultTranslator }) => {
      $defaultTranslator.val(DefaultTranslator);
    });
    $defaultTranslator.change((e) => {
      chrome.runtime.sendMessage({ changeDefaultTranslator: e.target.value });
    });
  }

  function clickTranslateBtn() {
    const $translateBtn = $('#tfw_input_container .translate_btn');
    const injectIpt = $('footer#tfw_input_container .copyable-area .copyable-text.selectable-text');
    $translateBtn.click(() => {
      const text = injectIpt.text().trim();
      if (!text) {
        return;
      }
      chrome.runtime.sendMessage({ translateInput: text }, (e) => {
        const ipt = $('#main footer:not(#tfw_input_container) .copyable-area .copyable-text.selectable-text');
        ipt.text('');
        ipt.focus();
        document.execCommand('insertText', false, e.mainMeaning);
      });
    });
  }

  function renderMessageList() {
    const msgList = $('#main .copyable-area .focusable-list-item div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text');
    Array.from(msgList).forEach(msg => {
      injectTranslateBtn($(msg));
    });
    const $last = $(msgList[msgList.length - 1]);
    setLanguageSetting($last);
    listenMessageListChange();
  }

  function setLanguageSetting($target) {
    const text = $($target.children().get(0)).text();
    chrome.runtime.sendMessage({ setLanguageSettingByMessage: text });
  }

  function injectTranslateBtn(el) {
    let readMoreBtn = null;
    const $next = el.next();
    if ($next.attr('role') === 'button') {
      readMoreBtn = $next;
    }
    const $container = el.parent().parent();
    const $btn = $('<button id="tfw_translate_btn">翻译</button>');
    $btn.click(() => {
      if (readMoreBtn) {
        readMoreBtn.click();
        setTimeout(() => {
          handleClickTranslateBtn(el, $btn, $container);
        }, 0);
        return;
      }
      handleClickTranslateBtn(el, $btn, $container);
    });
    $container.append($btn);
    $btn.click();
  }

  function handleClickTranslateBtn(el, $btn, $container) {
    const text = $(el.children().get(0)).text();
    chrome.runtime.sendMessage({ translateMessage: text }, (e) => {
      $btn.remove();
      const $div = $('<div id="tfw_translate_result"></div>');
      $div.text(e.mainMeaning);
      $container.append($div);
    });
  }

  function listenMessageListChange() {
    const msgListContaienr = $('#main .copyable-area .focusable-list-item').parent();
    msgListContaienr.bind('DOMNodeInserted', function (e) {
      const target = $(e.target);
      const className = target.prop('className');
      if (typeof className === 'string' && className.includes('focusable-list-item')) {
        const newMsg = target.find('div.copyable-text:not(.selectable-text) span.selectable-text.copyable-text');
        if (!newMsg.length) return;
        injectTranslateBtn(newMsg);
      }
    });
  }

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const key in changes) {
      const storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. '
        + 'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue);
    }
  });
});
