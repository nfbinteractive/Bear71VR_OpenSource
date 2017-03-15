const loadTexture = require('./loadTexture');
const loadJson = require('load-json-xhr');
const loadImage = require('load-img');

const path = require('path');

const cache = {};
const isImage = (ext) => /\.(jpe?g|png|gif|bmp|tga|tif)$/i.test(ext);
const isJson = (ext) => /\.(json)$/i.test(ext);
const noop = () => {};

function assets(url) {
  if (!(url in cache)) {
    throw new Error('Trying to load asset that is not in cache: ' + url);
  }
  return cache[url];
};

assets.load = load;
assets.preload = preload;
assets.printCache = printCache;

// Preloading an image won't add it to our cache,
// it just warms up the browser HTTP caching.
// All other assets are loaded into cache as per normal.
function preload(url, cb) {
  console.log('[preload]', url);
  if (isImage(path.extname(url))) {
    loadImage(url, cb);
  } else {
    load(url, cb);
  }
};

function printCache () {
  console.log('Cached Items:');
  console.log(JSON.stringify(Object.keys(cache), undefined, 2));
};

function load(url, opt, cb) {
  if (!url) throw new TypeError('Must specify url argument');
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  cb = cb || noop;
  opt = opt || {};

  if (url in cache) {
    const ret = cache[url];
    process.nextTick(() => cb(null, ret));
    return ret;
  } else {
    // console.log('[load]', url);
    const done = (err, data) => {
      if (err) {
        delete cache[url];
      } else {
        cache[url] = data;
      }
      if (cb) cb(err, data);
    };
    const ext = opt.extension ? opt.extension : path.extname(url);
    if (isImage(ext)) {
      var tex = loadTexture(url, opt, done);
      cache[url] = tex;
      return tex;
    } else if (isJson(path.extname(url))) {
      loadJson(url, done);
    } else if (/\.(txt)$/i.test(ext)) {
      return loadFont(url, done);
    }
  }
};

window.printCache = printCache;

module.exports = assets;