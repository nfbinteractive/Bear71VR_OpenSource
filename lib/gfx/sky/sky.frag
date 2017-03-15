varying vec3 vAtmosphereColor;

void main() {
  gl_FragColor = vec4(vAtmosphereColor, 1.0);
}
