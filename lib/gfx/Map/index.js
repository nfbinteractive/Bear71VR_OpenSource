const MapSection = require('./Section');
const RippleMap = require('./RippleMap');
const assets = require('../../assets');
const defaults = require('lodash.defaults');
const urlParam = require('urlparam');
const THREE = require('three');
const gsap = require('gsap');
const clamp = require('clamp');
const lerp = require('lerp');
const { EventEmitter } = require('events');

function noop() {}

const mapTileTypes = require('../../data/mapTileTypes');
const __TILE_INDEX_ROAD = mapTileTypes.indexOf('road') * 8;
const __TILE_INDEX_RAILWAY = mapTileTypes.indexOf('railway') * 8;


var __tmpNewPosition = new THREE.Vector3();
var __tmpOldPosition = new THREE.Vector3();
var settings = require('../settings');
var mapBaseName = urlParam('map', 'map');
var spriteBaseName = urlParam('spritesheet', 'spritesheet');
const __defaultParams = {
  size: settings.mapSize,
  groundPlaneOffset: -0.08,
  segments: settings.mapSegments,
  spritesPerMeter: 8,
  elevationScale: settings.elevation,
  spriteScale: settings.spriteScale,
  mapUrl: 'assets/images/' + mapBaseName + '.png',
  spritesheetUrl: 'assets/images/' + spriteBaseName + '.png',
  groundColor: new THREE.Color(0x007fff),
  fogColor: new THREE.Color(0xffffff),
  fogAmt: 0.5
};

function Map(params) {
  params = defaults(params, __defaultParams);
  params.groundPlaneOffset /= params.elevationScale;

  var scene = params.scene;

  THREE.Object3D.call(this);
  
  this.emitter = new EventEmitter();
  this.isMoving = false;
  this.LOADED = 'loaded';

  var onMapUpdateCallbacks = [];
  var onReadyCallbacks = [];

  this.imageWidth = 1024;
  this.imageHeight = 1024;

  var spritesPerMeter = params.spritesPerMeter;
  var _this = this;
  const mapTexture = assets.load(params.mapUrl, function(err, texture) {
    mapTexture.magFilter = THREE.NearestFilter;
    mapTexture.minFilter = THREE.NearestFilter;
    mapTexture.flipY = false;
    mapTexture.generateMipmaps = false;
    mapTexture.needsUpdate = true;
    var image = texture.image;
    var canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
    canvas.width = Math.floor( image.width );
    canvas.height = Math.floor( image.height );
    _this.imageWidth - canvas.width;
    _this.imageHeight - canvas.height;

    console.log('beginning caching of map to typed arrays');
    var context2d = canvas.getContext('2d');
    context2d.drawImage( image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height );
    _this.context2d = context2d;
    _this.updateMapForCamera();
    if(image.width !== image.height) {
      throw new Error('Image not square. Nonsquare maps not supported.');
    }
    sections.forEach(function(section) {
      section.spriteSpacing = image.width / spritesPerMeter;
    });
    var samples = context2d.getImageData(0, 0, _this.imageWidth, _this.imageHeight).data;
    var total = _this.imageWidth * _this.imageHeight;
    var heightsTable = new Float32Array(total);
    var tileIndexTable = new Uint8Array(total);
    var elevationScale = params.elevationScale;
    var now = Date.now();
    for (var i = 0; i < total; i++) {
      heightsTable[i] = samples[i*4] / 255 * elevationScale;
      tileIndexTable[i] = samples[i*4+1];
    }
    
    _this.heightsTable = heightsTable;
    _this.tileIndexTable = tileIndexTable;
    _this.getHeightAtLocation = _this.getHeightAtLocationFast;
    _this.getTileIndexAtLocation = _this.getTileIndexAtLocationFast;
    _this.getRandomSampleOnEdgeOfView = _this.getRandomSampleOnEdgeOfViewFast;
    console.log('checkin caching of map to typed arrays: ' + (Date.now() - now) + 'ms');
    //for performance, this section will need to be cached to a file and loaded or required instead of calculated inline like this,
    //unless ofcourse calculating them all is worth the filesize, memory usage, load and parse time tradeoff
    var allConnections = {};
    var roadlikeTileIndices = [__TILE_INDEX_ROAD, __TILE_INDEX_RAILWAY];
    roadlikeTileIndices.forEach(function(tileIndex) {
      allConnections[tileIndex] = {
        positionIndices: [],
        connections: []
      };
    });
    var w = _this.imageWidth;
    var h = _this.imageHeight; 
    var offsets = [
      {x: -1, y: -1},
      {x: 0, y: -1},
      {x: 1, y: -1},
      {x: -1, y: 0}
    ].map(function(v) {
      return v.y * w + v.x;
    });
    var totalOffsets = offsets.length;

    var connectionCount = 0;
    function connect(connectionSet, i, i2) {
      var index = connectionSet.positionIndices.indexOf(i);
      if(index === -1) {
        index = connectionSet.positionIndices.length;
        connectionSet.positionIndices.push(i);
        connectionSet.connections.push([]);
      }
      connectionSet.connections[index].push(i2);
      connectionCount++;
    }

    for (var iy = 0; iy < h; iy++) {
      for (var ix = 0; ix < w; ix++) {
        var i = iy * w + ix;
        var sampleTile = tileIndexTable[i];
        if(roadlikeTileIndices.indexOf(sampleTile) !== -1) {
          for (var j = 0; j < totalOffsets; j++) {
            var i2 = (i + offsets[j] + total) % total;
            var sampleTile2 = tileIndexTable[i2];
            if(sampleTile2 === sampleTile) {
              connect(allConnections[sampleTile], i, i2);
              connect(allConnections[sampleTile], i2, i);
            }
          }
        }
      }
    }

    var spm = _this.spritesPerMeter;
    var smoothIterations = 3;
    Object.keys(allConnections).forEach(function(key, i){
      var data = allConnections[key];
      var connections = data.connections;
      var positionIndices = data.positionIndices;
      var tempVertices = positionIndices.map(function(index, i) {
        var x = index % w / spm + 0.5/spm;
        var y = ~~(index / w) / spm + 0.5/spm;
        var vert = new THREE.Vector3(x, _this.getHeightAtLocation(x, y), y);
        vert.index = index;
        return vert;
      });
      data.vertices = tempVertices;
      for (var iLoop = 0; iLoop < smoothIterations; iLoop++) {
        var smoothedVertices = tempVertices.map(function(stiffVert) {
          var average = stiffVert.clone();
          var index = positionIndices.indexOf(stiffVert.index);
          connections[index].forEach(function(i2) {
            average.add(tempVertices[positionIndices.indexOf(i2)]);
          });
          average.multiplyScalar(1/(1+connections[index].length));
          return average;
        });
        tempVertices.forEach(function(v, i) {
          var index = positionIndices.indexOf(v.index);
          v.x = smoothedVertices[index].x;
          v.z = smoothedVertices[index].z;
          v.y = Math.max(v.y, _this.getHeightAtLocation(v.x, v.z));
        })
      }
    });
    _this.roadlikeConnections = allConnections;
    console.log(connectionCount);
    //end of section

    console.log('completed caching of map to typed arrays: ' + (Date.now() - now) + 'ms');

    _this.camera.blindfold.animateOut();
    _this.isReady = true;
    onReadyCallbacks.forEach(function(cb){
      cb();
    });
    // _this.moveCamera(
    //   [image.width * 0.5 / spritesPerMeter, image.height * 0.5 / spritesPerMeter], 
    //   0
    // );
    _this.emitter.emit(_this.LOADED);
  });
  this.mapTexture = mapTexture;

  const spritesheetTexture = assets.load(params.spritesheetUrl);
  spritesheetTexture.premultiplyAlpha = true;
  this.spritesheetTexture = spritesheetTexture;
  
  const segmentsTotal = Math.pow(params.segments, 2);
  const segmentSize = params.size / params.segments;
  const pointsPerSegment = Math.floor(segmentSize * spritesPerMeter);

  var rippleMap = new RippleMap({
    map: this,
    renderer: params.renderer
  });

  const segmentSpacing = params.size / params.segments;
  const halfSize = params.size * 0.5;
  var sectionParams = {
    cameraPosition: params.cameraPosition,
    map: this,
    groundPlaneOffset: params.groundPlaneOffset,
    fogFar: halfSize,
    fogNear: halfSize * params.fogAmt,
    size: segmentSize,
    borderRadius: halfSize / segmentSize,
    pointCount: Math.pow(pointsPerSegment, 2),
    spriteSpacing: 1024 / spritesPerMeter,
    spritesPerMeter: spritesPerMeter,
    groundColor: params.groundColor,
    fogColor: params.fogColor,
    spriteScale: params.spriteScale,
    rippleTexture: rippleMap.texture
  };

  var pointSpacing = params.size / (pointsPerSegment * params.segments);
  var pointSpacingHalf = pointSpacing * 0.5;

  var sections = [];
  for (var iy = 0; iy < params.segments; iy++) {
    for (var ix = 0; ix < params.segments; ix++) {
      var x = (ix + 0.5) * segmentSpacing - halfSize;
      var y = (iy + 0.5) * segmentSpacing - halfSize;
      sectionParams.renderOrder = 1000 - (Math.abs(x) + Math.abs(y));
      sectionParams.drawSortX = x / segmentSpacing;
      sectionParams.drawSortY = y / segmentSpacing;
      sectionParams.debug = iy === ix && iy === 2;
      sectionParams.offsetX = x;
      sectionParams.offsetY = y;
      var section = new MapSection(sectionParams);
      scene.add(section);
      var s = segmentSize;
      section.scale.set(s, params.elevationScale, s);
      sections.push(section);
      section.spriteScale = params.spriteScale;
    }
  }


  this.state = params.state;
  this.sections = sections;
  this.camera = params.camera;
  this.scene = params.scene;
  this.cameraPosition = params.cameraPosition;
  this.pointSpacing = pointSpacing;
  this.pointSpacingHalf = pointSpacingHalf;
  this.spritesPerMeter = spritesPerMeter;
  this.spriteSize = 1 / spritesPerMeter;
  this.cameraElevationDamped = 0;
  this.cameraElevation = 0;
  this.onMapUpdateCallbacks = onMapUpdateCallbacks;
  this.rippleMap = rippleMap;
  this.elevationScale = params.elevationScale;
  this.groundColor = params.groundColor;
  this.spriteScaleOriginal = params.spriteScale;
  this.visibleDistance = halfSize;
  this.onReadyCallbacks = onReadyCallbacks;
}

Map.prototype = Object.create(THREE.Object3D.prototype);

Map.prototype.onReady = function(callback) {
  this.onReadyCallbacks.push(callback);
}

Map.prototype.updateMapForCamera = function(dt) {
  this.sections.forEach(function(section) {
    section.update();
  });
  for (var i = 0; i < this.onMapUpdateCallbacks.length; i++) {
    this.onMapUpdateCallbacks[i]();
  }
}

Object.defineProperty(Map.prototype, 'screenPixelHeight', {
  set: function (val) {
    this.sections.forEach(function(section) {
      section.screenPixelHeight = val;
    });
  }
});

Map.prototype.onEnterFrame = function(dt) {
  if(this.lastDayNightUsed !== this.state.dayNight){
    this.lastDayNightUsed = this.state.dayNight;
    var blend = this.state.dayNight;
    var spriteScale = this.spriteScaleOriginal;
    for (var i = this.sections.length - 1; i >= 0; i--) {
      var section = this.sections[i];
      section.spriteScale = spriteScale * (0.2 + blend * 0.8);
      section.nightTime = 1 - blend;
    }
  }

  this.rippleMap.onEnterFrame(dt);
}

Map.prototype.getHeightAtLocation = function(x, y) {
  return 0;
}

Map.prototype.getHeightAtLocationFast = function(x, y) {
  return this.heightsTable[~~(x * this.spritesPerMeter) + ~~(y * this.spritesPerMeter) * this.imageWidth];
}

Map.prototype.getHeightAtLocationLerped = function(x, y) {
  x *= this.spritesPerMeter;
  y *= this.spritesPerMeter;
  var xMin = Math.floor(x);
  var xMax = Math.ceil(x);
  var yMin = Math.floor(y);
  var yMax = Math.ceil(y);
  var sampleTopLeft = this.heightsTable[xMin + yMin * this.imageWidth];
  var sampleTopRight = this.heightsTable[xMax + yMin * this.imageWidth];
  var sampleBottomLeft = this.heightsTable[xMin + yMax * this.imageWidth];
  var sampleBottomRight = this.heightsTable[xMax + yMax * this.imageWidth];
  var sample = lerp(lerp(sampleTopLeft, sampleTopRight, x - xMin), lerp(sampleBottomLeft, sampleBottomRight, x - xMin), y - yMin);
  return sample;
}

Map.prototype.getTileIndexAtLocation = function(x, y) {
  return 0;
}

Map.prototype.getTileIndexAtLocationFast = function(x, y) {
  return this.tileIndexTable[~~(x * this.spritesPerMeter) + ~~(y * this.spritesPerMeter) * this.imageWidth];
}

Map.prototype.getIndexOfPosition = function(pos) {
  return ~~(pos.x * this.spritesPerMeter) + ~~(pos.z * this.spritesPerMeter) * this.imageWidth;
}

Map.prototype.getPositionFromLocation = function(x, y) {
  return new THREE.Vector3(
    x,
    this.getHeightAtLocation(x, y),
    y
  );
}

Map.prototype.moveCamera = function(location, duration, onComplete = noop, height, white) {
  this.isMoving = true;
  const newPosition = __tmpNewPosition.set(
    location[0],
    height !== undefined ? height : this.getHeightAtLocation(location[0], location[1]),
    location[1]
  );
  if(duration === undefined || duration === null) {
    const oldPosition = __tmpOldPosition.copy(this.cameraPosition);
    oldPosition.y = newPosition.y;
    const distanceInMeters = oldPosition.distanceTo(newPosition);
    const metersPerSecond = 2.1; // walking speed
    duration = distanceInMeters / metersPerSecond;
  }
  gsap.killTweensOf(this.cameraPosition);

  var _this = this;
  function onCompleteWrapper() {
    _this.isMoving = false;
    onComplete();
  }
  if(duration > 0) {
    gsap.to(this.cameraPosition, duration, {
      x: newPosition.x,
      y: newPosition.y,
      z: newPosition.z,
      ease: settings.cameraMovementEasingFunction,
      onUpdate: this.updateMapForCamera,
      onUpdateScope: this,
      onComplete: onCompleteWrapper
    });
  } else {
    this.camera.blindfold.blink(
      function() {
        _this.cameraPosition.copy(newPosition);
        _this.updateMapForCamera();
      },
      onCompleteWrapper,
      white
    );
  }
}

Map.prototype.stopMovingCamera = function() {
  gsap.killTweensOf(this.cameraPosition);
}

Map.prototype.addOnUpdateCallback = function(callback) {
  this.onMapUpdateCallbacks.push(callback);
}

Map.prototype.getColliderPlanes = function() {
  return this.sections.map(function(section) {
    return section.colliderPlane;
  });
}

module.exports = Map;
