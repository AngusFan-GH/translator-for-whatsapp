import axios from 'axios';
import { LOCAL_TOKEN_NAME, LOGIN_URL } from '../modal/';
import { TABID } from '../../background/handle-window';

const HOST = 'http://contact.cn.utools.club/scrm/';
const FILE_HOST = 'http://scrm-upload.cn.utools.club/';

let HANDLED = false;

const instance = axios.create({
    baseURL: HOST
});

instance.interceptors.request.use(
    config => {
        const token = window.localStorage.getItem(LOCAL_TOKEN_NAME);
        token && (config.headers['X-Access-Token'] = token);
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    response => {
        const { status, data, config } = response;
        if (config.url === 'group1/upload') {
            return Promise.resolve(data);
        }
        return status !== 200 || data?.code !== 200 ?
            Promise.reject(response) :
            Promise.resolve(data);
    },
    error => {
        if (error?.response?.status) {
            switch (error.response.status) {
                case 401:
                    console.error('身份验证失败，请关闭重新进入。');
                    break;
                case 403:
                    console.error('登录过期，请关闭重新进入。');
                    break;
                case 404:
                    console.error('您访问的网页不存在。');
                    break;
                case 500:
                    console.error('服务器错误500。');
                    backToLogin();
                case 502:
                    console.error('服务器错误502。');
                    const config = error.config;
                    config.__retryCount = config.__retryCount || 0;
                    if (config.__retryCount >= 3) {
                        return Promise.reject(err);
                    }
                    config.__retryCount += 1;
                    setTimeout(() => instance.request(error.config), 300);
                    break;
                default:
                    console.error(error.response.data.message);
            }
            return Promise.reject(error.response);
        }
    }
);

function backToLogin() {
    if (HANDLED) return;
    HANDLED = true;
    localStorage.removeItem(LOCAL_TOKEN_NAME);
    chrome.tabs.update(TABID, {
        url: LOGIN_URL
    });
}

class ApiService {
    static addContactInfo(data) {
        // return console.log('contact/contactsInfo/add', data), Promise.resolve(data);
        return instance.post('contact/contactsInfo/add', data);
    }
    static addContactInfoList(data) {
        // return console.log('contact/contactsInfo/add-list', data), Promise.resolve(data);
        return instance.post('contact/contactsInfo/add-list', data);
    }
    static getUnSentMessageIds(data) {
        // return console.log('contact/contactsInfo/checkPluginClientContactId', data), Promise.resolve(data);
        return instance.post('contact/contactsInfo/checkPluginClientContactId', data);
    }
    static addAccountInfoList(data) {
        // return console.log('contact/contactsInfo/checkPluginClientContactId', data), Promise.resolve(data);
        return instance.post('customResource/customResource/add-list', data);
    }
    static checkAccount(data) {
        // return console.log('contact/contactsInfo/checkPluginClientContactId', data), Promise.resolve(data);
        return instance.post('customResource/customResource/check-account', data);
    }
    static uploadFile(data) {
        // return console.log(this.FILE_HOST + 'group1/upload', data), Promise.resolve(data);
        const formData = new FormData();
        formData.append("file", data);
        return instance.post('group1/upload', formData, {
            baseURL: FILE_HOST
        });
    }
}

export default ApiService;