import { MESSAGER_SENDER } from '../modal';

function deepCopy(target) {
  let result = Object.create(target.constructor.prototype);
  if (!target instanceof Object) {
    return result = target;
  }
  for (const k in target) {
    const item = target[k];
    if (item instanceof Object) {
      result[k] = deepCopy(item);
      continue;
    }
    result[k] = item;
  }
  return result;
}

function injectScript({ code, file, isFromExtension }) {
  if (!code && !file) return false;
  const script = document.createElement('script');
  script.type = 'text/javascript';
  if (code && typeof code === 'string') {
    script.innerHTML = code;
    setTimeout(() => script.remove());
  } else if (file && typeof file === 'string') {
    isFromExtension = isFromExtension === undefined ? true : isFromExtension;
    script.src = isFromExtension ? chrome.extension.getURL(file) : file;
    script.onload = script.onreadystatechange = function () {
      if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
        script.onload = script.onreadystatechange = null;
        script.remove();
        postToExtension(MESSAGER_SENDER.CONTENT, 'injectScriptLoaded', file);
      }
    };
  }
  document.body.appendChild(script);
  return true;
}

function sendToExtension(to, title, message) {
  const id = uuid();
  const data = JSON.stringify({ id, from: MESSAGER_SENDER.INJECTSCRIPT, to, title, message });
  chrome.runtime.sendMessage(window.extensionId, data);
}

function postToExtension(to, title, message, id) {
  id = id || uuid();
  const data = JSON.stringify({ id, from: MESSAGER_SENDER.INJECTSCRIPT, to, title, message });
  window.postMessage(data);
}

function base64ToFile(b64Data, filename) {
  if (!b64Data) return null;
  const arr = b64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

function uuid(len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}

export {
  deepCopy,
  injectScript,
  sendToExtension,
  postToExtension,
  base64ToFile,
  uuid
};
