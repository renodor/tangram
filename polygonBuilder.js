import * as THREE from 'three';

export default (properties) => {
  // SHAPE
  const shape = new THREE.Shape()
  const points = properties.isTriangle ? buildTrianglePoints(properties) : properties.points
  points.forEach(([x, y]) => shape.lineTo(x, y))

  // BOTTOM
  const bottomGeometry = new THREE.ShapeGeometry(shape);
  const bottomMaterial = new THREE.MeshBasicMaterial({ color: 'yellow' })
  const bottomMesh     = new THREE.Mesh(bottomGeometry, bottomMaterial)
  bottomMesh.userData.type = 'bottom'

  // CENTER
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  const material = new THREE.MeshBasicMaterial({ color: 0xfff1111, wireframe: true })
  const mesh = new THREE.Mesh(geometry, material)

  // TOP
  const topShape = shape.clone()
  // smallerPoints.forEach(([x, y]) => topShape.lineTo(x, y))

  const topGeometry = new THREE.ShapeGeometry(topShape)
  const topMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeeee })
  const topMesh     = new THREE.Mesh(topGeometry, topMaterial)
  topMesh.scale.set(0.75, 0.75, 0.75)
  topMesh.userData.type = 'top'
  topMesh.position.z = 1.01

  if (properties.isTriangle) {
    const hypotenuse = properties.size * Math.sqrt(2)
    bottomGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
    geometry.translate(0, -((hypotenuse / 2) / 3), 0)
    topGeometry.translate(0, -((hypotenuse / 2) / 3), 0)
  }

  // POLYGON
  const polygon = new THREE.Group()
  polygon.name = properties.name
  polygon.add(bottomMesh)
  polygon.add(topMesh)
  polygon.add(mesh)

  return polygon
}

const buildTrianglePoints = ({ points, isTriangle, size }) => {
  const hypotenuse = size * Math.sqrt(2)
  return [
    [-(hypotenuse / 2), 0],
    [(hypotenuse / 2), 0],
    [0, hypotenuse / 2],
    [-(hypotenuse / 2), 0]
  ]
}