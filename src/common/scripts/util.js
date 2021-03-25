function deepCopy(target) {
    let result = Object.create(target.constructor.prototype);
    if (!target instanceof Object) {
        return result = target;
    }
    for (const k in target) {
        const item = target[k];
        if (item instanceof Object) {
            result[k] = deepCopy(item);
            continue;
        }
        result[k] = item;
    }
    return result;
}

export {
    deepCopy
}