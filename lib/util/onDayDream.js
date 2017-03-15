var __callbacksActive = [];
var __callbacksSleeping = [];

var __activated = false;

function __triggerAndMove(fromArr, toArr) {
	for (var i = 0; i < fromArr.length; i++) {
		fromArr[i](__activated);
		toArr.push(fromArr[i]);
	}
	fromArr.length = 0;
}

function __onVRDisplayPresentChange(ev) {
	var display = ev.detail && ev.detail.display || ev.display;
	var isDayDream = display.displayName.toLowerCase().indexOf('dream') !== -1;
	var state = display.isPresenting;
	if(isDayDream && state !== __activated) {
		__activated = state;
		if(state) {
			__triggerAndMove(__callbacksSleeping, __callbacksActive);
		} else {
			__triggerAndMove(__callbacksActive, __callbacksSleeping);
		}
	}
}

window.addEventListener('vrdisplaypresentchange', __onVRDisplayPresentChange, false);

function onDayDream(callback) {
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

onDayDream.remove = remove;

module.exports = onDayDream;