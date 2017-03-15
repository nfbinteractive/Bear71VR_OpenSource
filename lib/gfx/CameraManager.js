const createControls = require('orbit-controls');
const urlparam = require('urlparam');
const isMobile = require('../util/isMobile');
const isVR = require('../util/isVR');
const Blindfold = require('../gfx/Blindfold');
const manageSceneOnEnterFrameObjects = require('./utils/manageSceneOnEnterFrameObjects');
const manageSceneRayColliders = require('./utils/manageSceneRayColliders');
const defaults = require('lodash.defaults');

var __defaultParams = {
  startX: urlparam('startX', 64),
  startY: urlparam('startY', 64)
};

function manageStuff(target) {
  manageSceneRayColliders(target);
  manageSceneOnEnterFrameObjects(target);
}

function CameraManager (params) {
  params = defaults(params || {}, __defaultParams);
  // 3D camera looking
  const camera = new THREE.PerspectiveCamera(60, 1, 0.001, 100);
  const cameraBody = new THREE.Object3D();
  manageStuff(cameraBody);
  const cameraFootstool = new THREE.Object3D();
  manageStuff(cameraFootstool);
  const cameraFootstoolContainer = new THREE.Object3D();
  manageStuff(cameraFootstoolContainer);
  cameraFootstool.position.y = params.userFootHeight || 0;
  cameraBody.position.set(params.startX, 0, params.startY);
  cameraBody.add(cameraFootstool);
  cameraFootstool.add(camera);
  cameraFootstool.add(cameraFootstoolContainer);
  cameraFootstool.contentContainer = cameraFootstoolContainer;
  const blindfold = new Blindfold();
  camera.add(blindfold);
  camera.blindfold = blindfold;

  this.camera = camera;
  this.cameraBody = cameraBody;
  this.cameraFootstool = cameraFootstool;
  this.lastCameraQuaternion = camera.quaternion.clone();
  this.deltaQuaternion = new THREE.Quaternion();
  _changeCameraControls.call(this);
}

CameraManager.prototype = {
  getUserHeight,
  isUserLookingDown,
  update,
  setVideoElement,
  resize
};

const __targetVec3 = new THREE.Vector3();
var __phiBounds = {
  intro: [Math.PI * 0.5, Math.PI * 0.5],
  tight: [Math.PI * 0.2, Math.PI * 0.3],
  loose: [Math.PI * 0.25, Math.PI * 0.75]
}

function _getVRControls() {
  if(!this.vrControls) {
    this.vrControls = new THREE.VRControls(this.camera);
    this.vrControls.standing = true;
  }
  return this.vrControls;
}

function _getOrbitControls() {
  if(!this.orbitControls) {
    this.orbitControls = createControls({
      distance: 0,
      zoom: false,
      pinch: false,
      rotateSpeed: -0.1,
      phiBounds: __phiBounds.loose,
    });
  }
  return this.orbitControls;
}

function _changeCameraControls(vr) {
  if(this.vr === vr) return;
  this.vr = vr;
  if(this.cameraControls && this.cameraControls.disable) {
    this.cameraControls.disable();
  }
  if (vr) {
    // Apply VR headset positional data to camera.
    this.cameraControls = _getVRControls.call(this);
  } else {
    // 3D orbit controller with damping
    this.cameraControls = _getOrbitControls.call(this);
  }
  if(this.cameraControls && this.cameraControls.enable) {
    this.cameraControls.enable();
  }
}

function getUserHeight () {
  if(!this.pastIntro && !this.vr) {
    return -0.1;
  } else {
    return this.vr ? this.cameraControls.userHeight : 1.6;
  }
}

function isUserLookingDown () {
  if(!this.cameraControls) return false;
  return this.cameraControls.phiBounds === __phiBounds.tight;
}

function update (dt) {
  _changeCameraControls.call(this, isVR());
  this.cameraControls.update();
  if (!this.vr) {
    // update orbit controls
    if(this.videoElement){
      if(this.pastIntro && this.videoElement.currentTime < 55) {
        this.pastIntro = false;
        this.cameraControls.phiBounds = __phiBounds.intro;
      } else if(!this.pastIntro && this.videoElement.currentTime > 55) {
        this.pastIntro = true;
        this.cameraControls.phiBounds = isMobile() ? __phiBounds.loose : __phiBounds.tight;
      }
    }
    this.camera.position.fromArray(this.cameraControls.position);
    this.camera.up.fromArray(this.cameraControls.up);
    __targetVec3.fromArray(this.cameraControls.direction);
    this.camera.lookAt(__targetVec3);
    this.camera.position.y += this.getUserHeight();
    this.deltaQuaternion.copy(this.camera.quaternion);
    this.deltaQuaternion.inverse();
    this.deltaQuaternion.multiply(this.lastCameraQuaternion);
    this.lastCameraQuaternion.copy(this.camera.quaternion);
  }
}

function setVideoElement (videoElement) {
  this.videoElement = videoElement;
}

function resize (width, height) {
  const aspect = width / height;

  // Update camera matrices
  this.camera.aspect = aspect;
  this.camera.updateProjectionMatrix();
}

module.exports = CameraManager;