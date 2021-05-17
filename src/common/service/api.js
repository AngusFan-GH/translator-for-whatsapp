import axios from 'axios';

const HOST = 'http://contact.cn.utools.club/scrm/';
const FILE_HOST = 'http://scrm-upload.cn.utools.club/';

const instance = axios.create({
    baseURL: HOST
});

instance.interceptors.request.use(
    config => {
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

class ApiService {
    static checkSelfAccount(data) {
        return instance.post('account/accountResource/check-account', data);
    }
    static addSelfAccountInfos(data) {
        return instance.post('account/accountResource/add-list', data);
    }
    static addMessageInfo(data) {
        return instance.post('contact/contactsInfo/add', data);
    }
    static addMessageInfoList(data) {
        return instance.post('contact/contactsInfo/add-list', data);
    }
    static getUnSentMessageIds(data) {
        return instance.post('contact/contactsInfo/checkPluginClientContactId', data);
    }
    static addAccountInfoList(data) {
        return instance.post('customResource/customResource/add-list', data);
    }
    static checkAccount(data) {
        return instance.post('customResource/customResource/check-account', data);
    }
    static uploadFile(data) {
        const formData = new FormData();
        formData.append("file", data);
        return instance.post('group1/upload', formData, {
            baseURL: FILE_HOST
        });
    }
    static getCustomPortraitByAccount(data) {
        return instance.get('portrait/customPortrait/queryByAccount', {
            params: data
        });
    }
    static addCustomPortrait(data) {
        return instance.post('portrait/customPortrait/add', data);
    }
}

export default ApiService;