function convertEasingFunctionToGsap(easingFunction) {
  if (typeof easingFunction === 'function') {
    var easeFunc = easingFunction;
    // convert single-t parameter easing to GSAP style
     return function (t, b, c, d) {
      var change = c - b;
      if (d !== 0) {
        var tNorm = t / d;
        tNorm = easeFunc(tNorm);
        t = d * tNorm;
      }
      return change * t / d + b;
    };
  }
}
module.exports = convertEasingFunctionToGsap;