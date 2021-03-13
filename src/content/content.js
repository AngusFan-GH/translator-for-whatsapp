import $ from 'jquery';
import './content.css';

$(() => {
  chrome.storage.sync.get(['isOpenedPanel'], ({ isOpenedPanel }) => {
    initInjectPage(isOpenedPanel);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const key in changes) {
      const storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. '
        + 'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue);
      if (key === 'isOpenedPanel') {
        $('#tfw_move_page').toggle(storageChange.newValue);
      }
    }
  });

  function initInjectPage(isOpenedPanel) {
    const page = $('<div id="tfw_move_page"></div>');
    const content = $(`
            <h3 id="tfw_move_title">Translator</h3>
            <div class="content">
                <div>
                    <p>原文</p>
                    <textarea class="original_text" cols="30" rows="10"></textarea>
                    <button class="translate">翻译</button>
                </div>
                <div>
                    <p>译文</p>
                    <textarea class="translated_text" cols="30" rows="10"></textarea>
                    <button class="send">发送</button>
                </div>
            </div>
        `);
    page.append(content);
    $('body').append(page);
    page.toggle(isOpenedPanel);
    // 拖拽
    drag(tfw_move_title, tfw_move_page);

    const translateBtn = $('#tfw_move_page .content .translate');
    const sendBtn = $('#tfw_move_page .content .send');
    const originalText = $('#tfw_move_page .content .original_text');
    const translatedText = $('#tfw_move_page .content .translated_text');

    translateBtn.click(() => {
      console.log('originalText', originalText.val());
      chrome.runtime.sendMessage({ translateIt: originalText.val() }, (e) => {
        console.log(e);
        translatedText.val(e);
      });
    });
    sendBtn.click(() => {
      console.log('translatedText', translatedText.val());
    });
  }

  function drag(ele, container) {
    let oldX; let oldY; let newX; let
      newY;
    ele.onmousedown = function (e) {
      if (!container.style.right && !container.style.bottom) {
        container.style.right = 0;
        container.style.bottom = 0;
      }
      oldX = e.clientX;
      oldY = e.clientY;
      document.onmousemove = function (e) {
        newX = e.clientX;
        newY = e.clientY;
        container.style.right = `${parseInt(container.style.right) - newX + oldX}px`;
        container.style.bottom = `${parseInt(container.style.bottom) - newY + oldY}px`;
        oldX = newX;
        oldY = newY;
      };
      document.onmouseup = function () {
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }
});
