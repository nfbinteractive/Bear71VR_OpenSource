const gsap = require('gsap');

function Blindfold() {
  THREE.Mesh.call(
    this,
    new THREE.BoxGeometry(0.2, 0.2, 0.2, 1, 1, 1), 
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  // this.visible = false;
  this.renderOrder = 100000;
}

Blindfold.prototype = Object.create(THREE.Mesh.prototype);

Blindfold.prototype.blink = function(onBlink, onComplete, white) {
  var color = this.material.color;
  if(white) {
    color.setRGB(1, 1, 1);
  }
  var _this = this;
  this.animateIn(function() {
    setTimeout(function () {
        if(onBlink) onBlink();
      _this.animateOut(function() {
        onComplete();
        color.setRGB(0, 0, 0);
      });
    }, 250);
  });
}

Blindfold.prototype.animateIn = function(cb) {
  this.visible = true;
  gsap.to(this.material, 1, {
    opacity: 1,
    onComplete: cb
  });
}

Blindfold.prototype.animateOut = function(cb) {
  gsap.to(this.material, 1, {
    opacity: 0,
    onComplete: function() {
      if(cb) cb();
      this.visible = false;
    },
    onCompleteScope: this
  });
}

module.exports = Blindfold;