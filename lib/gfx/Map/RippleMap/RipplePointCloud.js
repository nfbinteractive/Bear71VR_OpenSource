const THREE = require('three');
const defaults = require('lodash.defaults');
const Material = require('./RippleMaterial');

const __hiddenVert = new THREE.Vector3(64, 64, 0);
const __poolSize = 40;
function getGeometry() {
  const geometry = new THREE.Geometry();
  for (var i = 0; i < __poolSize; i++) {
    geometry.vertices.push(__hiddenVert);
  }
  return geometry;
}

const defaultParams = {
};

function RipplePointCloud(params) {
  params = defaults(params, defaultParams);
  THREE.Points.call(
    this, 
    getGeometry(), 
    new Material(params)
  );
  this.hiddenVert = __hiddenVert;
  this.queuedRipplers = [];
  this.frustumCulled = false;
  this.regs = 0;
}

function __logIt(kind) {
  console.log('ripples', kind, this.regs, this.queuedRipplers.length)
}

RipplePointCloud.prototype = Object.create(THREE.Points.prototype);
RipplePointCloud.prototype.update = function() {
  this.geometry.verticesNeedUpdate = true;
};

RipplePointCloud.prototype.register = function(rippler) {
  if(this.geometry.vertices.indexOf(rippler.position) === -1 && this.queuedRipplers.indexOf(rippler) === -1) {
    this.regs++;
  } else {
    console.warn('Already registered!');
    // __logIt.call(this, 'in');
    return;
  }
  var index = this.geometry.vertices.indexOf(__hiddenVert);
  if(index !== -1 ){
    this.geometry.vertices[index] = rippler.position;
  } else {
    this.queuedRipplers.push(rippler);
  }
  // __logIt.call(this, 'in');
};

RipplePointCloud.prototype.unregister = function(rippler) {
  var index = this.geometry.vertices.indexOf(rippler.position);
  var index2 = this.queuedRipplers.indexOf(rippler);
  if(index !== -1) {
    this.regs--;
    if(this.queuedRipplers.length > 0) {
      this.geometry.vertices[index] = this.queuedRipplers.shift().position;
    } else {
      this.geometry.vertices[index] = __hiddenVert;
    }
  } else if(index2 !== -1) {
    this.queuedRipplers.splice(index2, 1);
  } else {
    console.warn('Can\'t unregister!');
  }
  // __logIt.call(this, 'out');
};

module.exports = RipplePointCloud;