const actorGeometryLibrary = require('../gfx/geometryLibrary');
const gsap = require('gsap');
const isVR = require('../util/isVR');
const ArmModel = require('../vendor/ray-input-arm-model').default;
const urlParam = require('urlparam');

function InteractiveDayDreamController(params = {}) {
	THREE.Object3D.call(this);
	this.hasGamepadsAPI = 'getGamepads' in window.navigator;

	this.camera = params.camera;
	this.rayEvents = params.rayEvents;
	this.buttonPressed = false;
}

InteractiveDayDreamController.prototype = Object.create(THREE.Object3D.prototype);

var __q = new THREE.Quaternion();

InteractiveDayDreamController.prototype.onEnterFrame = function(dt) {
	if(!this.hasGamepadsAPI) {
		return;
	}
	// Loop over every gamepad and if we find any that have a pose use it.
	var vrGamepads = [];
	var gamepads = navigator.getGamepads();
	for (var i = 0; i < gamepads.length; ++i) {
		var gamepad = gamepads[i];
		// The array may contain undefined gamepads, so check for that as
		// well as a non-null pose.
		if (gamepad) {
			if (gamepad.pose) {
				vrGamepads.push(gamepad);
			}
			if ("hapticActuators" in gamepad && gamepad.hapticActuators.length > 0) {
				for (var j = 0; j < gamepad.buttons.length; ++j) {
					if (gamepad.buttons[j].pressed) {
						// Vibrate the gamepad using to the value of the button as
						// the vibration intensity.
						gamepad.hapticActuators[0].pulse(gamepad.buttons[j].value, 100);
						break;
					}
				}
			}
		}
	}
	var detectedController = vrGamepads.length > 0 && isVR();
	if(detectedController) {
		var gamepad = vrGamepads[0];
		__q.fromArray(gamepad.pose.orientation);
		if(!this.daydreamController) {
			var daydreamController = new THREE.Mesh(
				actorGeometryLibrary.getCreator('daydreamController')(),
				new THREE.MeshLambertMaterial({
					vertexColors: THREE.VertexColors,
					color: 0xffffff,
					opacity: 0,
					transparent: true,
				})
			);
			daydreamController.visible = urlParam('showDaydreamController', false);
			gsap.to(
				daydreamController.material,
				1,
				{
					opacity: 1
				}
			);

			this.add(daydreamController);

			var armModel = new ArmModel();

			this.daydreamController = daydreamController;
			this.armModel = armModel;
		}
		var state = gamepad.buttons[0].pressed;
		if(this.buttonPressed !== state) {
			if(state) {
				this.rayEvents.dispatchOnSelect([0, 0]);
			}
			this.buttonPressed = state;
		}
	}
	if(this.daydreamController) {
		this.armModel.setControllerOrientation(__q);
		this.armModel.setHeadOrientation(this.camera.quaternion);
		this.armModel.setHeadPosition(this.camera.position);
		this.armModel.update();
		this.quaternion.copy(this.armModel.pose.orientation);
		this.position.copy(this.armModel.pose.position);
	}
}

module.exports = InteractiveDayDreamController;