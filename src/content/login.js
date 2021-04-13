import Messager from '../common/scripts/messager';

Messager.receive('content', 'getAccessToken').subscribe(({ response }) => {
    let token = localStorage.getItem('pro__Access-Token');
    token &&= JSON.parse(token);
    response(token);
});