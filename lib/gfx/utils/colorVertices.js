const THREE = require('three');
function colorVertices(geom, color) {
  if(color === undefined) {
  	throw new Error('You must provide a color');
  }
  if(!(color instanceof THREE.Color)) {
    color = new THREE.Color(color);
  }

  geom.faces.forEach(function(face) {
    for (var j = 0; j < 3; j++) {
      face.vertexColors.push(color);
    }
  });
}

module.exports = colorVertices;