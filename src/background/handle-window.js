import { URL, LOGIN_URL } from '../common/modal/';
import Storager from '../common/scripts/storage';
import { Subject } from 'rxjs';

const completed$ = new Subject();

let ISINSTALLED = false;
let WINDOWID = 0;
let TABID = 0;

function openWindows() {
  Storager.get('OpenedTabIds').then(({ OpenedTabIds }) => {
    if (OpenedTabIds == null) return createWindow();
    chrome.tabs.query({ active: true }, (tabs) => {
      const tabId = tabs.find((t) => t.id === OpenedTabIds)?.id;
      if (tabId) return chrome.tabs.remove(tabId, createWindow);
      createWindow();
    });
  });
}

function createWindow() {
  const width = screen.availWidth * 0.8;
  const height = screen.availHeight * 0.8;
  const position = {
    left: screen.availLeft + screen.availWidth / 2 - width / 2,
    top: screen.availTop + screen.availHeight / 2 - height / 2,
  };
  chrome.windows.create({
    url: LOGIN_URL,
    focused: true,
    left: Math.floor(position.left),
    top: Math.floor(position.top),
    width,
    height,
    type: 'panel',
  }, (window) => {
    ISINSTALLED = true;
    WINDOWID = window.id;
    TABID = window.tabs[0].id;
    Storager.set({ OpenedTabIds: TABID }).then(() => {
      chrome.browserAction.setIcon({
        path: {
          19: 'icons/19.png',
          38: 'icons/38.png',
        },
      });
      completed$.next({ TABID });
    });
  });
}

function focuseWindow() {
  chrome.windows.update(WINDOWID, {
    focused: true,
  });
}

function handleInstalled() {
  ISINSTALLED ? focuseWindow() : openWindows();
}

function InitWindow() {
  chrome.runtime.onInstalled.addListener(() => openWindows());

  chrome.browserAction.onClicked.addListener(() => handleInstalled());

  chrome.windows.onRemoved.addListener((windowId) => {
    if (WINDOWID !== windowId) return;
    ISINSTALLED = false;
    chrome.browserAction.setIcon({
      path: {
        19: 'icons/19_off.png',
        38: 'icons/38_off.png',
      },
    });
    Storager.set({ OpenedTabIds: null });
  });

  chrome.tabs.onUpdated.addListener((tabId, { url }, { windowId }) => {
    if (!url || url.indexOf(URL) < 0 || windowId === WINDOWID) return;
    if (ISINSTALLED) return chrome.tabs.remove(tabId, focuseWindow);
    openWindows();
  });

  return completed$;
}

export {
  InitWindow,
  TABID
};
