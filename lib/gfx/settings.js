const urlParam = require('urlparam');
const isDesktop = require('../util/isDesktop');
const isMagicWindow = require('../util/isMagicWindow');

const quadInOut = require('./utils/convertEasingFunctionToGsap')(require('eases/quad-in-out'));

var settings = {};

//this is primarily a VR project, so VR is default
var defaultValues = {
	spriteScale: 0.175 * 0.5,
	fogRatio: 0.2,
	mapSize: 16,
	drawDistance: 32,
	mapSegments: 4,
	elevation: 5,
	cursorDistanceFromCamera: 20,
	userFootHeight: 1.2,
	cameraMovementEasingFunction: Linear.easeNone,
	devicePixelRatio: Math.min(3.5, window.devicePixelRatio),
	cursorMaxHitDistance: 11,
};

var desktopValues = {
	mapSize: 32,
	mapSegments: 8,
	nameTagDistance: 10,
	cursorDistanceFromCamera: 12,
	userFootHeight: 2.4,
	cameraMovementEasingFunction: quadInOut,
};

var magicWindowValues = {
	cameraMovementEasingFunction: quadInOut,
};

//util methods and shorthand
function either(a, b) {
	return (a !== undefined) ? a : b;
}

function urlHasParam(key) {
	return urlParam(key) !== undefined;
}

// this pattern is good because isDesktop() does not resolve to the correct answer until well into the experience, so we query isDesktop just in time
// try to avoid hammering settings on every tick: cache them sensibly.
// Also, in this pattern we allow the user to override any setting with a url param

Object.keys(defaultValues).forEach(function(key) {
	var value = defaultValues[key];
	var valueDesktop = either(desktopValues[key], defaultValues[key]);
	var valueMagicWindow = either(magicWindowValues[key], defaultValues[key]);
	Object.defineProperty(settings, key, {
		get: function() {
			if(urlHasParam(key)) {
				return urlParam(key);
			}
			if(isDesktop()) {
				return valueDesktop;
			} else if(isMagicWindow()) {
				return valueMagicWindow;
			} else {
				return value;
			}
		}
	});
});

module.exports = settings;
