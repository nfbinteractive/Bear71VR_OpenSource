var decorateMethodAfter = require('./decorateMethodAfter');

function manageSceneOnEnterFrameObjects(scene) {
	var objectsWithOnEnterFrame = [];
	decorateMethodAfter(scene, 'add', function(item) {
		if(item.onEnterFrame && objectsWithOnEnterFrame.indexOf(item) === -1) {
			objectsWithOnEnterFrame.push(item);
		}
	});
	decorateMethodAfter(scene, 'remove', function(item) {
		var index = objectsWithOnEnterFrame.indexOf(item);
		if(index !== -1) {
			objectsWithOnEnterFrame.splice(index, 1);
		}
	});
	function onEnterFrame(dt) {
		for (var i = objectsWithOnEnterFrame.length - 1; i >= 0; i--) {
			objectsWithOnEnterFrame[i].onEnterFrame(dt);
		}
	}
	scene.onEnterFrame = onEnterFrame;
}

module.exports = manageSceneOnEnterFrameObjects;