const defaults = require('lodash.defaults');
const THREE = require('three');
const glslify = require('glslify');

var __vertexShader;
function __getVertexShader() {
	if(!__vertexShader) {
		__vertexShader = glslify('./vertex.glsl');
	}
	return __vertexShader;
}

var __fragmentShader;
function __getFragmentShader() {
	if(!__fragmentShader) {
		__fragmentShader = glslify('./fragment.glsl');
	}
	return __fragmentShader;
}

const __defaultParams = {
	color: new THREE.Color(0x00ffff),
	fogColor: new THREE.Color(0xff0000),
  fogNear: 6,
  fogFar: 12
};

function getMaterial(params) {
  params = defaults(params, __defaultParams);

  if(!params.mapTexture) {
    throw new Error('You must provide a map texture.');
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: __getVertexShader(),
    fragmentShader: __getFragmentShader(),
    depthTest: true,
    depthWrite: true,
    // wireframe: true,
    // side: THREE.DoubleSide,
    // transparent: true,
    uniforms: {
      mapTexture: { type: 't', value: params.mapTexture },
      fogNear: {type: 'f', value: params.fogNear},
      fogFar: {type: 'f', value: params.fogFar},
      color: {type: 'c', value: params.color},
      skyColor: {type: 'c', value: params.fogColor},
      spriteSpacing: {type: 'f', value: params.spriteSpacing},
      globalScale: { type: 'v3', value: params.globalScale },
      globalPosition: { type: 'v3', value: params.globalPosition },
      sectionPosition: { type: 'v3', value: params.sectionPosition }
    }
  });


  Object.defineProperty(material, 'spriteSpacing', {
    set: function (val) {
      this.uniforms.spriteSpacing.value = val;
    }
  });

  // material.visible = false;
  return material;
}

module.exports = getMaterial;