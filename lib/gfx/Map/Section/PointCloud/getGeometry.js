const defaults = require('lodash.defaults');
const THREE = require('three');

const defaultParams = {
  pointsPerAxis: 20,
  drawSortX: 0,
  drawSortY: 0,
  borderRadius: 2
};

function getGeometry(params) {
  params = defaults(params, defaultParams);
  const pointsPerAxis = params.pointsPerAxis;
  var drawSortX = params.drawSortX;
  var drawSortY = params.drawSortY;
  var pointsCount = 0;
  var radiusSqr = Math.pow(params.borderRadius, 2);
  var validIndices = [];
  var cacheX = new Float32Array(Math.pow(pointsPerAxis, 2));
  var cacheY = new Float32Array(Math.pow(pointsPerAxis, 2));
  for (var iy = 0; iy < pointsPerAxis; iy++) {
    for (var ix = 0; ix < pointsPerAxis; ix++) {
      var i = iy * pointsPerAxis + ix;
      var tempX = (ix + 0.5) / pointsPerAxis - 0.5;
      var tempY = (iy + 0.5) / pointsPerAxis - 0.5;
      var test = Math.pow(tempX + drawSortX, 2) + Math.pow(tempY + drawSortY, 2);
      if(test <= radiusSqr) {
        pointsCount++;
        validIndices.push(i);
        cacheX[i] = tempX;
        cacheY[i] = tempY;
      }
    }
  }

  const positions = new Float32Array(pointsCount * 2);
  var sortedIndices = new Array(pointsCount);
  for (var iy = 0; iy < pointsPerAxis; iy++) {
    for (var ix = 0; ix < pointsPerAxis; ix++) {
      var i = iy * pointsPerAxis + ix;
      if(validIndices.indexOf(i) !== -1) {
        sortedIndices[i] = {
          i: i,
          dist: Math.abs(cacheX[i] + drawSortX) 
              + Math.abs(cacheY[i] + drawSortY)
        };
      }
    }
  }

  sortedIndices = sortedIndices.sort(function(a, b) {
    return b.dist - a.dist;
  }).map(function(obj) {
    return obj.i;
  });

  var reverseLookupIndices = new Array(pointsCount);
  for(var i = 0; i < pointsCount; i++) {
    reverseLookupIndices[sortedIndices[i]] = i;
  }

  for (var iy = 0; iy < pointsPerAxis; iy++) {
    for (var ix = 0; ix < pointsPerAxis; ix++) {
      var i = iy * pointsPerAxis + ix;
      if(validIndices.indexOf(i) !== -1) {
        var sortedIndex2 = reverseLookupIndices[i] * 2;
        positions[sortedIndex2] = cacheX[i];
        positions[sortedIndex2+1] = cacheY[i];
      }
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(positions, 2));

  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), Math.sqrt(0.5));
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-0.5, 0, -0.5),
    new THREE.Vector3(0.5, 1, 0.5)
  );

  return geometry;
}

module.exports = getGeometry;