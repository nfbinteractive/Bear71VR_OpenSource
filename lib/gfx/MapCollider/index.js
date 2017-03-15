const PlaneCollider = require('./PlaneCollider');
const defaults = require('lodash.defaults');

const __defaultparams = {
  size: 128,
  segments: 16,
  segmentSize: 8,
  edgePadding: 1
};

function noop() {};

module.exports = MapCollider;

function MapCollider (params) {
  params = defaults(params, __defaultparams);
  const map = params.map;
  THREE.Object3D.call(this);
  
  const planes = [];
  let planeParams = {
    map: map,
    size: params.segmentSize
  };
  const segments = params.segments;
  const cameraPosition = params.cameraPosition;
  const sectionSpacing = params.size / segments;
  const sectionSpacingHalf = sectionSpacing * 0.5;
  for (var iy = params.edgePadding; iy < segments - params.edgePadding; iy++) {
    for (var ix = params.edgePadding; ix < segments - params.edgePadding; ix++) {
      var x = (ix + 0.5) * sectionSpacing;
      var y = (iy + 0.5) * sectionSpacing;
      planeParams.x = x;
      planeParams.y = y;
      var plane = new PlaneCollider(planeParams);
      plane.isGround = true;
      plane.position.x = x;
      plane.position.z = y;
      planes.push(plane);
      this.add(plane);
      plane.updateMatrix();
      plane.updateMatrixWorld();
      plane.matrixAutoUpdate = false;
    }
  }
  this.segments = segments;
  this.sectionSpacing = sectionSpacing;
  const planesByIndex = new Array(planes.length);
  for (var i = 0; i < planes.length; i++) {
    var plane = planes[i];
    planesByIndex[_posToIndex.call(this, plane.position.x, plane.position.z)] = plane;
  }

  this.lastIndex = -1;
  this.collisionPlaneMaxDistance = Math.max(16, map.visibleDistance) + sectionSpacingHalf;
  this.visiblePlanes = [];
  this.planesByIndex = planesByIndex;
  this.planes = planes;
  this.cameraPosition = cameraPosition;
  this.sectionSpacingHalf = sectionSpacingHalf;
}

MapCollider.prototype = Object.create(THREE.Object3D.prototype);
var __proto = MapCollider.prototype;
__proto.onEnterFrame = _onEnterFrameInitial;
__proto.getColliderPlanes = getColliderPlanes;

function _onEnterFrameInitial(dt) {
  this.planes.forEach(function(plane) {
    plane.updateMatrix();
    plane.updateMatrixWorld();
    plane.visible = false;
  });
  this.onEnterFrame = _onEnterFrameUpdateColliderVisibilities;
}

function _onEnterFrameUpdateColliderVisibilities(dt) {
  var index = _posToIndex.call(this, this.cameraPosition.x, this.cameraPosition.z);
  if(index !== this.lastIndex) {
    for (var i = 0; i < this.visiblePlanes.length; i++) {
      this.visiblePlanes[i].visible = false;
    }
    this.visiblePlanes.length = 0;
    this.lastIndex = index;
    const startX = this.cameraPosition.x - this.collisionPlaneMaxDistance;
    const startY = this.cameraPosition.z - this.collisionPlaneMaxDistance;
    const endX = this.cameraPosition.x + this.collisionPlaneMaxDistance;
    const endY = this.cameraPosition.z + this.collisionPlaneMaxDistance;
    for (var iy = startY; iy <= endY; iy+=this.sectionSpacing) {
      for (var ix = startX; ix <= endX; ix+=this.sectionSpacing) {
        var plane = this.planesByIndex[_posToIndex.call(this, ix, iy)];
        if(plane) {
          plane.visible = true;
          this.visiblePlanes.push(plane);
        }
      }
    }
    // console.log('collision planes visible: ' + Math.round(100 * visiblePlanes.length / planes.length) + '%')
  }
}

function getColliderPlanes() {
  return this.planes;
}

function _posToIndex(x, y) {
  return ~~(x/this.sectionSpacing) + ~~(y/this.sectionSpacing) * this.segments;
}
