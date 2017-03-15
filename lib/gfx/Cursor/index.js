const defaults = require('lodash.defaults');
const THREE = require('three');
const lerp = require('lerp');
const gsap = require('gsap');
const urlparam = require('urlparam');
const settings = require('../settings');

// state position, normal and ring rotation
const __newStatePosition = new THREE.Vector3();
const __newStateQuaternion = new THREE.Quaternion();

const __tmpDir3 = new THREE.Vector3();
const __tmpQuaternion = new THREE.Vector3();
const __tmpPos3 = new THREE.Vector3();
const __tmpNormalMatrix = new THREE.Matrix3();
const __tmpRotationMatrix = new THREE.Matrix4();
const __tmpNormal = new THREE.Vector3();

const States = {
  Default: 0,
  Ground: 1,
  Actor: 2
};

const defaultParams = {
  colorNormal: new THREE.Color(0x595959),
  colorActive: new THREE.Color('#B3B3B3'),
  colorActor: new THREE.Color('#E6434E')
};

function Cursor(params) {
  params = defaults(params, defaultParams);
  THREE.Object3D.call(this);

  this.enabled = urlparam('cursor', true) !== false;

  const raycaster = new THREE.Raycaster();

  const colliders = [];

  const color = params.colorNormal.clone();

  const ringRadius = 0.15;
  const ringGeometry = new THREE.RingGeometry(0.75, 0.6, 6, 1);
  
  this.groundRingMesh = new THREE.Group();
  
  // rotation of quaternion which we'll re-use later
  this.groundRingRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0), -Math.PI / 2
  );

  // ringGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  const ringMaterial = new THREE.MeshBasicMaterial({
    // transparent: true,
    color: color,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false
  });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

  const circleGeometry = new THREE.CircleGeometry(0.7, 6);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: color,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    transparent: true,
    opacity: 0.2
  });
  const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);

  this.groundRingMesh.add(ringMesh);
  this.groundRingMesh.add(circleMesh);
  this.groundRingMesh.material = ringMaterial;
  this.circleMesh = circleMesh;
  this.circleMesh.material = circleMaterial;

  this.add(this.groundRingMesh);

  this.appState = params.state;
  this.groundRingMeshActorScale = ringRadius * 2;
  this.groundRingMeshDefaultScale = ringRadius * 1;
  this.groundRingMesh.scale.set(this.groundRingMeshDefaultScale, this.groundRingMeshDefaultScale, this.groundRingMeshDefaultScale);
  this.actorTween = { value: 0, isAnimatingIn: false, isAnimatingOut: false, state: States.Default };

  const coneHeight = 0.175;
  const coneGeometry = new THREE.FlatShadedGeometry(new THREE.CylinderGeometry(ringRadius * 0.35, 0, coneHeight, 6, 1));
  const coneMaterial = new THREE.MeshLambertMaterial({
    // transparent: true,
    color: 'hsl(0, 0%, 35%)',
    shading: THREE.FlatShading,
    // depthTest: false,
    // depthWrite: false,
    side: THREE.DoubleSide,
    fog: false
  });
  const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
  this.add(coneMesh);
  this.coneMesh = coneMesh;
  this.coneMeshTween = { scale: 0, isAnimatingIn: false, isAnimatingOut: false };
  this.coneMeshPositionY = (coneHeight + 0.15);
  this.coneMeshTime = 0;
  this.coneMesh.position.y = this.coneMeshPositionY;
  this.coneMesh.visible = false; // only show on certain objects (i.e. ground)

  var rayCoord = new THREE.Vector2();

  this.frustumCulled = false;
  this.renderOrder = 3900;
  this.activeAmountSpeed = 5;
  this.coneMesh.renderOrder = this.renderOrder;
  this.groundRingMesh.renderOrder = this.renderOrder;
  this.object3d = this;
  this.colliders = colliders;
  this.raycaster = raycaster;
  // raycaster.far = settings.cursorDistanceFromCamera;
  this.ray = raycaster.ray;
  this.camera = params.camera;
  this.rayEvents = params.rayEvents;
  this.color = ringMaterial.color;
  this.colorNormal = params.colorNormal;
  this.colorActive = params.colorActive;
  this.colorActor = params.colorActor;
  this.colorActorDefault = this.colorActor.clone();
  this.activeAmount = 0;
  this.oldActiveAmount = 0;
  this.groundRingRotateSpeed = 0.15; // how fast to slerp orientation
  this.map = params.map;
  this.state = States.Default;
  this.rayCoord = rayCoord;
  this.dragPanningState = false;

  this.rayEvents.addOnSelect(_onSelect.bind(this));
  this.onMoveOrDrag = _onMoveOrDrag.bind(this);
  this.toggleDragPanning(true);
}

Cursor.prototype = Object.create(THREE.Object3D.prototype);

function _onMoveOrDrag(pos) {
  if(this.lockCursorToCenter) {
    this.rayCoord.x = 0;
    this.rayCoord.y = 0;
  } else {
    this.rayCoord.x = pos[0];
    this.rayCoord.y = pos[1];
  }
}

Cursor.prototype.toggleDragPanning = function(state) {
  if(state === this.dragPanningState) {
    return;
  }
  this.dragPanningState = state;
  if(state) {
    this.rayEvents.addOnMove(this.onMoveOrDrag);
    this.rayEvents.addOnDrag(this.onMoveOrDrag);
    this.rayEvents.addOnStart(this.onMoveOrDrag);
  } else {
    this.rayEvents.removeOnMove(this.onMoveOrDrag);
    this.rayEvents.removeOnDrag(this.onMoveOrDrag);
    this.rayEvents.removeOnStart(this.onMoveOrDrag);
  }
}

Cursor.prototype.onVR = function(state) {
  this.lockCursorToCenter = state;
}

function _onSelect () {
  if (this.state === States.Ground) {
    if (this.appState.gridInteractive && !this.map.isMoving && !this.rayEvents.isModalOpen && !this.appState.isChapterMenuOpen) {
      if(this.animalWindow) {
        this.animalWindow.close();
      }
      this.map.moveCamera([this.position.x, this.position.z], undefined, undefined, undefined, true);
    }
  }
};

Cursor.prototype.onEnterFrame = function(dt) {
  if(!this.enabled) return;
  //optional but reduces cursor lag
  this.camera.updateMatrix();
  this.camera.updateMatrixWorld();
  //

  this.ray.origin.set(0, 0, 0);
  this.camera.localToWorld(this.ray.origin);
  this.raycaster.setFromCamera(this.rayCoord, this.camera);
  // this.camera.getWorldDirection(this.ray.direction);

  // constantly bounce cone up and down
  this.coneMeshTime += dt;
  const coneBounceFrequency = 3;
  const coneYOffScale = 0.1;
  const coneYOff = Math.sin(this.coneMeshTime * coneBounceFrequency) * coneYOffScale;
  this.coneMesh.position.y = this.coneMeshPositionY + coneYOff;

  const globalScale = Math.max(1e-5, this.appState.gridInteractive);

  // animate cone & ring scale based on state
  const coneMeshScale = Math.max(1e-5, this.coneMeshTween.scale) * globalScale;
  this.coneMesh.scale.set(coneMeshScale, coneMeshScale, coneMeshScale);

  const ringScale = lerp(this.groundRingMeshDefaultScale, this.groundRingMeshActorScale, this.actorTween.value) * globalScale;
  this.groundRingMesh.scale.set(ringScale, ringScale, ringScale);

  let newState;
  let shouldRaycast = this.appState.interactive > 0;
  let hit = shouldRaycast ? this.raycaster.intersectObjects(this.colliders)[0] : null;

  let __cursorMaxHitDistance = settings.cursorMaxHitDistance;
  // if the hit (XZ) distance is > max distance
  if (hit) {
    __tmpPos3.set(hit.point.x, 0, hit.point.z);
    __tmpDir3.set(this.ray.origin.x, 0, this.ray.origin.z);
    if (__tmpPos3.distanceTo(__tmpDir3) > __cursorMaxHitDistance) {
      hit = null;
    }
  }

  var collisionOwner = hit ? (hit.object.collisionOwner || hit.object) : undefined;
  if (collisionOwner && collisionOwner.collisionEnabled !== false) {
    this.collisionOwner = collisionOwner;

    // determine new state of cursor
    newState = collisionOwner.isGroundCollider ? States.Ground : States.Actor;

    if (newState === States.Ground) {
      this._clearActiveCursor();
      // if we hit the ground, keep it locked on the raycast hit point
      __newStatePosition.copy(hit.point);
      __tmpNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
      __tmpNormal.copy(hit.face.normal);
      __tmpNormal.applyMatrix3(__tmpNormalMatrix).normalize();
    }

    // new orientation for ring & object
    __newStateQuaternion.setFromUnitVectors(this.up, __tmpNormal);
    __newStateQuaternion.multiply(this.groundRingRotationQuaternion);

    // This is where we handle gaze "activation" after a short duration
  } else {
    this._clearActiveCursor();
    this.collisionOwner = undefined;
    this.activeAmount -= dt * this.activeAmountSpeed;
    if (this.activeAmount < 0) {
      this.activeAmount = 0;
    }
    newState = States.Default;

    // new state position will be placed N meters away from view
    __newStatePosition.set(0, 0, -settings.cursorDistanceFromCamera);
    this.camera.localToWorld(__newStatePosition);

    // now look at the camera
    __tmpPos3.set(0, 0, 0);
    this.updateMatrixWorld();
    this.camera.localToWorld(__tmpPos3);
    this.worldToLocal(__tmpPos3);

    // this is like lookAt but we will store it into a quaternion
    __tmpRotationMatrix.lookAt(__tmpPos3, this.groundRingMesh.position, this.groundRingMesh.up);
    __newStateQuaternion.setFromRotationMatrix(__tmpRotationMatrix);
  }

  this.state = newState;
  this.updateState(__newStatePosition, __newStateQuaternion);

  if (this.oldActiveAmount !== this.activeAmount) {
    this.color.copy(this.colorNormal).lerp(this.colorActive, this.activeAmount);
    this.oldActiveAmount = this.activeAmount;
  }

  // update color
  this.groundRingMesh.material.color.copy(this.colorActive).lerp(this.colorActor, this.actorTween.value);
  this.circleMesh.material.color.copy(this.groundRingMesh.material.color);

  __tmpPos3.set(0, 0, 0);
  this.updateMatrixWorld();
  this.camera.localToWorld(__tmpPos3);

  const s = lerp(3.5, 3.5 * (__tmpPos3.distanceTo(this.position) / __cursorMaxHitDistance), 0.9);
  this.scale.set(s, s, s);

  // the cursor is always visible except when our collision owner occludes it
  var visible = true;
  if (this.collisionOwner && this.collisionOwner.occludesCursor) {
    visible = false;
  }
  if (visible !== this.visible) {
    if (visible) {
      this.map.rippleMap.registerRippler(this);
    } else {
      this.map.rippleMap.unregisterRippler(this);
    }
    this.visible = visible;
  }
};

Cursor.prototype._clearActiveCursor = function () {
  if (this.activeActor) {
    if (this.activeActor.cursorOut) {
      this.activeActor.cursorOut();
    }
    this.activeActor = undefined;
  }
};

Cursor.prototype.updateState = function (newPosition, newQuaternion) {
  const newState = this.state;

  // always rotate to new place
  let slerpSpeed = this.groundRingRotateSpeed;
  this.groundRingMesh.quaternion.slerp(newQuaternion, slerpSpeed);

  // right now we are always lerping to new position, giving it a bit of
  // "spring" - but in maybe some situations we will want to keep it locked?
  this.position.lerp(newPosition, 0.5);

  // Animate the cone in / out
  _animateCone.call(this, newState);

  // Animate ground ring to / from actor state
  _animateRingScale.call(this, newState);

  if (newState === States.Actor) {
    this.circleMesh.visible = true;
  } else {
    this.circleMesh.visible = false;
  }
};

function _animateRingScale (newState) {
  if (newState === States.Actor && this.actorTween.state !== States.Actor && !this.actorTween.isAnimatingIn) {
    this.actorTween.isAnimatingIn = true;
    this.actorTween.isAnimatingOut = false;
    this.actorTween.state = States.Actor;
    gsap.killTweensOf(this.actorTween);
    gsap.to(this.actorTween, 1, {
      value: 1,
      ease: 'easeOutExpo',
      onComplete: () => {
        this.actorTween.isAnimatingIn = false;
        this.actorTween.state = States.Actor;
      }
    });
  } else if (newState !== States.Actor && this.actorTween.state === States.Actor && !this.actorTween.isAnimatingOut) {
    this.actorTween.isAnimatingIn = false;
    this.actorTween.isAnimatingOut = true;
    this.actorTween.state = States.Default;
    gsap.killTweensOf(this.actorTween);
    gsap.to(this.actorTween, 0.5, {
      value: 0,
      ease: 'easeOutExpo',
      onComplete: () => {
        this.actorTween.isAnimatingOut = false;
        this.actorTween.state = States.Default;
      }
    });
  }
}

function _animateCone (newState) {
  if (newState === States.Ground && !this.coneMesh.visible && !this.coneMeshTween.isAnimatingIn) {
    this.coneMesh.visible = true;
    this.coneMeshTween.isAnimatingIn = true;
    this.coneMeshTween.isAnimatingOut = false;
    gsap.killTweensOf(this.coneMeshTween);
    gsap.to(this.coneMeshTween, 1, {
      scale: 1,
      ease: 'easeOutExpo',
      onComplete: () => { this.coneMeshTween.isAnimatingIn = false; }
    });
  } else if (newState !== States.Ground && this.coneMesh.visible && !this.coneMeshTween.isAnimatingOut) {
    this.coneMeshTween.isAnimatingOut = true;
    this.coneMeshTween.isAnimatingIn = false;
    gsap.killTweensOf(this.coneMeshTween);
    gsap.to(this.coneMeshTween, 0.5, {
      scale: 0,
      ease: 'easeOutExpo',
      onComplete: () => {
        this.coneMeshTween.isAnimatingOut = false;
        this.coneMesh.visible = false;
      }
    });
  }
};

Cursor.prototype.addCollider = function(collider) {
  if(!collider) {
    throw new Error('collider must be a Mesh.');
  }
  this.colliders.push(collider);
};

Cursor.prototype.removeCollider = function(collider) {
  const index = this.colliders.indexOf(collider);
  
  if (index !== -1) {
      this.colliders.splice(index, 1);
  }
};

Cursor.prototype.addColliders = function(colliders) {
  colliders.forEach(this.addCollider.bind(this));
};

module.exports = Cursor;
