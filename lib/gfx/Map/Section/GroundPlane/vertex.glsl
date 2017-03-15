
uniform sampler2D mapTexture;
uniform vec3 sectionPosition;
uniform vec3 globalScale;
uniform float spriteSpacing;
uniform float fogFar;
uniform float fogNear;

varying float fogFactor;

void main() {


  vec2 worldSpaceLocalPos = position.xy * globalScale.xz;
  vec2 worldSpaceGlobalPos = worldSpaceLocalPos + sectionPosition.xz;
  vec2 mapCoord = worldSpaceGlobalPos / spriteSpacing;
  vec2 fogCoord = worldSpaceGlobalPos - cameraPosition.xz;

  vec4 mapTexel = texture2D(mapTexture, mapCoord);

  vec4 pos = vec4(position.x, mapTexel.b, position.y, 1.0);

  vec4 eyePos = modelViewMatrix * pos;
  gl_Position = projectionMatrix * eyePos;
  
  float depth = length(worldSpaceGlobalPos - cameraPosition.xz);
  fogFactor = smoothstep( fogNear, fogFar, depth );
}
