import axios from 'axios';

const host = 'http://contact.cn.utools.club/scrm/';

function Api(token) {
    const http = axios.create({
        baseURL: host,
        headers: {
            "X-Access-Token": token
        }
    });
    return {
        addContactInfo(data) {
            return http.post('contact/contactsInfo/add', data)
        }
    }
}

export default Api;