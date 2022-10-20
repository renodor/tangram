import * as THREE from 'three';
import { Vector2 } from 'three';

export default ({ type, size, name }) => {
  // SHAPE
  const shape  = new THREE.Shape()
  const points = buildPoints(type, size)
  points.forEach(([x, y]) => shape.lineTo(x, y))

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

  // Center polygon
  const hypotenuse = size * Math.sqrt(2)
  if (type == 'triangle') {
    bottomGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
    mainGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
    topGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
  } else if (type == 'cube') {
    bottomGeometry.translate(- (size / 2), - (size / 2), 0)
    mainGeometry.translate(- (size / 2), - (size / 2), 0)
    topGeometry.translate(- (size / 2), - (size / 2), 0)
  }

  // POLYGON
  const polygon = new THREE.Group()
  polygon.name = name
  polygon.add(bottomMesh)
  polygon.add(topMesh)
  polygon.add(mainMesh)

  let originalPoints = []
  if (type == 'triangle') {
    // Add more points to triangle to detect collisions
    originalPoints.push(points[0])
    originalPoints.push([points[0][0] + 0.5, 0])
    originalPoints.push([points[0][0] + 1, 0])
    originalPoints.push([points[0][0] + 1.5, 0])

    originalPoints.push([0, 0])

    originalPoints.push([points[1][0] - 1.5, 0])
    originalPoints.push([points[1][0] - 1, 0])
    originalPoints.push([points[1][0] - 0.5, 0])
    originalPoints.push(points[1])
    originalPoints.push([points[1][0] - 0.5, points[1][1] + 0.5])
    originalPoints.push([points[1][0] - 1, points[1][1] + 1])
    originalPoints.push([points[1][0] - 1.5, points[1][1] + 1.5])

    originalPoints.push([hypotenuse / 4, hypotenuse / 4])

    originalPoints.push([points[2][0] + 1.5, points[2][1] - 0.5])
    originalPoints.push([points[2][0] + 1, points[2][1] - 1])
    originalPoints.push([points[2][0] + 0.5, points[2][1] - 1.5])
    originalPoints.push(points[2])
    originalPoints.push([points[2][0] - 0.5, points[2][1] - 0.5])
    originalPoints.push([points[2][0] - 1, points[2][1] - 1])
    originalPoints.push([points[2][0] - 1.5, points[2][1] - 1.5])

    originalPoints.push([-(hypotenuse / 4), hypotenuse / 4])

    originalPoints.push([points[0][0] + 1.5, points[0][1] + 1.5])
    originalPoints.push([points[0][0] + 1, points[0][1] + 1])
    originalPoints.push([points[0][0] + 0.5, points[0][1] + 0.5])
    originalPoints.push(points[0])

    originalPoints = originalPoints.map(([x, y]) => [x, y - ((hypotenuse / 2) / 3)])
  } else if (type == 'cube') {
    // Add more points to cube to detect collisions
    originalPoints.push(points[0])
    originalPoints.push([size / 2, 0])
    originalPoints.push(points[1])
    originalPoints.push([size, size / 2])
    originalPoints.push(points[2])
    originalPoints.push([size / 2, size])
    originalPoints.push(points[3])
    originalPoints.push([0, size / 2])
    originalPoints.push(points[0])

    originalPoints = originalPoints.map(([x, y]) => [x - (size / 2), y - (size / 2)])
  }
  polygon.userData.originalPoints = originalPoints
  polygon.userData.currentPoints = originalPoints

  return polygon
}

const buildPoints = (type, size) => {
  if (type == 'cube') {
    return [
      [0, 0],
      [size, 0],
      [size, size],
      [0, size]
    ]
  } else if (type == 'triangle') {
    const hypotenuse = size * Math.sqrt(2)
    return [
      [-(hypotenuse / 2), 0],
      [0, hypotenuse / 2],
      [(hypotenuse / 2), 0],
    ]
  }
}