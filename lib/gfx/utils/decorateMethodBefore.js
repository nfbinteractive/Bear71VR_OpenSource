function decorateMethod(object, methodName, additionalFunctionality) {
    var oldMethod = object[methodName];
    if(!oldMethod) throw new Error('There is no method here to decorate.');
    var newMethod = function() {
        additionalFunctionality.apply(this, arguments);
        return oldMethod.apply(object, arguments);
    }
    object[methodName] = newMethod;
    return {
        object: object,
        methodName: methodName,
        originalMethod: oldMethod
    };
}

module.exports = decorateMethod;
