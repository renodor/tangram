import * as THREE from 'three';
import { Vector2 } from 'three';

export default ({ type, size, name }) => {
  const hypotenuse = size * Math.sqrt(2)

  // SHAPE
  const shape  = new THREE.Shape()
  const points = buildPoints(type, size, hypotenuse)
  points.forEach(([x, y], index) => { index == 0 ? shape.moveTo(x,y) : shape.lineTo(x, y) })

  // BOTTOM
  const bottomGeometry = new THREE.ShapeGeometry(shape);
  const bottomMaterial = new THREE.MeshBasicMaterial({ color: 'yellow' })
  const bottomMesh     = new THREE.Mesh(bottomGeometry, bottomMaterial)
  bottomMesh.userData.type = 'bottom'

  // TOP
  const topShape    = shape.clone()
  const topGeometry = new THREE.ShapeGeometry(topShape)
  const topMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeeee })
  const topMesh     = new THREE.Mesh(topGeometry, topMaterial)
  topMesh.scale.set(0.75, 0.75, 0.75)
  topMesh.userData.type = 'top'
  topMesh.position.z = 1.01

  // MAIN
  const mainGeometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  const mainMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1111, wireframe: true })
  const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial)
  mainMesh.userData.type = 'main'

  const displayedPoints = new THREE.Points(mainGeometry)

  // POLYGON
  const polygon = new THREE.Group()
  polygon.userData.type = type
  polygon.name = name
  polygon.add(bottomMesh)
  polygon.add(topMesh)
  polygon.add(mainMesh)
  // polygon.add(displayedPoints)

  centerPolygon(polygon, size, hypotenuse)
  addCollisionPointsToPolygon(polygon, points, size, hypotenuse)

  return polygon
}

const buildPoints = (type, size, hypotenuse) => {
  switch (type) {
    case 'triangle':
      return [
        [-(hypotenuse / 2), 0],
        [(hypotenuse / 2), 0],
        [0, hypotenuse / 2]
      ]
    case 'cube':
      return [
        [0, 0],
        [size, 0],
        [size, size],
        [0, size]
      ]
  }
}

const centerPolygon = (polygon, size, hypotenuse) => {
  switch (polygon.userData.type) {
    case 'triangle':
      polygon.children.forEach((children) => children.geometry.translate(...centerTrianglePoint([0, 0, 0], hypotenuse)))
      break;
    case 'cube':
      polygon.children.forEach((children) => children.geometry.translate(...centerCubePoint([0, 0, 0], size)))
      break;
  }
}
const centerTrianglePoint = ([x, y, z], hypotenuse) => ([x, y - ((hypotenuse / 2) / 3), z])
const centerCubePoint = ([x, y, z], size) => ([x - (size / 2), y - (size / 2), z])

const addCollisionPointsToPolygon = (polygon, points, size, hypotenuse) => {
  // Add more points to polygon to detect collisions
  let collisionPoints = []
  switch (polygon.userData.type) {
    case 'triangle':
      points.forEach(([x, y], index) => {
        collisionPoints.push()
        switch (index) {
          case 0:
            collisionPoints.push(
              [x, y],
              [x + 0.5, 0],
              [x + 1, 0],
              [x + 1.5, 0],
              [0, 0],
            )
            break;
          case 1:
            collisionPoints.push(
              [x - 1.5, 0],
              [x - 1, 0],
              [x - 0.5, 0],
              [x, y],
              [x - 0.5, y + 0.5],
              [x - 1, y + 1],
              [x - 1.5, y + 1.5],
              [hypotenuse / 4, hypotenuse / 4]
            )
            break;
          case 2:
            collisionPoints.push(
              [x + 1.5, y - 1.5],
              [x + 1, y - 1],
              [x + 0.5, y - 0.5],
              [x, y],
              [x - 0.5, y - 0.5],
              [x - 1, y - 1],
              [x - 1.5, y - 1.5],
              [-(hypotenuse / 4), hypotenuse / 4],
              [points[0][0] + 1.5, points[0][1] + 1.5],
              [points[0][0] + 1, points[0][1] + 1],
              [points[0][0] + 0.5, points[0][1] + 0.5],
            )
        }
      })

      collisionPoints.push(points[0])
      collisionPoints = collisionPoints.map(([x, y]) => centerTrianglePoint([x, y, 0], hypotenuse))
      break;
    case 'cube':
      points.forEach(([x, y], index) => {
        collisionPoints.push()
        switch (index) {
          case 0:
            collisionPoints.push(
              [x, y],
              [size / 2, 0]
            )
          case 1:
            collisionPoints.push(
              [x, y],
              [size, size / 2]
            )
          case 2:
            collisionPoints.push(
              [x, y],
              [size / 2, size]
            )
          case 3:
            collisionPoints.push(
              [x, y],
              [0, size / 2],
            )
        }
      })

      collisionPoints.push(points[0])
      collisionPoints = collisionPoints.map(([x, y]) => centerCubePoint([x, y, 0], size))
      break;
  }
  polygon.userData.originalPoints = collisionPoints
  polygon.userData.currentPoints = collisionPoints
}