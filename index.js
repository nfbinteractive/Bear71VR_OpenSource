window.THREE = require('three');
require('./lib/vendor/three.FlatShadedMaterial');
require('./lib/vendor/VRControls');
require('./lib/vendor/VREffect');
// inject polyfill
require('webvr-polyfill');
// require('webvr-boilerplate');

// fix rotation bug on iOS 8/9
require('./lib/util/fix-iOS-fullscreen');

// needed for Promise and some other features
require('babel-polyfill');

// improve click response
require('fastclick')(document.body);

const textureLoader = require('./lib/assets/loadTexture');

const GridWorldApp = require('./lib/GridWorldApp');
const setupContent = require('./lib/sections/vr-content');

const canvas = document.querySelector('#canvas');

const app = new GridWorldApp();

// Set a renderer on our texture loader so that
// we can upload textures immediately after preloading them
textureLoader.setRenderer(app.renderer);

const state = {
  time: 0.5,
  daytime: 1,
  dayNight: 1,
  interactive: true,
  gridInteractive: true
};

app.state = state;

setupContent({ app, state });

app.startMagicWindow();
