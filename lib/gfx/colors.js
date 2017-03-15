const colors = {
  white: 0xffffff,
  lightGray: 0xd8d8d8,
  gray: 0x232323,
  darkGray: 0x111111,
  black: 0x000000,
  
  lightBlue: 0xccdcfe,
  animalAtNight: 0xaaaaaa,
  staticObjectAtNight: 0x666666
};

Object.keys(colors).forEach(function(key) {
	colors[key] = new THREE.Color(colors[key]);
});

module.exports = colors;