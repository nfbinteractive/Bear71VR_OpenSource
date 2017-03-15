function decorateMethodAfter(object, key, work) {
	var oldMethod = object[key];
	function newMethod() {
		var result = oldMethod.apply(this, arguments);
		work.apply(this, arguments);
		return result;
	}
	object[key] = newMethod;
}

module.exports = decorateMethodAfter;
