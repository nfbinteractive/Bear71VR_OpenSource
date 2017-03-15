const distance = require('gl-vec2/distance');
const touches = require('touches');
const capitalizeFirstLetter = require('./capitalizeFirstLetter');
const __supportedEvents = ['start', 'end', 'move', 'drag', 'select'];

function RayEvents (element) {
  // can't use let/const here as it will break parser?!
  this.lastTime = Date.now();
  this.startPos = [0, 0];

  // iOS won't play audio if it's after a drag event ?
  var touch = touches(element, { filtered: true, parent: element });
  touch.on('move', _onMove.bind(this));
  touch.on('start', _onStart.bind(this));
  touch.on('end', _onEnd.bind(this));
  if(element.width === undefined) {
    throw new Error("Ray Events are designed to be in clipspace, for quick use in webGL. The element you're listening to doesn't have a size, so we can't use it to calculate clip coordinates.");
  }
  this.width = element.clientWidth;
  this.height = element.clientHeight;

  if(this.width === undefined) {
    throw new Error('Just in case clientWidth isn\'t available, width needs to be pre-pixelDeviceRatio, so canvas.width does not work.');
  }

  this.touch = touch;
}

var __proto = RayEvents.prototype;

__proto.resize = function(width, height) {
  this.width = width;
  this.height = height;
}

__supportedEvents.forEach(function(key) {
  key = 'on' + capitalizeFirstLetter(key);
  var collection = [];
  // _this[key + 'Callbacks'] = collection;
  var capped = capitalizeFirstLetter(key);
  __proto['add' + capped] = _add.bind(this, collection);
  __proto['remove' + capped] = _remove.bind(this, collection);
  __proto['dispatch' + capped] = _dispatch.bind(this, collection);
});

function _onStart(ev, pos) {
  _toClipSpace.call(this, pos);
  ev.preventDefault();
  this.startPos = pos.slice();
  this.lastTime = Date.now();
  this.dragging = true;
  this.dispatchOnStart(pos);
}

function _onEnd(ev, pos) {
  _toClipSpace.call(this, pos);
  ev.preventDefault();
  const ms = Date.now() - this.lastTime;
  const dragDist = distance(pos, this.startPos);
  // iOS has a bug where audio won't play if
  // the touchend event is considered a "drag"
  if (ms < 250 && dragDist < 40) {
    this.dispatchOnSelect(pos);
  }
  this.dragging = false;
  this.dispatchOnEnd(pos);
}

function _onMove(ev, pos) {
  _toClipSpace.call(this, pos);
  if(this.dragging) {
    this.dispatchOnDrag(pos);
  } else {
    this.dispatchOnMove(pos);
  }
}

function _add(collection, cb) {
  var index = collection.indexOf(cb);
  if(index === -1) {
    collection.push(cb);
  } else {
    console.warn("Callback already registered; ignoring.");
  }
}

function _remove(collection, cb) {
  var index = collection.indexOf(cb);
  if(index === -1) {
    console.warn("Callback not registered; can't remove, ignoring.");
  } else {
    collection.splice(index, 1);
  }
}

function _dispatch(collection, pos) {
  for (var i = 0; i < collection.length; i++) {
    collection[i](pos);
  }
}

function _toClipSpace(pos) {
  pos[0] = pos[0] * 2 / this.width - 1;
  pos[1] = - (pos[1] * 2 / this.height - 1);
}

module.exports = RayEvents;