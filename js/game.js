//COLORS
var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  pink: 0xF5986E,
  yellow: 0xf4ce93,
  blue: 0x68c3c0,
  darkGreen: 0x006600,
  sky: 0x00ffcc,
  sea: 0x337CCF,
  yellow: 0xffcc00,
  stone: 0x1a0d00,
  clouds: 0xdcffec,
  hitcolor: 0xbb0000
};
var loopSound = null;
///////////////
var hitSound = null;
var coinSound = null;
let animationId;
let isPaused = false;
// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];
var allSpritesMap = new Map();
function resetGame() {
  if (loopSound) {



    loopSound.play(); // Play the sound
  }
  game = {
    speed: 0,
    initSpeed: .00035,
    baseSpeed: .00035,
    targetBaseSpeed: .00035,
    incrementSpeedByTime: .0000025,
    incrementSpeedByLevel: .000005,
    distanceForSpeedUpdate: 100,
    speedLastUpdate: 0,

    distance: 0,
    ratioSpeedDistance: 50,
    energy: 100,
    ratioSpeedEnergy: 3,

    level: 1,
    levelLastUpdate: 0,
    distanceForLevelUpdate: 1000,

    planeDefaultHeight: 100,
    planeAmpHeight: 80,
    planeAmpWidth: 75,
    planeMoveSensivity: 0.005,
    planeRotXSensivity: 0.0008,
    planeRotZSensivity: 0.0004,
    planeFallSpeed: .001,
    planeMinSpeed: 1.2,
    planeMaxSpeed: 1.6,
    planeSpeed: 0,
    planeCollisionDisplacementX: 0,
    planeCollisionSpeedX: 0,

    planeCollisionDisplacementY: 0,
    planeCollisionSpeedY: 0,

    seaRadius: 600,
    seaLength: 800,
    //seaRotationSpeed:0.006,
    wavesMinAmp: 5,
    wavesMaxAmp: 30,
    wavesMinSpeed: 0.001,
    wavesMaxSpeed: 0.005,

    cameraFarPos: 500,
    cameraNearPos: 150,
    cameraSensivity: 0.002,

    coinDistanceTolerance: 15,
    coinValue: 3,
    coinsSpeed: .5,
    coinLastSpawn: 0,
    distanceForCoinsSpawn: 100,

    ennemyDistanceTolerance: 10,
    ennemyValue: 10,
    ennemiesSpeed: .6,
    ennemyLastSpawn: 0,
    distanceForEnnemiesSpawn: 50,
    coinTaken: 0,
    status: "playing",
  };
  fieldLevel.innerHTML = Math.floor(game.level);
  coinTaken.innerHTML = game.coinTaken;

}

//THREEJS RELATED VARIABLES

var scene,
  camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  renderer,
  container,
  controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
  mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  scene.fog = new THREE.Fog(0x000000, 100, 950);

  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleTouchMove(event) {

  var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
  var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
  if (game.status == "waitingReplay") {
    resetGame();
    hideReplay();
  }
}


function handleTouchEnd(event) {
  if (game.status == "waitingReplay") {
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}


var Pilot = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs = 0;

  var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
  var bodyMat = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2, -12, 0);

  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10, 10, 10);
  var faceMat = new THREE.MeshLambertMaterial({ color: Colors.red });
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  var hairGeom = new THREE.BoxGeometry(4, 4, 4);
  var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brownDark });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6);
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0)
  hairs.add(hairBack);
  hairs.position.set(-5, 5, 0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5, 5, 5);
  var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function () {
  //*
  var hairs = this.hairsTop.children;

  var l = hairs.length;
  for (var i = 0; i < l; i++) {
    var h = hairs[i];
    h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
  }
  this.angleHairs += game.speed * deltaTime * 40;
  //*/
}

var AirPlane = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // Cabin

  var geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
  var matCabin = new THREE.MeshPhongMaterial({ color: Colors.darkGreen, shading: THREE.FlatShading });

  geomCabin.vertices[4].y -= 10;
  geomCabin.vertices[4].z += 20;
  geomCabin.vertices[5].y -= 10;
  geomCabin.vertices[5].z -= 20;
  geomCabin.vertices[6].y += 30;
  geomCabin.vertices[6].z += 20;
  geomCabin.vertices[7].y += 30;
  geomCabin.vertices[7].z -= 20;

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Engine

  var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Tail Plane

  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.sky, shading: THREE.FlatShading });
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40, 20, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Wings

  var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.sky, shading: THREE.FlatShading });
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0, 15, 0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
  var matWindshield = new THREE.MeshPhongMaterial({ color: Colors.white, transparent: true, opacity: .3, shading: THREE.FlatShading });;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5, 27, 0);

  windshield.castShadow = true;
  windshield.receiveShadow = true;

  this.mesh.add(windshield);

  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  geomPropeller.vertices[4].y -= 5;
  geomPropeller.vertices[4].z += 5;
  geomPropeller.vertices[5].y -= 5;
  geomPropeller.vertices[5].z -= 5;
  geomPropeller.vertices[6].y += 5;
  geomPropeller.vertices[6].z += 5;
  geomPropeller.vertices[7].y += 5;
  geomPropeller.vertices[7].z -= 5;
  var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  var geomBlade = new THREE.BoxGeometry(1, 80, 10, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8, 0, 0);

  blade1.castShadow = true;
  blade1.receiveShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI / 2;

  blade2.castShadow = true;
  blade2.receiveShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60, 0, 0);
  this.mesh.add(this.propeller);

  var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({ color: Colors.sky, shading: THREE.FlatShading });
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
  wheelProtecR.position.set(25, -20, 25);
  this.mesh.add(wheelProtecR);

  var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
  var wheelTireMat = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
  var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
  wheelTireR.position.set(25, -28, 25);

  var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
  var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
  wheelTireR.add(wheelAxis);

  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z;
  this.mesh.add(wheelProtecL);

  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);

  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5, .5, .5);
  wheelTireB.position.set(-35, -5, 0);
  this.mesh.add(wheelTireB);

  var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0))
  var suspensionMat = new THREE.MeshPhongMaterial({ color: Colors.sky, shading: THREE.FlatShading });
  var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
  suspension.position.set(-35, -5, 0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10, 27, 0);
  this.mesh.add(this.pilot.mesh);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

Sky = function () {
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI * 2 / this.nClouds;
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle * i;
    var h = game.seaRadius + 150 + Math.random() * 200;
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;
    c.mesh.position.z = -300 - Math.random() * 500;
    c.mesh.rotation.z = a + Math.PI / 2;
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function () {
  for (var i = 0; i < this.nClouds; i++) {
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed * deltaTime;

}

Sea = function () {
  var geom = new THREE.CylinderGeometry(game.seaRadius, game.seaRadius, game.seaLength, 40, 10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i = 0; i < l; i++) {
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: game.wavesMinAmp + Math.random() * (game.wavesMaxAmp - game.wavesMinAmp),
      speed: game.wavesMinSpeed + Math.random() * (game.wavesMaxSpeed - game.wavesMinSpeed)
    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.sea,
    transparent: true,
    opacity: .8,
    shading: THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function () {
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i = 0; i < l; i++) {
    var v = verts[i];
    var vprops = this.waves[i];
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    vprops.ang += vprops.speed * deltaTime;
    this.mesh.geometry.verticesNeedUpdate = true;
  }
}

Cloud = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20, 20, 20);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.clouds,

  });

  //*
  var nBlocs = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;
    var s = .1 + Math.random() * .9;
    m.scale.set(s, s, s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function () {
  var l = this.mesh.children.length;
  for (var i = 0; i < l; i++) {
    var m = this.mesh.children[i];
    m.rotation.z += Math.random() * .005 * (i + 1);
    m.rotation.y += Math.random() * .002 * (i + 1);
  }
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
Ennemy = function () {
  var geom = new THREE.TetrahedronGeometry(getRandomNumber(5, 15), 2);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.stone,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function () {
  var nEnnemies = game.level;

  for (var i = 0; i < nEnnemies; i++) {
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i * 0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function () {
  for (var i = 0; i < this.ennemiesInUse.length; i++) {
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

    if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
    ennemy.mesh.rotation.z += Math.random() * .1;
    ennemy.mesh.rotation.y += Math.random() * .1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.ennemyDistanceTolerance) {
      const coinSound = new Audio('img/rockhit.mp3'); // Create a new instance of the audio element
      coinSound.play(); // Play the coin sound
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.hitcolor, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    } else if (ennemy.angle > Math.PI) {
      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function () {
  var geom = new THREE.TetrahedronGeometry(3, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.sea,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function (pos, color, scale) {
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color(color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random() * 2) * 50;
  var targetY = pos.y + (-1 + Math.random() * 2) * 50;
  var speed = .6 + Math.random() * .2;
  TweenMax.to(this.mesh.rotation, speed, { x: Math.random() * 12, y: Math.random() * 12 });
  TweenMax.to(this.mesh.scale, speed, { x: .1, y: .1, z: .1 });
  TweenMax.to(this.mesh.position, speed, {
    x: targetX, y: targetY, delay: Math.random() * .1, ease: Power2.easeOut, onComplete: function () {
      if (_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1, 1, 1);
      particlesPool.unshift(_this);
    }
  });
}

ParticlesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function (pos, density, color, scale) {

  var nPArticles = density;
  for (var i = 0; i < nPArticles; i++) {
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    } else {
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos, color, scale);
  }
}

Coin = function () {
  var geom = new THREE.TetrahedronGeometry(5, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0xffcc00,
    shininess: 1,
    specular: 0xffffff,

    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins) {
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i = 0; i < nCoins; i++) {
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function () {

  var nCoins = 1 + Math.floor(Math.random() * 10);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
  var amplitude = 10 + Math.round(Math.random() * 10);
  for (var i = 0; i < nCoins; i++) {
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    } else {
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i * 0.02);
    coin.distance = d + Math.cos(i * .5) * amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function () {
  for (var i = 0; i < this.coinsInUse.length; i++) {
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed * deltaTime * game.coinsSpeed;
    if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    coin.mesh.rotation.z += Math.random() * .1;
    coin.mesh.rotation.y += Math.random() * .1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.coinDistanceTolerance) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, Colors.yellow, .8);
      addEnergy();
      game.coinTaken++;
      coinTaken.innerHTML = game.coinTaken;
      const coinSound = new Audio('img/coingain.mp3'); // Create a new instance of the audio element
      coinSound.play(); // Play the coin sound

      i--;
    } else if (coin.angle > Math.PI) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);


      i--;

    }
  }
}


// 3D Models
var sea;
var airplane;

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25, .25, .25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins() {

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies() {
  for (var i = 0; i < 10; i++) {
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles() {
  for (var i = 0; i < 10; i++) {
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}
function setTopScore(score) {
  const lastScore = parseInt(localStorage.getItem(`topScore`));
  if (score > lastScore) {
    localStorage.setItem(`topScore`, score);
    document.getElementById("topoftop").innerHTML = "" + score;
  }
}
function getScore() {
  return parseInt(localStorage.getItem(`topScore`));
}
function loop() {
  if (!isPaused) {
    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;

    if (game.status == "playing") {

      // Add energy coins every 100m;
      if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
        game.coinLastSpawn = Math.floor(game.distance);
        coinsHolder.spawnCoins();
      }

      if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
        game.speedLastUpdate = Math.floor(game.distance);
        game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
      }


      if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn) {
        game.ennemyLastSpawn = Math.floor(game.distance);
        ennemiesHolder.spawnEnnemies();
      }

      if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate) {
        game.levelLastUpdate = Math.floor(game.distance);
        game.level++;
        fieldLevel.innerHTML = Math.floor(game.level);

        game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level
      }


      updatePlane();
      updateDistance();
      updateEnergy();
      game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
      game.speed = game.baseSpeed * game.planeSpeed;

    } else if (game.status == "gameover") {
      game.speed *= .99;
      airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * .0002 * deltaTime;
      airplane.mesh.rotation.x += 0.0003 * deltaTime;
      game.planeFallSpeed *= 1.05;
      airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;
      setTopScore(Math.floor(game.distance));
      if (airplane.mesh.position.y < -200) {
        showReplay();
        game.status = "waitingReplay";
        const coinSound = new Audio('img/gameover.mp3'); // Create a new instance of the audio element
        coinSound.play(); // Play the coin sound
        loopSound.pause();
        loopSound.currentTime = 0;
      }
    } else if (game.status == "waitingReplay") {

    }


    airplane.propeller.rotation.x += .2 + game.planeSpeed * deltaTime * .005;
    sea.mesh.rotation.z += game.speed * deltaTime;//*game.seaRotationSpeed;

    if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;

    ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;

    coinsHolder.rotateCoins();
    ennemiesHolder.rotateEnnemies();

    sky.moveClouds();
    sea.moveWaves();

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(loop);
  }

}

function updateDistance() {
  game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502 * (1 - (game.distance % game.distanceForLevelUpdate) / game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);

}

var blinkEnergy = false;

function updateEnergy() {
  game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100 - game.energy) + "%";
  energyBar.style.backgroundColor = (game.energy < 50) ? "#f25346" : "#68c3c0";

  if (game.energy < 30) {
    energyBar.style.animationName = "blinking";
  } else {
    energyBar.style.animationName = "none";
  }

  if (game.energy < 1) {
    game.status = "gameover";
  }
}

function addEnergy() {
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}



function updatePlane() {

  game.planeSpeed = normalize(mousePos.x, -.5, .5, game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
  var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * .7, -game.planeAmpWidth);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;


  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix()
  camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;

  game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

  airplane.pilot.updateHairs();
}

function showReplay() {
  document.getElementById("submit_score").style.display = "block";
  replayMessage.style.display = "flex";
}

function hideReplay() {
  replayMessage.style.display = "none";
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + (pc * dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;
// Create a function to make the POST request
async function postData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json(); // Parse the response as JSON
}
function isUserValid(input) {


  // Criteria 1: No special characters
  const noSpecialCharsRegex = /^[a-zA-Z]*$/;

  return (
    noSpecialCharsRegex.test(input) &&
    input.length >= 4
  );
}


function init(event) {

  // UI
  if (isNaN(getScore())) {
    localStorage.setItem(`topScore`, 0);
    document.getElementById("topoftop").innerHTML = "" + 0;
  } else {
    document.getElementById("topoftop").innerHTML = "" + getScore();
  }

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");
  coinTaken = document.getElementById("coinTaken");
  resetGame();
  createScene();

  createLights();
  createPlane();

  //
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  // document.addEventListener('mouseup', handleMouseUp, false);
  //document.addEventListener('touchend', handleTouchEnd, false);
  if (localStorage.getItem('username')) {
    const inputElement = document.getElementById("score_text");
      const username = localStorage.getItem('username');
      inputElement.value = username;
      inputElement.readOnly = true;
  }
  document.getElementById("replay_gameid").addEventListener('mouseup', (event) => {
    handleMouseUp(event);
  })
  document.getElementById("replay_gameid").addEventListener('mouseup', (event) => {
    handleMouseUp(event);
  })
  document.getElementById("score_text").addEventListener("focus", function () {
    const ele = document.getElementById("user_error");
    ele.style.display = "none"
  });
  document.getElementById("submit_score").addEventListener('click', (event) => {
    // Get the input element by its ID
    const inputElement = document.getElementById("score_text");

    if (inputElement) {
      const inputValue = inputElement.value;

      if (inputValue) {
        if (!isUserValid(inputValue)) {
          const ele = document.getElementById("user_error");
          ele.style.display = "flex"
          ele.innerText = "No special characters are allowed; the username should contain at least 4 characters.";
          return;
        }
        const user_Data = {
          "game_user": inputValue,
          "coins": game.coinTaken,
          "distance": Math.round(game.distance)
        }
        const url = "http://localhost:8080/user/addnewscore";
        postData(url, user_Data)
          .then(data => {
            const ele = document.getElementById("user_error");
            ele.style.display = "flex"
            ele.innerText = "Score Added Successfully";
            document.getElementById("submit_score").style.display = "none";
            if (!localStorage.getItem('username')) {
              localStorage.setItem("username", user_Data.game_user)
            }
          })
          .catch(error => {
            const ele = document.getElementById("user_error");
            ele.style.display = "flex"
            ele.innerText = "Error posting data:" + error;

          });
      } else {
        const ele = document.getElementById("user_error");
        ele.style.display = "flex"
        ele.innerText = "User name is required";
      }
    }

  })
  isMobile();
  loop();
  // Listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, pause the animation
      loopSound.pause();
      loopSound.currentTime = 0;
      cancelAnimationFrame(animationId);
      isPaused = true;
    } else {
      // Page is visible, resume the animation
      loopSound.play();
      isPaused = false;
      loop();
    }
  });
}
function isMobile() {
  // credit to Timothy Huang for this regex test: 
  // https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.getElementById('mainheading').style.display = "none";
    const element = document.getElementById('myHeader');
    element.style.transform = 'scale(0.75)';

    return true
  }
  else {

    return false
  }
}
function getFileName(url) {
  return url.split("/").pop().split(".")[0];
}
async function preloadAssets(soundUrls, textureUrls, onComplete) {
  const totalAssets = soundUrls.length + textureUrls.length;
  const loadingText = document.getElementById("loadingText");
  let loadedCount = 0;

  const loader = new THREE.TextureLoader();


  function progressCallback(progress) {
    loadingText.textContent = `Loading: ${progress}%`;
   // console.log("progress",progress)
    if (progress === 100) {
      onComplete();
    }
  }
  function loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        resolve(audio);
      };
      audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
      audio.src = url;
    });
  }
  for (const url of soundUrls) {
    try {
      const audio = await loadAudio(url);
     // console.log(url);
      progressCallback(Math.floor((++loadedCount / totalAssets) * 100));
    } catch (error) {
      console.error(error);
    }
  }

  function loadTexture(url, index) {
    loader.load(
      url,
      texture => {
        allSpritesMap.set(getFileName(url), texture);
        progressCallback(Math.floor((++loadedCount / totalAssets) * 100));
      },
      undefined,
      error => {
        console.error(`Error loading texture ${url}: ${error}`);
      }
    );
  }

  for (let i = 0; i < textureUrls.length; i++) {
    loadTexture(textureUrls[i], i);
  }

  const audioElements = await Promise.all(audioPromises);
}
//scoring---------------------------------------------

async function loadAllRecords() {
  try {
    // Simulate an API request that returns all records
    const apiResponse = await fetch('http://localhost:8080/user/fetchscores');
    if (!apiResponse.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await apiResponse.json();

    // Create records for all fetched data
    data.sort((a, b) => {
      return a.coins < b.coins ? 1 : -1;
    })
    data.forEach((recordData) => {
      createRecord(recordData);
    });
  } catch (error) {
    console.error('Error loading records:', error);
  }
}

// Function to create a single record
function createRecord(data) {
  // Create a new <div> element for the record
  const record = document.createElement('div');
  record.className = 'record';

  // Assuming the API returns a string for each record
  const userNameDiv = document.createElement('div');
  userNameDiv.textContent = `UserName: ${data['game_user']}`;
  userNameDiv.className = 'user-name'; // Add a class for styling
  record.appendChild(userNameDiv);

  const coinsDiv = document.createElement('div');
  coinsDiv.textContent = `Coins: ${data['coins']}`;
  coinsDiv.className = 'coins'; // Add a class for styling
  record.appendChild(coinsDiv);

  const distanceDiv = document.createElement('div');
  distanceDiv.textContent = `Distance Covered: ${data['distance']}`;
  distanceDiv.className = 'distance'; // Add a class for styling
  record.appendChild(distanceDiv);

  // Append the record <div> to the scoreboard container
  scoreboard.appendChild(record);
}


//scoring---------------------------------------------

async function preLoadData() {
  const loadSounds = [
    'https://cheeseburgercomics.in/game/img/coingain.mp3',
    'https://cheeseburgercomics.in/game/img/gameover.mp3',
    'https://cheeseburgercomics.in/game/img/rockhit.mp3',
    'https://cheeseburgercomics.in/game/img/sound.mp3'
  ];
  const loadTextures = [
    'https://cheeseburgercomics.in/game/css/ravan.png',
    'https://cheeseburgercomics.in/game/css/logo.png',
    'https://cheeseburgercomics.in/game/css/snake.png'
  ];

  preloadAssets(loadSounds, loadTextures, (audioElements, textures) => {
    document.body.removeChild(document.getElementById("loadingContainer"));
    startGame();

  });


  document.getElementById('leaderBoardBtn').addEventListener('click', () => {
    document.getElementById("user_data_board").style.display = "block";
    loadAllRecords();
  });
  document.getElementById('leaderBoardBtn1').addEventListener('click', () => {
    document.getElementById("user_data_board").style.display = "block";
    loadAllRecords();
  });
  document.getElementById('closebtnX').addEventListener('click', () => {
    document.getElementById("user_data_board").style.display = "none";


  });

}
function startGame() {
  const ele = document.getElementById("instoverlay");
  ele.style.display = "flex";
  document.getElementById("closeBtn").addEventListener("mousedown", () => {
    document.body.removeChild(ele);
    loopSound = document.getElementById('loopSound');
    init();
  })
}
function addEvents() {
  preLoadData();

  // Initial check on page load
  checkOrientation();

}


function checkOrientation() {
  const portraitMessage = document.getElementById("portraitMessage");
  if (portraitMessage) {
    if (window.innerHeight > window.innerWidth) {
      portraitMessage.style.display = "flex";
    } else {
      portraitMessage.style.display = "none";
    }
  }

}



// Check orientation on window resize
window.addEventListener("resize", checkOrientation);
window.addEventListener('load', addEvents, false);
