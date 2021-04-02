import { injectScript } from '../common/scripts/util';

function injectExtensionId() {
  const extensionId = chrome.runtime.id;
  injectScript({ code: `window.extensionId = '${extensionId}'` });
}

function injectWAPIMakerScript() {
  injectScript({ file: 'common/wapi.js' });
}

function injectScriptToPage() {
  injectExtensionId();
  injectWAPIMakerScript();
}

export {
  injectScriptToPage,
};
