const defaults = require('lodash.defaults');
const THREE = require('three');
const PointCloud = require('./PointCloud');
const GroundPlane = require('./GroundPlane');

const defaultParams = {
  map: null,
  size: 4,
  pointCount: 400,
  groundPlaneOffset: -0.05
};

function MapSection(params) {
  params = defaults(params, defaultParams);
  
  if(!params.map) {
    throw new Error('You must provide a map');
  }

  THREE.Object3D.call(this);
  
  var globalPosition = this.position.clone();
  var sectionOffsetPosition = new THREE.Vector3(params.offsetX, 0, params.offsetY);

  params.globalPosition = globalPosition;
  params.sectionPosition = this.position;
  params.sectionScale = this.scale;

  var pointCloud = new PointCloud(params);
  this.add(pointCloud);
  pointCloud.renderOrder = params.renderOrder;

  params.color = params.groundColor;
  var groundPlane = new GroundPlane(params);
  this.add(groundPlane);
  groundPlane.position.y = params.groundPlaneOffset;

  this.cameraPosition = params.cameraPosition;
  this.globalPosition = globalPosition;
  this.pointCloud = pointCloud;
  this.groundPlane = groundPlane;
  this.colliderPlane = groundPlane;
  this.sectionOffsetPosition = sectionOffsetPosition;
  this.spritesPerMeter = params.spritesPerMeter;
}

MapSection.prototype = Object.create(THREE.Object3D.prototype);

Object.defineProperty(MapSection.prototype, 'spriteSpacing', {
  set: function (val) {
    this.pointCloud.spriteSpacing = val;
    this.groundPlane.spriteSpacing = val;
  }
});

[
  'spriteScale',
  'screenPixelHeight'
].forEach(function(uniformName) {
  Object.defineProperty(MapSection.prototype, uniformName, {
    set: function (val) {
      this.pointCloud[uniformName] = val;
    }
  });
});


MapSection.prototype.update = function() {
  this.position.x = this.cameraPosition.x + this.sectionOffsetPosition.x;
  this.position.z = this.cameraPosition.z + this.sectionOffsetPosition.z;
  this.position.x = Math.round(this.position.x * this.spritesPerMeter) / this.spritesPerMeter;
  this.position.z = Math.round(this.position.z * this.spritesPerMeter) / this.spritesPerMeter;
  // this.position.z = this.position.z % 0.1;
  this.globalPosition.copy(this.position).add(this.cameraPosition);
}

module.exports = MapSection;