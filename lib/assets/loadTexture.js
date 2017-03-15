const assign = require('object-assign');
const noop = () => {};
const cache = {};
let _renderer;

module.exports = function (src, opt, cb) {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  opt = assign({}, opt);
  cb = cb || (() => {});

  if (src in cache) {
    const ret = cache[src];
    process.nextTick(() => {
      cb(null, ret);
    });
    return ret;
  }

  const loader = new SimpleTextureLoader();
  loader.encoding = opt.encoding || THREE.LinearEncoding;

  const texture = loader.load(src, texture => {
    texture.name = src;
    module.exports.setTextureParams(texture, opt);
    if (_renderer) {
      _renderer.setTexture2D(texture, 0);
    }
    cb(null, texture);
  }, progress => {
    // nothing..
  }, () => {
    const msg = `Could not load texture ${src}`;
    console.error(msg);
    cb(new Error(msg));
  }, opt);
  cache[src] = texture;
  return texture;
};

module.exports.setRenderer = function (renderer) {
  _renderer = renderer;
};

module.exports.setTextureParams = function (texture, opt) {
  texture.needsUpdate = true;
  if (typeof opt.flipY === 'boolean') texture.flipY = opt.flipY;
  if (typeof opt.mapping !== 'undefined') {
    texture.mapping = opt.mapping;
  }
  if (typeof opt.format !== 'undefined') texture.format = opt.format;
  texture.wrapS = opt.wrapS || THREE.ClampToEdgeWrapping;
  texture.wrapT = opt.wrapT || THREE.ClampToEdgeWrapping;
  texture.minFilter = opt.minFilter || THREE.LinearMipMapLinearFilter;
  texture.magFilter = opt.magFilter || THREE.LinearFilter;
  texture.generateMipmaps = opt.generateMipmaps !== false;
};

// The default ThreeJS Image/Texture loader has some
// really weird code that breaks on Chrome sometimes.
// Here's a simpler loader that seems to work better.

function SimpleTextureLoader () {
}

SimpleTextureLoader.prototype.load = function (url, onLoad, onProgress, onErorr, opt) {
  var texture = new THREE.Texture();
  if (opt && opt.encoding) texture.encoding = opt.encoding;

  var image = new window.Image();
  image.onload = function () {
    texture.image = image;
    texture.needsUpdate = true;
    onLoad(texture);
  };
  image.onerror = function (err) {
    onErorr(err);
  };
  image.src = url;
  return texture;
};
