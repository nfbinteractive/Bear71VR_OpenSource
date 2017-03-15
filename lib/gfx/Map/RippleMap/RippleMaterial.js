const defaults = require('lodash.defaults');
const THREE = require('three');
const glslify = require('glslify');
const assets = require('../../../assets');

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
  mapUrl: 'assets/images/ripple-normals.png',
  pointSize: 8,
  strength: 0.5
};

function RippleMaterial(params) {
  params = defaults(params, __defaultParams);

  THREE.ShaderMaterial.call(this, {
    vertexShader: __getVertexShader(),
    fragmentShader: __getFragmentShader(),
    depthTest: false,
    depthWrite: false,
    // wireframe: true,
    side: THREE.DoubleSide,
    // blending: THREE.AdditiveBlending,
    transparent: true,
    uniforms: {
      pointSize: { type: 'f', value: params.pointSize },
      strength: { type: 'f', value: params.strength },
      texture: { type: 't', value: assets.load(params.mapUrl) }
    }
  });
}

RippleMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);

module.exports = RippleMaterial;