var decorateMethodAfter = require('./decorateMethodAfter');
var decorateMethodBefore = require('./decorateMethodBefore');

var __decorated = [];

function manageSceneRayColliders(target) {
	if(__decorated.indexOf(target) !== -1) {
		throw new Error('Cannot decorate target twice.');
	}
	__decorated.push(target);

	var objectsWithGetColliders = [];
	var colliders = [];

	function add(item) {
		if(item.getColliders && objectsWithGetColliders.indexOf(item) === -1) {
			objectsWithGetColliders.push(item);
			var colliders = item.getColliders();
			if(colliders instanceof Array) {
				target.addColliders(colliders);
			} else if(colliders) {
				target.addCollider(colliders);
			} else {
				throw new Error('No collider!');
			}
		}
	}

	decorateMethodAfter(target, 'add', add);

	function remove(item) {
		var index = objectsWithGetColliders.indexOf(item);
		if(index !== -1) {
			var item = objectsWithGetColliders.splice(index, 1)[0];
			var colliders = item.getColliders();
			if(colliders instanceof Array) {
				target.removeColliders(colliders);
			} else if(colliders) {
				target.removeCollider(colliders);
			} else {
				throw new Error('No collider!');
			}
		}
	}
	decorateMethodBefore(target, 'remove', remove);

	function _addCollider(collider) {
		if(!collider) {
			throw new Error('collider must be a Mesh.');
		}
		if(colliders.indexOf(collider) === -1) {
			colliders.push(collider);
			if(parent.addCollider) {
				parent.addCollider(collider);
			}
		}
	}

	function _removeCollider(collider) {
		const index = colliders.indexOf(collider);
		if (index !== -1) {
			colliders.splice(index, 1);
			if(parent.removeCollider) {
				parent.removeCollider(collider);
			}
		}
	}

	function _addColliders(colliders) {
		colliders.forEach(_addCollider);
	}

	function _removeColliders(colliders) {
		colliders.forEach(_removeCollider);
	}

	function _getColliders() {
		return colliders;
	}

	target.addCollider = _addCollider;
	target.removeCollider = _removeCollider;
	target.addColliders = _addColliders;
	target.removeColliders = _removeColliders;
	target.getColliders = _getColliders;

}

module.exports = manageSceneRayColliders;