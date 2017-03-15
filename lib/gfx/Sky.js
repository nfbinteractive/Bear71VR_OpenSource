const glslify = require('glslify');

function Sky(params = {}) {
  THREE.Mesh.call(this, 
    new THREE.SphereBufferGeometry(1, 32, 16, undefined, undefined, 0, Math.PI * 0.75), 
    new THREE.ShaderMaterial({
      vertexShader: glslify('./sky/sky.vert'),
      fragmentShader: glslify('./sky/sky.frag'),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        colorSky: { type: 'c', value: params.color },
        colorFog: { type: 'c', value: params.fogColor }
      }
    })
  );
  this.renderOrder = -100000;
  this.scale.multiplyScalar(4);
  this.camera = params.camera;
};

Sky.prototype = Object.create(THREE.Mesh.prototype);

var __tempVec3 = new THREE.Vector3();
Sky.prototype.onEnterFrame = function(dt) {
  __tempVec3.set(0, 0, 0);
  this.camera.localToWorld(__tempVec3);
  this.position.copy(__tempVec3);
}
module.exports = Sky;
