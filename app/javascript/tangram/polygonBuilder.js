import * as THREE from 'three';

export default ({ type, size, name, duplicated }) => {
  // const hypotenuse = size * Math.sqrt(2)

  // SHAPE
  const shape = new THREE.Shape()
  const points = buildPoints(type, size)
  points.forEach(([x, y], index) => { index == 0 ? shape.moveTo(x, y) : shape.lineTo(x, y) })

  // TOP
  const topShape = shape.clone()
  const topGeometry = new THREE.ShapeGeometry(topShape)
  const topMaterial = new THREE.MeshLambertMaterial({ color: 0x6CB2B4, transparent: true })
  const topMesh = new THREE.Mesh(topGeometry, topMaterial)
  topMesh.scale.set(0.75, 0.75, 0.75)
  topMesh.userData.type = 'top'
  topMesh.position.z = 1.01

  // MAIN
  const mainGeometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  const mainMaterial = new THREE.MeshLambertMaterial({ color: 0x6CB2B4, transparent: true })
  const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial)
  mainMesh.userData.type = 'main'
  mainMesh.castShadow = true;

  // OUTLINE
  // const outlineMaterial1 = new THREE.MeshBasicMaterial({ color: 'green', side: THREE.BackSide });
  // const outlineMesh1 = new THREE.Mesh(mainGeometry, outlineMaterial1);
  // // outlineMesh1.position = mainMesh.position;
  // outlineMesh1.scale.multiplyScalar(1.05);

  // POLYGON
  const polygon = new THREE.Group()
  polygon.userData.type = type
  polygon.userData.duplicated = duplicated
  polygon.name = name
  polygon.add(topMesh)
  polygon.add(mainMesh)
  // polygon.position.z += 5
  // polygon.add(outlineMesh1)

  centerPolygon(polygon, size)
  addCollisionPointsToPolygon(polygon, points, size)
  addVerticesIndexesToPolygon(polygon)

  // Display Polygon axes
  // const axesHelper = new THREE.AxesHelper(10);
  // polygon.add(axesHelper);

  // Display points helper
  // const displayedPointsShape = new THREE.Shape()
  // polygon.userData.originalPoints.forEach(([x, y], index) => { index == 0 ? displayedPointsShape.moveTo(x, y) : displayedPointsShape.lineTo(x, y) })
  // const displayedPointsGeometry = new THREE.ShapeGeometry(displayedPointsShape);
  // const displayedPoints = new THREE.Points(displayedPointsGeometry)
  // polygon.add(displayedPoints)

  return polygon
}

const buildPoints = (type, size) => {
  switch (type) {
    case 'triangle':
      return [
        [-(size / 2), 0],
        [(size / 2), 0],
        [0, size / 2]
      ]
    case 'cube':
      return [
        [0, 0],
        [size, 0],
        [size, size],
        [0, size]
      ]
    case 'parallelogram':
      return [
        [0, 0],
        [size, 0],
        [size + 5, size - 5],
        [0 + 5, size - 5]
      ]
  }
}

const centerPolygon = (polygon, size) => {
  switch (polygon.userData.type) {
    case 'triangle':
      polygon.children.forEach((children) => children.geometry.translate(...centerTrianglePoint([0, 0, 0], size)))
      break;
    case 'cube':
      polygon.children.forEach((children) => children.geometry.translate(...centerCubePoint([0, 0, 0], size)))
      break;
    case 'parallelogram':
      polygon.children.forEach((children) => children.geometry.translate(...centerParallelogramPoint([0, 0, 0], size)))
      break;
  }
}

const centerPoint = (type, point, size) => {
  switch (type) {
    case 'triangle':
      return centerTrianglePoint(point, size)
    case 'cube':
      return centerCubePoint(point, size)
    case 'parallelogram':
      return centerParallelogramPoint(point, size)
  }
}
const centerTrianglePoint = ([x, y, z], size) => ([x, y - ((size / 2) / 3), z])
const centerCubePoint = ([x, y, z], size) => ([x - (size / 2), y - (size / 2), z])
const centerParallelogramPoint = ([x, y, z], size) => ([x - (size - 2), y - (size / 4), z])


const addCollisionPointsToPolygon = (polygon, points, size) => {
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
              [size / 4, size / 4]
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
              [-(size / 4), size / 4],
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
              [0, size / 2]
            )
            break;
        }
      })
      break;
    case 'parallelogram':
      points.forEach(([x, y], index) => {
        switch (index) {
          case 0:
            collisionPoints.push(
              [x, y],
              [1, 0],
              [2, 0]
            )
            break;
          case 1:
            collisionPoints.push(
              [x, y]
            )
            break;
          case 2:
            collisionPoints.push(
              [x, y],
              [size + 4, size - 5],
              [size + 3, size - 5]
            )
            break;
          case 3:
            collisionPoints.push(
              [x, y],
            )
            break;
        }
      })
      break;
  }

  collisionPoints.push(points[0])
  collisionPoints = collisionPoints.map(([x, y]) => centerPoint(type, [x, y, 0], size))
  // collisionPoints = collisionPoints.map((collisionPoint) => collisionPoint.slice(0, -1))

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
      break;
    case 'parallelogram':
      verticesIndexes.push(0, 2, 4, 6)
      break;
  }

  polygon.userData.verticesIndexes = verticesIndexes
}