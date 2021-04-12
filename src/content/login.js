import Messager from '../common/scripts/messager';
import { URL } from '../common/modal/';
Messager.receive('content', 'getAccessToken').subscribe(({ response }) => {
    let token = localStorage.getItem('pro__Access-Token');
    token &&= JSON.parse(token);
    response(token);
    location.href = URL;
});