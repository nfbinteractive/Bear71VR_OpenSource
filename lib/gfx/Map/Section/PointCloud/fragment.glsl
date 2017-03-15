uniform sampler2D spritesheetTexture;
uniform vec3 skyColor;

varying float uvOffsetX;
varying float fogFactor;

void main() {
  vec2 uv = vec2(gl_PointCoord.x / 32.0 + uvOffsetX, 1.0 - gl_PointCoord.y);
  gl_FragColor = texture2D(spritesheetTexture, uv);

  if (gl_FragColor.a < 0.25) {
    discard;
  }
  //unpremultiply for really nice edges
  gl_FragColor.rbg /= gl_FragColor.a;
  gl_FragColor.rgb += (skyColor - gl_FragColor.rgb) * fogFactor;
}