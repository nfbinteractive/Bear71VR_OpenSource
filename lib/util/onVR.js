var urlparam = require('urlparam');

var __callbacksActive = [];
var __callbacksSleeping = [];

var __activated = false;

function __triggerAndMove(fromArr, toArr) {
	for (var i = 0; i < fromArr.length; i++) {
		toArr.push(fromArr[i]);
		fromArr[i](__activated);
	}
	fromArr.length = 0;
}

function __onVRDisplayPresentChange(ev) {
	var display = ev.detail && ev.detail.display || ev.display;
	var state = display.isPresenting;
	if(state !== __activated) {
		__activated = state;
		if(state) {
			__triggerAndMove(__callbacksSleeping, __callbacksActive);
		} else {
			__triggerAndMove(__callbacksActive, __callbacksSleeping);
		}
	}
}

window.addEventListener('vrdisplaypresentchange', __onVRDisplayPresentChange, false);

function onVR(callback) {
	callback(__activated);
	if(__activated) {
		__callbacksActive.push(callback);
	} else {
		__callbacksSleeping.push(callback);
	}
}

function __removeIfHas(arr, callback) {
	var index = arr.indexOf(callback);
	if(index !== -1) {
		arr.splice(index, 1);
	}
}

function remove(callback) {
	__removeIfHas(__callbacksActive, callback);
	__removeIfHas(__callbacksSleeping, callback);
}

onVR.remove = remove;

module.exports = onVR;


if (urlparam('fakeVR', false)) {
	setTimeout(function() {
		__onVRDisplayPresentChange({
			display: {
				isPresenting: true
			}
		});
	}, 2000);
}
