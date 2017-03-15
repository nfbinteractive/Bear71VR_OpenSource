const THREE = require('three');
const defaults = require('lodash.defaults');

const RipplePointCloud = require('./RipplePointCloud');

const colors = {
  gray: new THREE.Color(0x7f7f7f),
  black: new THREE.Color(0x000000)
};

const defaultParams = {
  map: null,
  renderer: null,
  size: 1024,
  imageOptions: {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    format: THREE.RGBFormat,
    flipY: false
    // type: THREE.FloatType
    // type: THREE.HalfFloatType
  }
};

function RippleMap(params) {
  params = defaults(params, defaultParams);
  var scene = new THREE.Scene();
  var ripplePointCloud = new RipplePointCloud(params);
  scene.add(ripplePointCloud);

  var camera = new THREE.OrthographicCamera(0, 128, 128, 0, 32, -32);
  scene.add(camera);
  THREE.WebGLRenderTarget.call(this, params.size, params.size, params.imageOptions);
  this.texture.generateMipmaps = false;


  this.ripplePointCloud = ripplePointCloud;
  this.ripplers = [];
  this.renderer = params.renderer;
  this.camera = camera;
  this.scene = scene;
  var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1, 1), 
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.05,
      color: new THREE.Color(0.5, 0.5, 0.5),
      side: THREE.DoubleSide
    })
  );
  plane.scale.set(128, 128, 128);
  plane.position.set(64, 64, 6);
  scene.add(plane);
  this.testTime = 0;
  this.onEnterFrame = this.onEnterFrameInitial;
}

RippleMap.prototype = Object.create(THREE.WebGLRenderTarget.prototype);

RippleMap.prototype.onEnterFrameInitial = function(dt) {
  this.renderer.setClearColor(colors.gray, 1);
  this.renderer.render(this.scene, this.camera, this);
  this.renderer.setClearColor(colors.black, 1);
  this.onEnterFrame = this.onEnterFrameReal;
}

RippleMap.prototype.onEnterFrameReal = function(dt) {
  this.ripplePointCloud.update(dt);

  this.renderer.setClearColor(colors.gray, 1);
  this.renderer.autoClear = false;
  this.renderer.render(this.scene, this.camera, this);
  this.renderer.autoClear = true;
  this.renderer.setClearColor(colors.black, 1);
}

RippleMap.prototype.registerRippler = function(rippler) {
  this.ripplePointCloud.register(rippler);
}

RippleMap.prototype.unregisterRippler = function(rippler) {
  this.ripplePointCloud.unregister(rippler);
}

RippleMap.prototype.generatePreviewObject = function() {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1, 1),
    new THREE.MeshBasicMaterial({
      map: this.texture
    })
  );
}

module.exports = RippleMap;