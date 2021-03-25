import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

const Sub = new Subject();
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        Sub.next(changes);
    }
});
const Subs = {};
class Storager {

    static set(keys) {
        return new Promise((resolve, reject) => chrome.storage.sync.set(keys, () => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve();
        }));
    }

    static get(keys) {
        return new Promise((resolve, reject) => chrome.storage.sync.get(keys, (items) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve(items);
        }));
    }

    static update(key, detail) {
        return new Promise(async (resolve, reject) => {
            try {
                const oldData = await Storager.get(key);
                const newData = Object.assign(oldData, detail);
                Storager.set(deepCopy(newData))
                    .then(() => resolve())
                    .catch(err => reject(err));
            } catch (err) {
                reject(err);
            }
        });
    }

    static remove(keys) {
        return new Promise((resolve, reject) => chrome.storage.sync.remove(keys, () => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve();
        }));
    }

    static clear() {
        return new Promise((resolve, reject) => chrome.storage.sync.clear(() => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve();
        }));
    }

    static onChanged(key) {
        if (!Subs[key]) {
            Subs[key] = Sub.pipe(
                filter(_ => _[key]),
                map(_ => _[key])
            );
        }
        return Subs[key];
    }
}

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

export default Storager;
