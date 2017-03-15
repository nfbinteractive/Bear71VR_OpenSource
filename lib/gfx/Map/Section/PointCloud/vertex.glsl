uniform sampler2D mapTexture;
uniform sampler2D rippleTexture;
uniform vec3 sectionPosition;
uniform vec3 globalScale;
uniform float screenPixelHeight;
uniform float spriteScale;
uniform float spriteSpacing;
uniform float fogFar;
uniform float fogNear;

varying float uvOffsetX;
varying float fogFactor;

void main() {

  vec2 worldSpaceLocalPos = position.xy * globalScale.xz;
  vec2 worldSpaceGlobalPos = worldSpaceLocalPos + sectionPosition.xz;
  vec2 mapCoord = worldSpaceGlobalPos / spriteSpacing;
  vec4 rippleTexel = texture2D(rippleTexture, mapCoord);
  vec4 mapTexel = texture2D(mapTexture, mapCoord);

  vec4 pos = vec4(position.x, mapTexel.r, position.y, 1.0);

  //displace sprites by rippleMap
  pos.x += rippleTexel.r * 0.1 - 0.05;
  pos.z += rippleTexel.g * 0.1 - 0.05;

  //proper point size from perspective
  //mapTexel position also influences the point size, so sprites at the beginning of spritesheet are smaller than sprites near the end
  vec4 eyePos = modelViewMatrix * pos;
  vec4 projCorner = projectionMatrix * vec4(16.0, 16.0, eyePos.z, eyePos.w);
  gl_PointSize = screenPixelHeight * projectionMatrix[1][1] / projCorner.w * spriteScale * (mapTexel.g + 0.1);
  gl_Position = projectionMatrix * eyePos;

  //fudge sprite pixels
  uvOffsetX = mapTexel.g * 0.996;

  //apply fog
  float depth = length(worldSpaceGlobalPos - cameraPosition.xz);
  fogFactor = smoothstep( fogNear, fogFar, depth );

  //make edge sprites look faded
  float centerDist = max(abs(mapCoord.x - 0.5), abs(mapCoord.y - 0.5));
  if(centerDist > 0.438 ) {
    fogFactor = max(fogFactor, 0.8);
  }
}