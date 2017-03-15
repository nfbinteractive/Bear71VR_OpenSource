const defaults = require('lodash.defaults');
const THREE = require('three');

const getGeometry = require('./getGeometry');
const getMaterial = require('./getMaterial');

const defaultParams = {
  pointsPerAxis: 32
};

function GroundPlane(params) {
  params = defaults(params, defaultParams);

  var materialParams = {
    mapTexture: params.map.mapTexture,
    globalPosition: params.globalPosition,
    sectionPosition: params.sectionPosition,
    globalScale: params.sectionScale,
    color: params.color,
    fogColor: params.fogColor,
    fogNear: params.fogNear,
    fogFar: params.fogFar,
    spriteSpacing: params.spriteSpacing
  };

  THREE.Mesh.call(
    this, 
    getGeometry(params.pointsPerAxis), 
    getMaterial(materialParams)
  );
}

GroundPlane.prototype = Object.create(THREE.Mesh.prototype);

Object.defineProperty(GroundPlane.prototype, 'spriteSpacing', {
  set: function (val) {
    this.material.spriteSpacing = val;
  }
})


module.exports = GroundPlane;