var decorateMethodAfter = require('./decorateMethodAfter');
var manageSceneRayColliders = require('./manageSceneRayColliders');

var __decorated = [];

function manageSceneRayCollisions(scene, rayEvents) {
	if(__decorated.indexOf(scene) !== -1) {
		throw new Error('Cannot decorate target twice.');
	}
	__decorated.push(scene);
	manageSceneRayColliders(scene);
	var colliders = scene.getColliders();
	var raycaster = new THREE.Raycaster();
	var rayCoord = new THREE.Vector2();
	var ray = raycaster.ray;
	var lastFocusedObject = null;

	rayEvents.addOnMove(_onMoveOrDrag);
	rayEvents.addOnDrag(_onMoveOrDrag);
	rayEvents.addOnSelect(_onSelect);

	function onEnterFrameUpdateRay(dt) {
		var focusedObject = _getObjectUnderRay();
		if(focusedObject !== lastFocusedObject) {
			if(lastFocusedObject) {
				lastFocusedObject.onOut();
			}
			if(focusedObject) {
				focusedObject.onOver();
			}
			lastFocusedObject = focusedObject;
		}
	}
	decorateMethodAfter(scene, 'onEnterFrame', onEnterFrameUpdateRay);


	function _getObjectUnderRay() {
		ray.origin.set(0, 0, 0);
		var camera = scene.camera;
		camera.localToWorld(ray.origin);
		raycaster.setFromCamera(rayCoord, camera);
		if(camera instanceof THREE.OrthographicCamera) {
			ray.origin.z = camera.far;
		}
		var hit = raycaster.intersectObjects(colliders)[0];
		var focusedObject = hit ? hit.object : null;
		if(focusedObject && focusedObject.collisionOwner) {
			focusedObject = focusedObject.collisionOwner;
		}
		return focusedObject;
	}

	function _onMoveOrDrag(pos) {
		rayCoord.x = pos[0];
		rayCoord.y = pos[1];
	}

	function _onSelect(pos) {
		_onMoveOrDrag(pos);
		var hit = _getObjectUnderRay();
		if(hit && hit.onSelect) {
			hit.onSelect();
		}
	}


}

module.exports = manageSceneRayCollisions;