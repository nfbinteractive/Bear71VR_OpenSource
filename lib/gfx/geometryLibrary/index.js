const geometries = {
  'daydreamController': require('./getDaydreamController')
}
const aliases = {
}

function getCreator(name) {
  if(!geometries[name]) {
    name = aliases[name];
  }
  if(!geometries[name]) {
    throw new Error(name + ' is not a geometry in the library.');
  }
  return geometries[name];
}

const geometryLibrary = {
  getCreator
};

module.exports = geometryLibrary;