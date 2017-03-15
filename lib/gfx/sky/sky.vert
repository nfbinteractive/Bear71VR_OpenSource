uniform vec3 colorSky;
uniform vec3 colorFog;

varying vec3 vAtmosphereColor;

void main() {
  
  float blend = 1.0 - clamp(position.y, 0.0, 1.0);

  vAtmosphereColor = mix(colorFog, colorSky, 1.0 - blend * blend);

  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position ,1.0);
}
