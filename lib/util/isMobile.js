module.exports = function isMobile () {
  // dumb mobile test
  return /(iPad|iPhone|iPod|Android)/i.test(navigator.userAgent);
};
