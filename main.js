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
const patternRef = tangram.mediumTriangle

console.log(tangram.parallelogram.scale)
console.log(tangram.parallelogram.userData.currentPoints[0])

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

canvas.addEventListener('dblclick', onDoubleClick)
canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp);

document.getElementById('pattern-reveal').addEventListener('click', event => {
  console.log(JSON.stringify(revealPattern()))
});

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

function onDoubleClick(event) {
  setPointer(event.clientX, event.clientY)

  raycaster.setFromCamera(pointer, camera)
  const polygonIntersection = raycaster.intersectObjects(tangram.polygons)[0];

  if (polygonIntersection) {
    const movingPolygon = polygonIntersection.object.parent
    if (movingPolygon.userData.type == 'parallelogram') {
      flipPolygon(movingPolygon)
      movingPolygon.updateMatrixWorld()
      updatePolygonPoints(movingPolygon)
      checkCollisions(movingPolygon)
    }
  }
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

    updatePolygonPoints(currentMovingPolygon)
    checkCollisions()

    if (!tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
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

function checkCollisions() {
  tangram.polygons.forEach((polygon) => removeCollisionToPolygon(polygon))

  tangram.polygons.forEach((polygon) => {
    tangram.polygons.forEach((polygon2) => {
      if (polygon != polygon2) {
        const collision = polygon.userData.currentPoints.some(([x, y]) => pointIsWithinPolygon(polygon2.userData.currentPoints, x, y))
        if (collision) {
          addCollisionToPolygon(polygon)
          addCollisionToPolygon(polygon2)
        }
      }
    })
  })
}

function addCollisionToPolygon(polygon) {
  polygon.userData.isColliding = true
  polygon.children[1].material.color.setHex(0x808080)
}

function removeCollisionToPolygon(polygon) {
  polygon.userData.isColliding = false
  polygon.children[1].material.color.setHex(0xfff1111)
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
}

function polygonVerticesToPatternRefLocal(polygon) {
  return polygon.userData.verticesIndexes.map((index) => {
    const vertex = polygon.userData.currentPoints[index]
    coordinate.set(vertex[0], vertex[1])
    patternRef.worldToLocal(coordinate)
    return [coordinate.x, coordinate.y]
  })
}

function checkPattern() {
  for (const [key, value] of Object.entries(patterns)) {
    const polygonsMatchPattern = tangram.polygons.every((polygon) => {
      if (polygon == patternRef) { return true }

      return polygonVerticesToPatternRefLocal(polygon).every(([polygonX, polygonY], index) => {
        if (polygon.userData.duplicated) {
          return value[polygon.name].some((patternPoints) => {
            const xDiff = Math.abs(polygonX - patternPoints[index][0])
            const yDiff = Math.abs(polygonY - patternPoints[index][1])
            return (xDiff <= 2) && (yDiff <= 2)
          })
        } else {
          return value[polygon.name].some(([patternX, patternY]) => {
            const xDiff = Math.abs(polygonX - patternX)
            const yDiff = Math.abs(polygonY - patternY)

            // console.log({
            //   xDiff: xDiff,
            //   yDiff: yDiff,
            //   polygonX: polygonX,
            //   polygonY: polygonY,
            //   patternX: patternX,
            //   patternY: value[polygon.name][index][1],
            //   result: (xDiff <= 2) && (yDiff <= 2)
            // })
            return (xDiff <= 2) && (yDiff <= 2)
          })

        }
      })
    })

    if (polygonsMatchPattern) { console.log(`Bravo you found "${key.toUpperCase()}" pattern!`) }
  }
}

function roundAtTwoDecimal(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

function revealPattern() {
  const pattern = {}
  tangram.polygons.forEach((polygon) => {
    const roundedVertices = polygonVerticesToPatternRefLocal(polygon).map(([x, y]) => [roundAtTwoDecimal(x), roundAtTwoDecimal(y)])
    if (polygon.userData.duplicated) {
      if (polygon.name in pattern) {
        pattern[polygon.name].push(roundedVertices)
      } else {
        pattern[polygon.name] = [roundedVertices]
      }
    } else {
      pattern[polygon.name] = roundedVertices
    }
  })

  return pattern
}

function flipPolygon(polygon) {
  polygon.scale.x *= -1
}