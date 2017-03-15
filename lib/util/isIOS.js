const MobileDetect = require('mobile-detect');
const mobileDetect = new MobileDetect(window.navigator.userAgent);

function isIOS() {
	return mobileDetect.is('iOS');
}

module.exports = isIOS;