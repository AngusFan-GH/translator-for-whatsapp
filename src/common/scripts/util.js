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
        postToExtension('content', 'injectScriptLoaded', file);
      }
    };
  }
  document.body.appendChild(script);
  return true;
}

function sendToExtension(to, title, message, response) {
  let data = JSON.stringify({ to, title, message });
  chrome.runtime.sendMessage(window.extensionId, data, e => {
    if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
    response && response(e);
  });
}

function postToExtension(to, title, message) {
  let data = JSON.stringify({ to, title, message });
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

export {
  deepCopy,
  injectScript,
  sendToExtension,
  postToExtension,
  base64ToFile
};
