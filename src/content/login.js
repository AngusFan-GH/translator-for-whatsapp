import Messager from '../common/scripts/messager';
import { LOCAL_TOKEN_NAME, MESSAGER_SENDER } from '../common/modal/';

const $Messager = new Messager(MESSAGER_SENDER.CONTENT);

$Messager.receive(MESSAGER_SENDER.BACKGROUND, 'getAccessToken').subscribe(({ id, title, from: to }) => {
    let token = localStorage.getItem(LOCAL_TOKEN_NAME);
    token &&= JSON.parse(token);
    $Messager.replay(id).send(to, title, token);
});