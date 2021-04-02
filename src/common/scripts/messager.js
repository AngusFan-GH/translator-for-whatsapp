import { Subject } from 'rxjs';

const TARGET_LIST = [
    'background',
    'webpage',
    'content',
    'option',
    'popup'
];

const Sub = new Subject();
chrome.runtime.onMessage.addListener((request, sender, response) => {

});

class Messager {

    constructor(from) {
        this.from = from;
    }

    static send(target, message) {
        console.log('send', target, message);
        switch (target) {
            case 'background':
                return new Promise((res, rej) => {
                    if (this.from !== 'popup') {
                        // chrome.runtime.sendMessage();
                    } else {
                        // chrome.extension.getBackgroundPage()
                    }
                });
            case 'webpage':
                break;
            case 'content':
                break;
            case 'option':
                break;
            case 'popup':
                break;
        }

    }

    static listener(target, message) {
        console.log('listener', target, message);
        switch (target) {
            case 'background':
                break;
            case 'webpage':
                break;
            case 'content':
                break;
            case 'option':
                break;
            case 'popup':
                break;
        }
    }
}

export default Messager;