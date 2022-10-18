import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import polygonBuilder from './polygonBuilder.js'

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
scene.add(axesHelper);

// const controls = new OrbitControls(camera, renderer.domElement)

// PLANE
const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.name = 'plane'
// scene.add(plane);

// CUBE
const cube = polygonBuilder({
  points: [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]],
  name: 'cube'
})
scene.add(cube)

// TRIANGLES
const triangle = polygonBuilder({
  isTriangle: true,
  size: 10,
  name: 'triangle'
})
scene.add(triangle)

const bigTriangle = polygonBuilder({
  isTriangle: true,
  size: 20,
  name: 'bigTriangle'
})
scene.add(bigTriangle)

const polygons = [cube, triangle, bigTriangle]



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
  const intersection = raycaster.intersectObjects(polygons)[0];

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

  if (currentMovingObject.userData.type == 'top') {
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