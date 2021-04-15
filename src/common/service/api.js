import axios from 'axios';
import { LOCAL_TOKEN_NAME, LOGIN_URL } from '../modal/';
import { TABID } from '../../background/handle-window';

const HOST = 'http://contact.cn.utools.club/scrm/';
let HANDLED = false;

const instance = axios.create({
    baseURL: HOST,
    timeout: 20000
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
        if (response?.status === 200) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(response);
        }
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
                case 502:
                    console.error('服务器错误。');
                    backToLogin();
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
        return null;
        return instance.post('contact/contactsInfo/add', data);
    }
}

export default ApiService;