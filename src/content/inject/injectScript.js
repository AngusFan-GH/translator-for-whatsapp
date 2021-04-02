import { injectScript } from '../../common/scripts/util';

function injectExtensionId() {
  const extensionId = chrome.runtime.id;
  injectScript({ code: `window.extensionId = '${extensionId}'` });
}

function injectWAPIMakerScript() {
  injectScript({ file: 'content/wapi.js' });
}

function injectContactScript() {
  injectScript({ file: 'content/contact.js' });
}

function injectScriptToPage() {
  injectExtensionId();
  injectWAPIMakerScript();
  injectContactScript();
}

export {
  injectScriptToPage
};
