import * as THREE from 'three';

export default ({ type, size, name }) => {
  const hypotenuse = size * Math.sqrt(2)

  // SHAPE
  const shape  = new THREE.Shape()
  const points = buildPoints(type, size, hypotenuse)
  points.forEach(([x, y], index) => { index == 0 ? shape.moveTo(x,y) : shape.lineTo(x, y) })

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
  const mainMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1111, wireframe: false })
  const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial)
  mainMesh.userData.type = 'main'

  // POLYGON
  const polygon = new THREE.Group()
  polygon.userData.type = type
  polygon.name = name
  polygon.add(topMesh)
  polygon.add(mainMesh)

  centerPolygon(polygon, size, hypotenuse)
  addCollisionPointsToPolygon(polygon, points, size, hypotenuse)
  addVerticesIndexesToPolygon(polygon)

  // Display points helper
  // const displayedPointsShape = new THREE.Shape()
  // polygon.userData.originalPoints.forEach(([x, y], index) => { index == 0 ? displayedPointsShape.moveTo(x, y) : displayedPointsShape.lineTo(x, y) })
  // const displayedPointsGeometry = new THREE.ShapeGeometry(displayedPointsShape);
  // const displayedPoints = new THREE.Points(displayedPointsGeometry)
  // polygon.add(displayedPoints)

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

const centerPoint = (type, point, size, hypotenuse) => {
  switch (type) {
    case 'triangle':
      return centerTrianglePoint(point, hypotenuse)
    case 'cube':
      return centerCubePoint(point, size)
  }
}
const centerTrianglePoint = ([x, y, z], hypotenuse) => ([x, y - ((hypotenuse / 2) / 3), z])
const centerCubePoint = ([x, y, z], size) => ([x - (size / 2), y - (size / 2), z])

const addCollisionPointsToPolygon = (polygon, points, size, hypotenuse) => {
  // Add more points to polygon to detect collisions
  const type = polygon.userData.type
  let collisionPoints = []
  switch (type) {
    case 'triangle':
      points.forEach(([x, y], index) => {
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
            break;
        }
      })
      break;
    case 'cube':
      points.forEach(([x, y], index) => {
        switch (index) {
          case 0:
            collisionPoints.push(
              [x, y],
              [size / 2, 0]
              )
            break;
          case 1:
            collisionPoints.push(
              [x, y],
              [size, size / 2]
            )
            break;
          case 2:
            collisionPoints.push(
              [x, y],
              [size / 2, size]
            )
            break;
          case 3:
            collisionPoints.push(
              [x, y],
              [0, size / 2],
            )
            break;
        }
      })
      break;
  }

  collisionPoints.push(points[0])
  collisionPoints = collisionPoints.map(([x, y]) => centerPoint(type, [x, y, 0], size, hypotenuse))

  polygon.userData.originalPoints = collisionPoints
  polygon.userData.currentPoints = collisionPoints
}

const addVerticesIndexesToPolygon = (polygon) => {
  const verticesIndexes = []
  switch (polygon.userData.type) {
    case 'triangle':
      verticesIndexes.push(0, 8, 16)
      break;
    case 'cube':
      verticesIndexes.push(0, 2, 4, 6)
  }

  polygon.userData.verticesIndexes = verticesIndexes
}