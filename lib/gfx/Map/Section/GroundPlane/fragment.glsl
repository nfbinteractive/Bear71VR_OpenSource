uniform vec3 color;
uniform vec3 skyColor;
varying float fogFactor;

void main() {
  gl_FragColor = vec4(color, 1.0);
  gl_FragColor.rgb += (skyColor - gl_FragColor.rgb) * fogFactor;
}
