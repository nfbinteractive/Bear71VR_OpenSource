var onVR = require('./onVR');

var __state = false;
onVR(function(state) {
	__state = state;
});

function isVR() {
	return __state;
}

module.exports = isVR;