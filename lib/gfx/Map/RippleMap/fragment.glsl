uniform sampler2D texture;
uniform float strength;

void main() {
  gl_FragColor = texture2D(texture, gl_PointCoord);
  gl_FragColor.a *= strength;
}
