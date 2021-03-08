var floatingBoll = document.querySelector('#floatingBoll');
var floatingBollW = floatingBoll.offsetWidth;
var floatingBollH = floatingBoll.offsetHeight;
var cuntW = 0;
var cuntH = 0;
floatingBoll.style.left = parseInt(Math.random() * (document.body.offsetWidth - floatingBollW)) + 'px';
floatingBoll.style.top = parseInt(Math.random() * (document.body.offsetHeight - floatingBollH)) + 'px';

function move(obj, w, h) {
    if (obj.direction === 'left') {
        obj.style.left = 0 - w + 'px';
    } else if (obj.direction === 'right') {

        obj.style.left = document.body.offsetWidth - floatingBollW + w + 'px';
    }
    if (obj.direction === 'top') {
        obj.style.top = 0 - h + 'px';
    } else if (obj.direction === 'bottom') {
        obj.style.top = document.body.offsetHeight - floatingBollH + h + 'px';
    }
}

function rate(obj, a) {
    obj.style.transform = ' rotate(' + a + ')';
}

function action(obj) {
    var dir = obj.direction;
    switch (dir) {
        case 'left':
            rate(obj, '90deg');
            break;
        case 'right':
            rate(obj, '-90deg');
            break;
        case 'top':
            rate(obj, '-180deg');
            break;
        default:
            rate(obj, '-0');
            break;
    }
}

floatingBoll.onmousedown = function (e) {
    var floatingBollL = e.clientX - floatingBoll.offsetLeft;
    var floatingBollT = e.clientY - floatingBoll.offsetTop;
    document.onmousemove = function (e) {
        cuntW = 0;
        cuntH = 0;
        floatingBoll.direction = '';
        floatingBoll.style.transition = '';
        floatingBoll.style.left = (e.clientX - floatingBollL) + 'px';
        floatingBoll.style.top = (e.clientY - floatingBollT) + 'px';
        if (e.clientX - floatingBollL < 5) {
            floatingBoll.direction = 'left';
        }
        if (e.clientY - floatingBollT < 5) {
            floatingBoll.direction = 'top';
        }
        if (e.clientX - floatingBollL > document.body.offsetWidth - floatingBollW - 5) {
            floatingBoll.direction = 'right';
        }
        if (e.clientY - floatingBollT > document.body.offsetHeight - floatingBollH - 5) {
            floatingBoll.direction = 'bottom';
        }
        move(floatingBoll, 0, 0);
    };
};
floatingBoll.onmouseover = function () {
    move(this, 0, 0);
    rate(this, 0);
};

floatingBoll.onmouseout = function () {
    move(this, floatingBollW / 2, floatingBollH / 2);
    action(this);
};

floatingBoll.onmouseup = function () {
    document.onmousemove = null;
    this.style.transition = '.5s';
    move(this, floatingBollW / 2, floatingBollH / 2);
    action(this);
};

window.onresize = function () {
    var bodyH = document.body.offsetHeight;
    var floatingBollT = floatingBoll.offsetTop;
    var bodyW = document.body.offsetWidth;
    var floatingBollL = floatingBoll.offsetLeft;

    if (floatingBollT + floatingBollH > bodyH) {
        floatingBoll.style.top = bodyH - floatingBollH + 'px';
        cuntH++;
    }
    if (bodyH > floatingBollT && cuntH > 0) {
        floatingBoll.style.top = bodyH - floatingBollH + 'px';
    }
    if (floatingBollL + floatingBollW > bodyW) {
        floatingBoll.style.left = bodyW - floatingBollW + 'px';
        cuntW++;
    }
    if (bodyW > floatingBollL && cuntW > 0) {
        floatingBoll.style.left = bodyW - floatingBollW + 'px';
    }

    move(floatingBoll, floatingBollW / 2, floatingBollH / 2);
};