const isVR = require('./isVR');
const isMobile = require('./isMobile');
module.exports = function isDesktop () {
	return !isVR() && isMobile();
};