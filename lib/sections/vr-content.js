const urlParam = require('urlparam');
const settings = require('../gfx/settings');
const onDayDream = require('../util/onDayDream');
const onVR = require('../util/onVR');
const Map = require('../gfx/Map');
const InteractiveDayDreamController = require('../gfx/InteractiveDayDreamController');
const Sky = require('../gfx/Sky');
const Cursor = require('../gfx/Cursor');
const MapCollider = require('../gfx/MapCollider');
const colors = require('../gfx/colors');

const __tempVec3 = new THREE.Vector3();

function noop() {}

let mapCollider, sky, cursor;

module.exports = function ({ app, state }) {

  var rayEvents = app.rayEvents;
  
  var scene = app.scene;
  var cameraManager = app.cameraManager;

  const groundColor = colors.white.clone();
  const fogColor = colors.white.clone();
  const skyColor = colors.lightBlue.clone();

  var fogAmt = 1 - settings.fogRatio;
  const map = new Map({
    scene: app.scene,
    fogColor,
    fogAmt,
    groundColor,
    camera: app.camera,
    cameraPosition: app.cameraBody.position,
    renderer: app.renderer,
    state
  });

  app.registerOnResize(function(w, h) {
    map.screenPixelHeight = h * window.devicePixelRatio;
  });

  var fogFar = map.visibleDistance;
  var fogNear = fogFar * fogAmt;
  var fog = new THREE.Fog(fogColor, fogNear, fogFar);
  fog.color = fogColor; //important if we want the animated uniform colors to JUST WORK. otherwise it gets cloned and we lose that connection.
  app.scene.fog = fog;

  scene.add(map);
  if(urlParam('previewRippleMap', false)) {
    var rippleMapPreview = map.rippleMap.generatePreviewObject();
    rippleMapPreview.rotation.x = Math.PI * -0.5;
    rippleMapPreview.scale.set(0.2, 0.2, 0.2);
    rippleMapPreview.position.y = 1;
    app.cameraFootstool.add(rippleMapPreview);
  }
  sky = new Sky({
      color: skyColor,
      fogColor,
      camera: app.camera
    }
  );
  scene.add(sky);
  map.emitter.on(map.LOADED, mapLoaded);

  function mapLoaded (){
    var camPos = app.cameraBody.position;
    camPos.y = map.getHeightAtLocation(camPos.x, camPos.z);
    cursor = new Cursor({
      map: map,
      state,
      camera: app.camera,
      rayEvents: rayEvents
    });
    onVR(cursor.onVR.bind(cursor));
    scene.add(cursor);

    map.rippleMap.registerRippler(cursor);
    app.cursor = cursor;
    map.cursor = cursor;

    mapCollider = new MapCollider({
      map,
      cameraPosition: app.cameraBody.position
    });
    scene.add(mapCollider);

    cursor.addColliders(mapCollider.getColliderPlanes());

    var dayDreamController;
    onDayDream(function onDayDreamAdjustVisualController(isDayDream) {
      if(isDayDream) {
        dayDreamController = new InteractiveDayDreamController({
          camera: app.camera,
          rayEvents: rayEvents
        });
        app.cameraFootstool.add(dayDreamController);
        console.log('DAYDREAM CONTROLLER START');
        dayDreamController.position.set(0.25, 1.4, -0.5);
      } else {
        if(dayDreamController) {
          app.cameraFootstool.remove(dayDreamController);
          console.log('DAYDREAM CONTROLLER STOP');
          dayDreamController = null;
        }
      }
    });

    // not needed in daydream
    // findNorth();
  }
}
