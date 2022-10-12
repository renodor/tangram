import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// INIT
const canvas    = document.getElementById('bg')
const scene     = new THREE.Scene()
const camera    = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer  = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.z = 30

// HELPERS
const grid = new THREE.GridHelper(100, 100);
grid.name = 'grid'
grid.rotation.x = Math.PI / 2;
scene.add(grid);

const axesHelper = new THREE.AxesHelper(100);
// scene.add(axesHelper);

// const controls = new OrbitControls(camera, renderer.domElement)

// PLANE
const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.name = 'plane'
// scene.add(plane);

// CUBE
const cubeShape = new THREE.Shape()
  .moveTo(0, 0)
  .lineTo(10, 0)
  .lineTo(10, 10)
  .lineTo(0, 10)
  .lineTo(0, 0)

const cubeBottomGeometry = new THREE.ShapeGeometry(cubeShape);
cubeBottomGeometry.center();
const cubeBottomMaterial = new THREE.MeshBasicMaterial({ color: 'yellow' })
const cubeBottomMesh = new THREE.Mesh(cubeBottomGeometry, cubeBottomMaterial)
cubeBottomMesh.userData.type = 'bottom'

const cubeGeometry = new THREE.ExtrudeGeometry(cubeShape, { depth: 1, bevelEnabled: false });
cubeGeometry.center();
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1111, wireframe: true })
const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
cubeMesh.position.z = 0.5

const cubeTopShape = new THREE.Shape()
  .moveTo(0, 0)
  .lineTo(8, 0)
  .lineTo(8, 8)
  .lineTo(0, 8)
  .lineTo(0, 0)

const cubeTopGeometry = new THREE.ShapeGeometry(cubeTopShape)
cubeTopGeometry.center();
const cubeTopMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeeee })
const cubeTopMesh = new THREE.Mesh(cubeTopGeometry, cubeTopMaterial)
cubeTopMesh.userData.type = 'drag-target'
cubeTopMesh.position.z = 1.01

const cube = new THREE.Group()
cube.name = 'cube'
cube.add(cubeBottomMesh)
cube.add(cubeMesh)
cube.add(cubeTopMesh)
scene.add(cube)

const box = new THREE.Box3();
const triangleBox = new THREE.Triangle();

// TRIANGLES
const triangle = buildTriangle(10)
scene.add(triangle)


// RAYCASTER
const raycaster         = new THREE.Raycaster()
const pointer           = new THREE.Vector2()
const localIntersection = new THREE.Vector2()

// CURRENT OBJECT
let currentMovingObject

canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp);

animate();

function animate() {
  requestAnimationFrame(animate)
  // controls.update()
  renderer.render(scene, camera)
}

function onPointerDown(event) {
  pointer.x = (event.clientX / canvas.width) * 2 - 1;
  pointer.y = - (event.clientY / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera)
  const intersection = raycaster.intersectObjects([cube, triangle])[0];

  if (intersection) {
    currentMovingObject = intersection.object
    currentMovingObject.parent.position.z = 1
    const bottom = currentMovingObject.parent.children.find(children => children.userData.type == 'bottom')
    if (bottom) {
      bottom.position.z -= 1
    }
    canvas.addEventListener('pointermove', onPointerMove)
  }
}

function onPointerUp() {
  canvas.removeEventListener('pointermove', onPointerMove)
  currentMovingObject.parent.position.z = 0
  const bottom = currentMovingObject.parent.children.find(children => children.userData.type == 'bottom')
  if (bottom) {
    bottom.position.z = 0
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / canvas.width) * 2 - 1;
  pointer.y = - (event.clientY / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const planeIntersectionPoint = raycaster.intersectObject(plane)[0].point;

  console.log(currentMovingObject)
  if (currentMovingObject.userData.type == 'drag-target') {
    dragObject(planeIntersectionPoint)
  } else {
    rotateObject(planeIntersectionPoint)
  }
}

function dragObject(planeIntersectionPoint) {
  currentMovingObject.parent.position.x = planeIntersectionPoint.x
  currentMovingObject.parent.position.y = planeIntersectionPoint.y
}

function rotateObject(planeIntersectionPoint) {
  localIntersection.x = planeIntersectionPoint.x - currentMovingObject.parent.position.x
  localIntersection.y = planeIntersectionPoint.y - currentMovingObject.parent.position.y

  currentMovingObject.parent.rotation.z = localIntersection.angle()
}

function buildTriangle(size) {
  let hypotenuse = size * Math.sqrt(2)

  const triangleShape = new THREE.Shape()
    .moveTo(-(hypotenuse / 2), 0)
    .lineTo((hypotenuse / 2), 0)
    .lineTo(0, hypotenuse / 2)

  const triangleBottomGeometry = new THREE.ShapeGeometry(triangleShape);
  triangleBottomGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
  const triangleBottomMaterial = new THREE.MeshBasicMaterial({ color: 'yellow' })
  const triangleBottomMesh = new THREE.Mesh(triangleBottomGeometry, triangleBottomMaterial)
  triangleBottomMesh.userData.type = 'bottom'

  const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, { depth: 1, bevelEnabled: false });
  triangleGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
  const triangleMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1111, wireframe: true })
  const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial)

  hypotenuse = (size - 2) * Math.sqrt(2)

  const triangleTopShape = new THREE.Shape()
    .moveTo(-(hypotenuse / 2), 0)
    .lineTo((hypotenuse / 2), 0)
    .lineTo(0, hypotenuse / 2)

  const triangleTopGeometry = new THREE.ShapeGeometry(triangleTopShape)
  triangleTopGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
  const triangleTopMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeeee })
  const triangleTopMesh = new THREE.Mesh(triangleTopGeometry, triangleTopMaterial)
  triangleTopMesh.userData.type = 'drag-target'
  triangleTopMesh.position.z = 1.01

  const triangle = new THREE.Group()
  triangle.name = 'triangle'
  triangle.add(triangleBottomMesh)
  triangle.add(triangleMesh)
  triangle.add(triangleTopMesh)

  return triangle
}