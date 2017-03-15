uniform float pointSize;

void main() {
  gl_Position = projectionMatrix * vec4(position.xzy, 1.0);
  gl_PointSize = pointSize;
}
