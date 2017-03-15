const THREE = require('three');
const colorVertices = require('../utils/colorVertices');

var __geometry;
function __getGeometry() {
  if(!__geometry) {
    var geom = new THREE.Geometry();
    var cutTarget = geom;

    var colorBlack = new THREE.Color(0x232323);
    var colorGray = new THREE.Color(0xbbbbbbb);

    var deviceWidth  = 0.038;
    var deviceLength  = 0.119;
    var deviceRadius = deviceWidth * 0.5;
    var crackSize = 0.001;
    var smallCrack = 0.0005;
    var perimeterSegments = 32;
    var buttonPerimeterSegments = 16;
    var buttonRadius = deviceRadius / 3;
    var pullAmt = deviceLength - deviceWidth;
    var middleOfController = pullAmt * 0.5;
    var slightTurn = true;

    var boxInner = new THREE.BoxGeometry(deviceWidth, deviceRadius, deviceLength, 1, 1, 1);
    colorVertices(boxInner, colorGray);
    // var boxInnerMatrix = (new THREE.Matrix4()).makeTranslation(9/15, 0, 0);
    // boxInner.applyMatrix(boxInnerMatrix);
    // geom.merge(boxInner);

    var points = [new THREE.Vector2(0, -0.038 * 0.5)]; //bottom middle of controller profile in mm
    var edgeSkip = 0;
    var lastEdgeSkip = 0;
    function getLastPoint() {
      return points[points.length-1];
    }
    function appendOffset(x, y) {
      edgeSkip++;
      var p = getLastPoint().clone();
      p.x += x;
      p.y += y;
      points.push(p);
    }
    function appendCurveAround(pivot, thetaLength, segs) {
      edgeSkip += segs;
      var diff = getLastPoint().clone().sub(pivot);
      var radius = diff.length();
      var thetaStart = Math.atan2(diff.y, diff.x);
      for (var i = 1; i <= segs; i++) {
        var ratio = thetaStart + thetaLength * i/segs;
        var p = pivot.clone();
        p.x += Math.cos(ratio) * radius;
        p.y += Math.sin(ratio) * radius;
        points.push(p);
      }
    }
    function cut(color, reverse) {
      lastEdgeSkip = edgeSkip;
      edgeSkip = 1;
      if(reverse) points.reverse();
      var lathedGeom = new THREE.LatheGeometry( points, perimeterSegments, Math.PI * 1.5 + (slightTurn ? Math.PI / perimeterSegments : 0));
      if(reverse) points.reverse();
      colorVertices(lathedGeom, color || colorGray);
      var tempPoint = getLastPoint();
      points.length = 0;
      points.push(tempPoint);
      // lathedGeom.computeVertexNormals();
      // lathedGeom.computeFaceNormals();
      cutTarget.merge(lathedGeom);
    }
    //curved body back and front edges
    appendCurveAround(new THREE.Vector2(0, 0), Math.PI * 0.5, 8);
    appendOffset(0, crackSize);
    cut();
    appendOffset(-crackSize * 2, 0);
    cut();
    appendOffset(0, crackSize);
    cut(colorBlack);
    appendOffset(crackSize * 2, 0);
    cut();
    appendOffset(0, crackSize);
    var pivot = getLastPoint().clone();
    pivot.x -= crackSize;
    appendCurveAround(pivot, Math.PI * 0.5, 2);
    appendOffset(-crackSize * 0.5, 0);
    cut();

    var vertices = geom.vertices;


    //faceplate with circle button holes
    var indices = [];

    var j = vertices.length-1;
    for (var i = 0; i < perimeterSegments; i++) {
      indices.push(j);
      j -= lastEdgeSkip;
    }

    var circleDepth = vertices[indices[0]].y;
    var circlePoints = indices.map(function(i) {
      return new THREE.Vector2(vertices[i].x, vertices[i].z);
    });

    geom.vertices.forEach(function(v, i) {
      if(v.z > 0) {
        v.z += pullAmt;
      }
    });

    var circlePoints2 = indices.map(function(i) {
      return new THREE.Vector2(vertices[i].x, vertices[i].z);
    });

    var circleTopHalfPoints = circlePoints.slice(circlePoints2.length * 0.5, circlePoints2.length);
    circleTopHalfPoints.reverse();
    var circleBottomHalfPoints = circlePoints2.slice(circlePoints2.length * 0.5, circlePoints2.length);
    var faceplateShapePoints = circleTopHalfPoints.concat(circleBottomHalfPoints);
    faceplateShapePoints.push(faceplateShapePoints[0])

    function makeButtonCircle(offsetY) {
      var circleHolePoints = [];
      for (var i = 0; i < buttonPerimeterSegments; i++) {
        var ratio = i / buttonPerimeterSegments;
        var radians = ratio * Math.PI * 2;
        circleHolePoints.push(new THREE.Vector2(Math.cos(radians) * buttonRadius, Math.sin(radians) * buttonRadius + offsetY));
      }
      circleHolePoints.push(circleHolePoints[0]);
      circleHolePoints.reverse();
      var shape = new THREE.Shape(circleHolePoints);
      shape.center = new THREE.Vector2(0, offsetY);
      return shape;
    }

    var buttonOffset = 0.009;
    var circleHole = makeButtonCircle(middleOfController - buttonOffset);
    var circleHole2 = makeButtonCircle(middleOfController + buttonOffset);


    var shape = new THREE.Shape(faceplateShapePoints);
    shape.holes.push(circleHole);
    shape.holes.push(circleHole2);
    var shapeGeometry = new THREE.ShapeGeometry(shape);
    var rotateMatrix = (new THREE.Matrix4()).makeRotationFromEuler(new THREE.Euler(Math.PI * 0.5, Math.PI, 0));
    var translateMatrix = (new THREE.Matrix4()).makeTranslation(0, circleDepth, 0);
    shapeGeometry.applyMatrix(rotateMatrix);
    shapeGeometry.applyMatrix(translateMatrix);
    colorVertices(shapeGeometry, colorGray);
    geom.merge(shapeGeometry);

    //scroll pad indentation
    points.length = 0;
    points.push(new THREE.Vector2(0, 0.001));
    appendCurveAround(new THREE.Vector2(0, 0.05), -Math.PI * 0.113, 6);
    appendOffset(-crackSize, 0);
    cut(null, true);

    slightTurn = false;

    //top small button
    var buttonGeom = new THREE.Geometry();
    cutTarget = buttonGeom;
    points.push(new THREE.Vector2(0, circleDepth));
    appendOffset(buttonRadius - smallCrack * 2, 0);
    appendOffset(smallCrack, 0);
    appendOffset(0, -smallCrack * 3);
    appendOffset(smallCrack, 0);
    appendOffset(smallCrack, smallCrack * 3);
    cut(colorBlack, true);
    var box = new THREE.BoxGeometry(0.005, 0.0099, 0.00066, 1, 1, 1);
    colorVertices(box, colorGray);
    buttonGeom.merge(box);
    var translateMatrix = (new THREE.Matrix4()).makeTranslation(0, 0, circleHole.center.y);
    buttonGeom.applyMatrix(translateMatrix);
    geom.merge(buttonGeom);

    //bottom small button
    var button2Geom = new THREE.Geometry();
    cutTarget = button2Geom;
    points.push(new THREE.Vector2(0, 0.0025));
    var pivot = new THREE.Vector2(0, 0.013);
    appendCurveAround(pivot, Math.PI * 0.13 * 0.65, 2);
    cut(colorBlack, true);
    appendOffset(0, -crackSize);
    cut(null, true);
    appendOffset(crackSize * 0.666, smallCrack*0.5);
    cut(null, true);
    appendOffset(0, crackSize);
    cut(null, true);
    appendCurveAround(pivot, Math.PI * 0.13 * 0.5, 2);
    appendOffset(smallCrack, 0);
    appendOffset(0, -smallCrack * 3);
    appendOffset(smallCrack, 0);
    appendOffset(0, 0.0016);
    cut(colorBlack, true);
    var translateMatrix = (new THREE.Matrix4()).makeTranslation(0, 0, circleHole2.center.y);
    button2Geom.applyMatrix(translateMatrix);
    geom.merge(button2Geom);

    var translateMatrix = (new THREE.Matrix4()).makeTranslation(0, 0, -pullAmt * 0.5);
    geom.applyMatrix(translateMatrix);
    // var sizeMatrix = (new THREE.Matrix4()).makeScale(30, 30, 30);
    // var elevateMatrix = (new THREE.Matrix4()).makeTranslation(0, 2.5, 0);
    // var rotateMatrix = (new THREE.Matrix4()).makeRotationFromEuler(new THREE.Euler(Math.PI * 0.35, 0, 0));
    // geom.applyMatrix(sizeMatrix);
    // geom.applyMatrix(rotateMatrix);
    // geom.applyMatrix(elevateMatrix);
    // geom.computeFaceNormals();
    __geometry = geom;
  }
  return __geometry;
}

module.exports = __getGeometry;
