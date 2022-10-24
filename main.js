import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import polygonBuilder from './polygonBuilder.js'
import patterns from './patterns.json' assert { type: 'json' };

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

const controls = new OrbitControls(camera, renderer.domElement)

// PLANE
const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.name = 'plane'
// scene.add(plane);

//Build polygons

const cube = polygonBuilder({
  type: 'cube',
  size: 10,
  name: 'cube'
})
scene.add(cube)

const triangle = polygonBuilder({
  type: 'triangle',
  size: 10,
  name: 'triangle'
})
scene.add(triangle)

// const bigTriangle = polygonBuilder({
//   type: 'triangle',
//   size: 20,
//   name: 'bigTriangle'
// })
// scene.add(bigTriangle)

// Collision
const coordinate = new THREE.Vector3()

const polygons = [triangle, cube]

// RAYCASTER
const raycaster         = new THREE.Raycaster()
const pointer           = new THREE.Vector2()
const localIntersection = new THREE.Vector2()

// CURRENT OBJECT
let movementType
let currentMovingPolygon

canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp);

animate();

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function onPointerDown(event) {
  pointer.x = (event.clientX / canvas.width) * 2 - 1;
  pointer.y = - (event.clientY / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera)
  const intersection = raycaster.intersectObjects(polygons)[0];

  if (intersection) {
    controls.enabled = false

    movementType = intersection.object.userData.type == 'top' ? 'drag' : 'rotate'
    currentMovingPolygon = intersection.object.parent
    currentMovingPolygon.userData.savedPosition = currentMovingPolygon.position.clone()
    currentMovingPolygon.userData.savedRotation = currentMovingPolygon.rotation.z
    currentMovingPolygon.position.z = 1

    canvas.addEventListener('pointermove', onPointerMove)
  }
}

function onPointerUp() {
  canvas.removeEventListener('pointermove', onPointerMove)

  if (currentMovingPolygon) {
    currentMovingPolygon.position.z = 0

    const savedCurrentPoints = currentMovingPolygon.userData.currentPoints
    updatePolygonPoints(currentMovingPolygon)
    if (collision(currentMovingPolygon)) {
      currentMovingPolygon.userData.currentPoints = savedCurrentPoints
      currentMovingPolygon.position.x = currentMovingPolygon.userData.savedPosition.x
      currentMovingPolygon.position.y = currentMovingPolygon.userData.savedPosition.y
      currentMovingPolygon.rotation.z = currentMovingPolygon.userData.savedRotation
    } else {
      checkPattern()
    }

    currentMovingPolygon = null
    controls.enabled = true
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / canvas.width) * 2 - 1;
  pointer.y = - (event.clientY / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const planeIntersectionPoint = raycaster.intersectObject(plane)[0].point;

  if (movementType == 'drag') {
    dragObject(planeIntersectionPoint)
  } else {
    rotateObject(planeIntersectionPoint)
  }
}

function dragObject(planeIntersectionPoint) {
  currentMovingPolygon.position.x = planeIntersectionPoint.x
  currentMovingPolygon.position.y = planeIntersectionPoint.y
}

function rotateObject(planeIntersectionPoint) {
  localIntersection.x = planeIntersectionPoint.x - currentMovingPolygon.position.x
  localIntersection.y = planeIntersectionPoint.y - currentMovingPolygon.position.y

  currentMovingPolygon.rotation.z = localIntersection.angle()
}

function updatePolygonPoints(polygon) {
  polygon.userData.currentPoints = polygon.userData.originalPoints.map(([x, y]) => {
    coordinate.set(x, y)
    polygon.localToWorld(coordinate)
    return [coordinate.x, coordinate.y]
  })

  polygon.userData.vertices = polygon.userData.originalPoints.map(([x, y]) => {
    coordinate.set(x, y)
    polygon.localToWorld(coordinate)
    return [coordinate.x, coordinate.y]
  })
}

function collision(movingPolygon) {
  const possibleCollindingPolygons = polygons.filter((polygon) => polygon != movingPolygon)

  const movingPolygonIsWithinAnotherOne = movingPolygon.userData.currentPoints.some(([x, y]) => {
    return possibleCollindingPolygons.some((possibleCollidingObject) => {
      return pointIsWithinPolygon(possibleCollidingObject.userData.currentPoints, x, y)
    })
  })

  if (movingPolygonIsWithinAnotherOne) { return true }

  return possibleCollindingPolygons.some((possibleCollindingObject) => {
    return possibleCollindingObject.userData.currentPoints.some(([x, y]) => {
      return pointIsWithinPolygon(movingPolygon.userData.currentPoints, x, y)
    })
  })
}

function pointIsWithinPolygon (polygonPoints, x, y) {
  let windingNumber = 0; // winding number
  polygonPoints.slice(0, -1).forEach(([polygonX, polygonY], index) => {
    const [nextPolygonX, nextPolygonY] = polygonPoints[index + 1]
    const above = polygonY <= y;
    const side = (nextPolygonX - polygonX) * (y - polygonY) - (x - polygonX) * (nextPolygonY - polygonY) // if > 0 --> left / if == 0 --> on / if < 0 --> right

    if (above && nextPolygonY > y && side > 0) {
      windingNumber++
    } else if (!above && nextPolygonY <= y && side < 0) {
      windingNumber--
    }
  })

  return windingNumber != 0
};

function polygonVertices(polygon) {
  return polygon.userData.verticesIndexes.map((index) => polygon.userData.currentPoints[index])
}

function checkPattern() {
  const result = polygons.every((polygon) => {
    const currentVertices = polygonVertices(polygon)
    if (polygon.name == 'cube') {
      console.log(currentVertices[0], polygon.userData.originalPoints[0])
    }
    return patterns[polygon.name].every(([x, y], index) => {
      const roundedVertex = currentVertices[index].map((number) => Math.round(number))
      return (Math.round(x) == roundedVertex[0]) && (Math.round(y) == roundedVertex[1])
    })
  })

  if (result) { console.log('Braaaaaavo') }
}