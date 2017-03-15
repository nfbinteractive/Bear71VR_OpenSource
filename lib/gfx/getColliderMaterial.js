const urlparam = require('urlparam');

const __debugColliders = urlparam('debugColliders', false);
var __material;

function getColliderMaterial() {
  if(!__material || __debugColliders) {
    __material = new THREE.MeshBasicMaterial({
      color: ~~(0xffffff * Math.random()),
      // opacity: 0,
      fog: false,
      wireframe:true
    });
    __material.visible = __debugColliders;
  }
  return __material;
}

module.exports = getColliderMaterial;