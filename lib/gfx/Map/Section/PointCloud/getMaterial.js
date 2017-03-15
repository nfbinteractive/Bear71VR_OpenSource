const defaults = require('lodash.defaults');
const THREE = require('three');
const glslify = require('glslify');
const urlparam = require('urlparam');

const defaultParams = {
  fogColor: new THREE.Color(0xff0000),
  spriteSpacing: 0.5,
  nightTime: 0,
  screenPixelHeight: 320,
  fogNear: 10,
  fogFar: 12
};

function getMaterial(params) {
  params = defaults(params, defaultParams);
  
  if(!params.mapTexture) {
    throw new Error('You must provide a map texture.');
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: glslify('./vertex.glsl'),
    fragmentShader: glslify('./fragment.glsl'),
    transparent: true,
    alphaTest: 0.5,
    depthTest: true,
    depthWrite: false,
    uniforms: {
      mapTexture: { type: 't', value: params.mapTexture },
      rippleTexture: { type: 't', value: params.rippleTexture },
      spritesheetTexture: { type: 't', value: params.spritesheetTexture },
      screenPixelHeight: {type: 'f', value: params.screenPixelHeight},
      spriteScale: {type: 'f', value: params.spriteScale},
      spriteSpacing: {type: 'f', value: params.spriteSpacing},
      fogNear: {type: 'f', value: params.fogNear},
      fogFar: {type: 'f', value: params.fogFar},
      skyColor: {type: 'c', value: params.fogColor},
      globalScale: { type: 'v3', value: params.globalScale },
      globalPosition: { type: 'v3', value: params.globalPosition },
      cameraPosition: { type: 'v3', value: params.cameraPosition },
      sectionPosition: { type: 'v3', value: params.sectionPosition }
    }
  });

  [
    'spriteSpacing',
    'spriteScale',
    'screenPixelHeight'
  ].forEach(function(uniformName) {
    Object.defineProperty(material, uniformName, {
      set: function (val) {
        this.uniforms[uniformName].value = val;
      }
    });
  });

  if(!urlparam("sprites", true)) {
    material.visible = false;
  }

  return material;
}

module.exports = getMaterial;