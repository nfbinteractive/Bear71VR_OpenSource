const defaults = require('lodash.defaults');
const getColliderMaterial = require('../../getColliderMaterial');

const defaultParams = {
  segments: 24
};

function PlaneCollider(params) {
  params = defaults(params, defaultParams);
  
  const geometry = new THREE.PlaneGeometry(params.size, params.size, params.segments, params.segments);
  geometry.rotateX(- Math.PI / 2);
  const material = getColliderMaterial();
  // material.visible = false;
  THREE.Mesh.call(this, geometry, material);

  // We want to use a cone-style cursor for this mesh
  this.isGroundCollider = true;
  this.matrixAutoUpdate = false;

  const x = params.x;
  const y = params.y;

  const _this = this;
  //hotfix. The map canvas context2d is not available immediately. Until we change the way we load and initialize everything, we need this delay.
  setTimeout(function(){
    _this.geometry.vertices.forEach(function(v) {
      const xAbs = v.x + x;
      const yAbs = v.z + y;
      v.y = params.map.getHeightAtLocation(xAbs,yAbs);
    });
    _this.geometry.verticesNeedUpdate = true;
    _this.geometry.computeBoundingBox();
    _this.geometry.computeBoundingSphere();
    _this.geometry.computeFaceNormals();
  }, 1500);
  
}

PlaneCollider.prototype = Object.create(THREE.Mesh.prototype);

module.exports = PlaneCollider;
