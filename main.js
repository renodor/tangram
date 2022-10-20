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

const bigTriangle = polygonBuilder({
  type: 'triangle',
  size: 20,
  name: 'bigTriangle'
})
scene.add(bigTriangle)

// Collision
const coordinate = new THREE.Vector3()

const polygons = [bigTriangle, triangle, cube]

// RAYCASTER
const raycaster         = new THREE.Raycaster()
const pointer           = new THREE.Vector2()
const localIntersection = new THREE.Vector2()

// CURRENT OBJECT
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
    currentMovingPolygon = intersection.object
    currentMovingPolygon.parent.position.z = 1
    const bottom = currentMovingPolygon.parent.children.find(children => children.userData.type == 'bottom')
    if (bottom) {
      bottom.position.z -= 1
    }
    canvas.addEventListener('pointermove', onPointerMove)
  }
}

function onPointerUp() {
  canvas.removeEventListener('pointermove', onPointerMove)

  if (currentMovingPolygon) {
    currentMovingPolygon.parent.position.z = 0
    const bottom = currentMovingPolygon.parent.children.find(children => children.userData.type == 'bottom')
    bottom.position.z = 0

    updatePolygonPoints(currentMovingPolygon.parent)
    if (collision(currentMovingPolygon.parent)) {
      console.log('booom')
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

  if (currentMovingPolygon.userData.type == 'top') {
    dragObject(planeIntersectionPoint)
  } else {
    rotateObject(planeIntersectionPoint)
  }
}

function dragObject(planeIntersectionPoint) {
  currentMovingPolygon.parent.position.x = planeIntersectionPoint.x
  currentMovingPolygon.parent.position.y = planeIntersectionPoint.y
}

function rotateObject(planeIntersectionPoint) {
  localIntersection.x = planeIntersectionPoint.x - currentMovingPolygon.parent.position.x
  localIntersection.y = planeIntersectionPoint.y - currentMovingPolygon.parent.position.y

  currentMovingPolygon.parent.rotation.z = localIntersection.angle()
}

function updatePolygonPoints(polygon) {
  const currentPoints = polygon.userData.originalPoints.map(([x, y]) => {
    coordinate.set(x, y)
    polygon.localToWorld(coordinate)
    return [coordinate.x, coordinate.y]
  })
  polygon.userData.currentPoints = currentPoints
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