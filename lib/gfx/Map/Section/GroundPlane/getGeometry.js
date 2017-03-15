const THREE = require('three');

var geometry;

function getPlaneGeometry(segments) {
  var halfPixelOffset = 0.5 / segments;
  if(!geometry) {
    const verticesPerAxis = segments + 1;
    const vertexCount = verticesPerAxis * verticesPerAxis;
    const positions = new Float32Array(vertexCount * 2);
    for (var iy = 0; iy < verticesPerAxis; iy++) {
      for (var ix = 0; ix < verticesPerAxis; ix++) {
        var i2 = (iy * verticesPerAxis + ix) * 2;

        positions[i2] = ix / segments - 0.5 + halfPixelOffset;
        positions[i2+1] = iy / segments - 0.5 + halfPixelOffset;
      }
    }

    const faceCount = segments * segments * 2;
    const faceIndices = new Uint32Array(faceCount * 3);

    //TODO make proper indices for proper plane
    var i = 0;
    for (var iy = 0; iy < segments; iy++) {
      for (var ix = 0; ix < segments; ix++) {
        faceIndices[i] = iy * verticesPerAxis + ix;
        faceIndices[i+1] = (iy+1) * verticesPerAxis + ix;
        faceIndices[i+2] = iy * verticesPerAxis + ix+1;
        faceIndices[i+3] = iy * verticesPerAxis + ix+1;
        faceIndices[i+5] = (iy+1) * verticesPerAxis + ix+1;
        faceIndices[i+4] = (iy+1) * verticesPerAxis + ix;
        i += 6;
      }
    }

    geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 2));
    geometry.setIndex(new THREE.BufferAttribute(faceIndices, 1));

    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), Math.sqrt(0.5));
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3(0.5, 1, 0.5)
    );
  }
  return geometry;
}

module.exports = getPlaneGeometry;