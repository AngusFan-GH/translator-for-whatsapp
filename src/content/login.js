import Messager from '../common/scripts/messager';
import { LOCAL_TOKEN_NAME } from '../common/modal/';

Messager.receive('content', 'getAccessToken').subscribe(({ response }) => {
    let token = localStorage.getItem(LOCAL_TOKEN_NAME);
    token &&= JSON.parse(token);
    response(token);
});