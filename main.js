import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Tangram from './tangram.js'
import patterns from './patterns.json' assert { type: 'json' };

// INIT
const canvas    = document.getElementById('bg')
const scene     = new THREE.Scene()
const camera    = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer  = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.z = 50

// HELPERS
const grid = new THREE.GridHelper(100, 100);
grid.name = 'grid'
grid.rotation.x = Math.PI / 2;
scene.add(grid);

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

// PLANE
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const tangram = new Tangram(20)
const cube = tangram.cube

tangram.polygons.forEach((polygon) => scene.add(polygon))

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Collision
const coordinate = new THREE.Vector3()

// RAYCASTER
const raycaster              = new THREE.Raycaster()
const worldPosition          = new THREE.Vector3()
const pointer                = new THREE.Vector2()
const offset                 = new THREE.Vector2()
const planeIntersectionPoint = new THREE.Vector2()
const localIntersection      = new THREE.Vector2()

let currentMovingPolygon

canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp);

animate();

function animate() {
  requestAnimationFrame(animate)
  orbitControls.update()
  renderer.render(scene, camera)
}

function setPointer(x, y) {
  pointer.set(
    (x / canvas.width) * 2 - 1,
    - (y / canvas.height) * 2 + 1
  )
}


function onPointerDown(event) {
  setPointer(event.clientX, event.clientY)

  raycaster.setFromCamera(pointer, camera)
  const polygonIntersection = raycaster.intersectObjects(tangram.polygons)[0];

  if (polygonIntersection) {
    orbitControls.enabled = false

    const movementType = polygonIntersection.object.userData.type == 'top' ? 'drag' : 'rotate'

    currentMovingPolygon = polygonIntersection.object.parent
    currentMovingPolygon.userData.movementType = movementType
    currentMovingPolygon.userData.savedPosition = currentMovingPolygon.position.clone()
    currentMovingPolygon.userData.savedRotation = currentMovingPolygon.rotation.z

    offset.copy(polygonIntersection.point).sub(worldPosition.setFromMatrixPosition(currentMovingPolygon.matrixWorld));

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
    orbitControls.enabled = true
  }
}

function onPointerMove(event) {
  setPointer(event.clientX, event.clientY)

  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(plane, planeIntersectionPoint);

  if (currentMovingPolygon.userData.movementType == 'drag') {
    dragObject(planeIntersectionPoint)
  } else {
    rotateObject(planeIntersectionPoint)
  }
}

function dragObject(planeIntersectionPoint) {
  currentMovingPolygon.position.x = planeIntersectionPoint.x - offset.x
  currentMovingPolygon.position.y = planeIntersectionPoint.y - offset.y
}

function rotateObject(planeIntersectionPoint) {
  localIntersection.subVectors(planeIntersectionPoint, currentMovingPolygon.position)
  currentMovingPolygon.rotation.z = currentMovingPolygon.userData.savedRotation + (localIntersection.angle() - offset.angle())
}

function updatePolygonPoints(polygon) {
  polygon.userData.currentPoints = polygon.userData.originalPoints.map(([x, y]) => {
    coordinate.set(x, y)
    polygon.localToWorld(coordinate)
    return [coordinate.x, coordinate.y]
  })
}

function collision(movingPolygon) {
  const possibleCollindingPolygons = tangram.polygons.filter((polygon) => polygon != movingPolygon)

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

function polygonVerticesToCubeLocal(polygon) {
  return polygon.userData.verticesIndexes.map((index) => {
    const vertex = polygon.userData.currentPoints[index]
    coordinate.set(vertex[0], vertex[1])
    cube.worldToLocal(coordinate)
    return [coordinate.x, coordinate.y]
  })
}

function checkPattern() {
  const result = tangram.polygons.every((polygon) => {
    if (polygon.name == 'cube') { return true }

    return polygonVerticesToCubeLocal(polygon).every(([x, y], index) => {
      return (Math.round(x) == Math.round(patterns[polygon.name][index][0])) && (Math.round(y) == Math.round(patterns[polygon.name][index][1]))
    })
  })

  if (result) { console.log('Braaaaaavo') }
}