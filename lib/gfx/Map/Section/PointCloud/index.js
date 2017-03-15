const defaults = require('lodash.defaults');
const THREE = require('three');

const getGeometry = require('./getGeometry');
const getMaterial = require('./getMaterial');

const defaultParams = {
  pointCount: 400,
  spriteSpacing: 0.5
};

function MapSectionPointCloud(params) {
  params = defaults(params, defaultParams);
    
  const pointsPerAxis = Math.floor(Math.sqrt(params.pointCount));
  var geometryParams = {
    pointsPerAxis: pointsPerAxis,
    drawSortX: params.drawSortX,
    drawSortY: params.drawSortY,
    borderRadius: params.borderRadius
  };
  var materialParams = {
    mapTexture: params.map.mapTexture,
    rippleTexture: params.rippleTexture,
    spritesheetTexture: params.map.spritesheetTexture,
    globalPosition: params.globalPosition,
    cameraPosition: params.cameraPosition,
    sectionPosition: params.sectionPosition,
    globalScale: params.sectionScale,
    fogColor: params.fogColor,
    fogNear: params.fogNear,
    fogFar: params.fogFar,
    spriteScale: params.spriteScale,
    spriteSpacing: params.spriteSpacing
  };

  THREE.Points.call(
    this, 
    getGeometry(geometryParams), 
    getMaterial(materialParams)
  );

  // var test = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8));
  // this.add(test);
}

MapSectionPointCloud.prototype = Object.create(THREE.Points.prototype);

[
  'spriteSpacing',
  'spriteScale',
  'screenPixelHeight',
  'nightTime'
].forEach(function(uniformName) {
  Object.defineProperty(MapSectionPointCloud.prototype, uniformName, {
    set: function (val) {
      this.material[uniformName] = val;
    }
  });
});

module.exports = MapSectionPointCloud;