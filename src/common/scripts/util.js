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
      }
    };
  }
  document.body.appendChild(script);
  return true;
}

export {
  deepCopy,
  injectScript,
};
