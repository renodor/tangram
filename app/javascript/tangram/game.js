import * as THREE from 'three';
import { OrbitControls } from 'three-orbit-controls';
import Tangram from './tangram.js'

const initAndPlay = (canvas) => {
  // INIT
  // const darkColor = 0x5aaaa5
  // const lightColor = 0x69bfbc
  // const backgroundColor = 0xF3EADD

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100)
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.position.z = 50

  // LIGHTS
  const directionalLight = new THREE.DirectionalLight()
  directionalLight.position.set(15, 0, 25)
  scene.add(directionalLight)

  // const ambiantLight = new THREE.AmbientLight(0x404040)
  // scene.add(ambiantLight)

  // HELPERS
  // const grid = new THREE.GridHelper(100, 100);
  // grid.name = 'grid'
  // grid.rotation.x = Math.PI / 2;
  // scene.add(grid);

  // const axesHelper = new THREE.AxesHelper(100);
  // scene.add(axesHelper);

  // PLANE
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xd7e6e8 });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true
  scene.add(planeMesh);

  const tangram = new Tangram(20)
  const patternRef = tangram.mediumTriangle

  tangram.polygons.forEach((polygon, index) => {
    polygon.userData.index = index
    scene.add(polygon)
  })

  // Controls
  // const orbitControls = new OrbitControls(camera, renderer.domElement)
  // orbitControls.enableRotate = false
  // orbitControls.mouseButtons['LEFT'] = THREE.MOUSE.PAN

  // Collision
  const coordinate = new THREE.Vector3()

  // RAYCASTER
  const raycaster = new THREE.Raycaster()
  const worldPosition = new THREE.Vector3()
  const pointer = new THREE.Vector2()
  const offset = new THREE.Vector2()
  const planeIntersectionPoint = new THREE.Vector2()
  const localIntersection = new THREE.Vector2()

  let selectedPolygon
  const currentPattern = {
    id: 0,
    name: '',
    polygons: []
  }

  window.addEventListener('resize', onWindowResize)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('dblclick', onDoubleClick)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  document.getElementById('pattern-reveal').addEventListener('click', event => {
    console.log(JSON.stringify(revealPattern()))
  });

  // tangram.bigTriangle1.position.set(-20, 0)
  // tangram.bigTriangle2.position.set(-20, 12)
  // tangram.smallTriangle1.position.set(15, 10)
  // tangram.smallTriangle2.position.set(15, 0)
  // tangram.mediumTriangle.position.set(0, 10)
  // tangram.parallelogram.position.set(0, -8)

  animate();

  function animate() {
    requestAnimationFrame(animate)
    // orbitControls.update()
    renderer.render(scene, camera)
  }

  function setPointer(x, y) {
    pointer.set(
      (x / window.innerWidth) * 2 - 1,
      - (y / window.innerHeight) * 2 + 1
    )
  }

  function setSelectedPolygon(polygon) {
    if (selectedPolygon) { removeSelectedPolygon() }

    selectedPolygon = polygon
    findTop(selectedPolygon).material.opacity = 0.85
    selectedPolygon.position.z = 0.1
  }

  function removeSelectedPolygon() {
    selectedPolygon.position.z = 0
    findTop(selectedPolygon).material.opacity = 0
    selectedPolygon = null
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onDoubleClick(event) {
    setPointer(event.clientX, event.clientY)

    raycaster.setFromCamera(pointer, camera)
    const polygonIntersection = raycaster.intersectObjects(tangram.polygons)[0];

    if (polygonIntersection) {
      setSelectedPolygon(polygonIntersection.object.parent)
      if (selectedPolygon.userData.type == 'parallelogram') {
        flipPolygon(selectedPolygon)
        updateSelectedPolygonPointsAndCheckCollisions()
      }
    }
  }

  function onPointerDown(event) {
    setPointer(event.clientX, event.clientY)

    raycaster.setFromCamera(pointer, camera)
    const polygonIntersection = raycaster.intersectObjects(tangram.polygons)[0];

    if (polygonIntersection) {
      // orbitControls.enabled = false

      const movementType = polygonIntersection.object.userData.type == 'top' ? 'drag' : 'rotate'

      setSelectedPolygon(polygonIntersection.object.parent)
      selectedPolygon.userData.movementType = movementType
      selectedPolygon.userData.savedRotation = selectedPolygon.rotation.z

      offset.copy(polygonIntersection.point).sub(worldPosition.setFromMatrixPosition(selectedPolygon.matrixWorld));

      canvas.addEventListener('pointermove', onPointerMove)
    } else if (selectedPolygon) {
      removeSelectedPolygon()
    }
  }

  function onPointerUp() {
    canvas.removeEventListener('pointermove', onPointerMove)

    if (selectedPolygon) {
      selectedPolygon.position.z = 0
      updateSelectedPolygonPointsAndCheckCollisions()

      if (!tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
        checkPattern()
      }

      // orbitControls.enabled = true
    }
  }

  function onPointerMove(event) {
    setPointer(event.clientX, event.clientY)

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, planeIntersectionPoint);

    if (selectedPolygon.userData.movementType == 'drag') {
      dragObject(planeIntersectionPoint)
    } else {
      rotateObject(planeIntersectionPoint)
    }
  }

  function onKeyDown(event) {
    if (event.key === 'n') {
      const currentSelectedPolygonIndex = selectedPolygon?.userData?.index || 0
      setSelectedPolygon(tangram.polygons[currentSelectedPolygonIndex + 1] || tangram.polygons[0])
    } else if (selectedPolygon) {
      switch (event.key) {
        case "ArrowLeft":
          selectedPolygon.position.x -= 0.2
          break;
        case "ArrowRight":
          selectedPolygon.position.x += 0.2
          break;
        case "ArrowUp":
          selectedPolygon.position.y += 0.2
          break;
        case "ArrowDown":
          selectedPolygon.position.y -= 0.2
          break;
        case "r":
          selectedPolygon.rotation.z += 0.1
          break;
        case "l":
          selectedPolygon.rotation.z -= 0.1
          break;
        case "f":
          if (selectedPolygon.name == 'parallelogram') {
            flipPolygon(selectedPolygon)
          }
          break;
        case 'Escape':
          removeSelectedPolygon(selectedPolygon)
          break;
      }
    }
  }

  function onKeyUp() {
    if (selectedPolygon) {
      updateSelectedPolygonPointsAndCheckCollisions()

      if (!tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
        checkPattern()
      }
    }
  }

  function dragObject(planeIntersectionPoint) {
    selectedPolygon.position.x = planeIntersectionPoint.x - offset.x
    selectedPolygon.position.y = planeIntersectionPoint.y - offset.y
  }

  function rotateObject(planeIntersectionPoint) {
    localIntersection.subVectors(planeIntersectionPoint, selectedPolygon.position)
    selectedPolygon.rotation.z = selectedPolygon.userData.savedRotation + (localIntersection.angle() - offset.angle())
  }

  function updateSelectedPolygonPointsAndCheckCollisions() {
    selectedPolygon.updateMatrixWorld()
    selectedPolygon.userData.currentPoints = selectedPolygon.userData.originalPoints.map(([x, y]) => {
      coordinate.set(x, y)
      selectedPolygon.localToWorld(coordinate)
      return [coordinate.x, coordinate.y]
    })
    checkCollisions()
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
    findMain(polygon).material.opacity = 0.5
    // findTop(polygon).material.opacity = 0
    // polygon.children.forEach((child) => child.material.opacity = 0.5)
    // polygon.children[1].material.color.setHex(0x808080)
  }

  function removeCollisionToPolygon(polygon) {
    polygon.userData.isColliding = false
    findMain(polygon).material.opacity = 1
  }

  function pointIsWithinPolygon(polygonPoints, x, y) {
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
    const newPatternId = document.getElementById('current-pattern').dataset.id
    if (newPatternId != currentPattern.id) {
      fetch(`/patterns/${newPatternId}`, { headers: { 'accept': 'application/json' } })
        .then((response) => response.json())
        .then(({id, name, polygons}) => {
          currentPattern.id = id
          currentPattern.polygons = polygons
          currentPattern.name = name
          comparePolygonsWitCurrentPatternPolygons()
        })
    } else {
      comparePolygonsWitCurrentPatternPolygons()
    }
  }

  function comparePolygonsWitCurrentPatternPolygons() {
    const polygonsMatchPattern = tangram.polygons.every((polygon) => {
      if (polygon == patternRef) { return true }

      return polygonVerticesToPatternRefLocal(polygon).every(([polygonX, polygonY], index) => {
        if (polygon.userData.duplicated) {
          return currentPattern.polygons[polygon.name].some((patternPoints) => {
            const xDiff = Math.abs(polygonX - patternPoints[index][0])
            const yDiff = Math.abs(polygonY - patternPoints[index][1])
            return (xDiff <= 2) && (yDiff <= 2)
          })
        } else {
          return currentPattern.polygons[polygon.name].some(([patternX, patternY]) => {
            const xDiff = Math.abs(polygonX - patternX)
            const yDiff = Math.abs(polygonY - patternY)

            // console.log({
            //   xDiff: xDiff,
            //   yDiff: yDiff,
            //   polygonX: polygonX,
            //   polygonY: polygonY,
            //   patternX: patternX,
            //   patternY: currentPattern.polygons[polygon.name][index][1],
            //   result: (xDiff <= 2) && (yDiff <= 2)
            // })
            return (xDiff <= 2) && (yDiff <= 2)
          })

        }
      })
    })

    if (polygonsMatchPattern) {
      console.log(`Bravo you found "${currentPattern.name.toUpperCase()}" pattern!`)
      fetch(
        `/solved_patterns`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern_id: currentPattern.id })
        }
      )
      .then((response) => {
        // Parse data only if this pattern was not already solved by current user
        if (response.status == 200) { return response.text() }
      })
      .then((data) => {
        if (data) { displayNewSolvedPattern(data) }
      })
    }
  }

  function displayNewSolvedPattern(svgTag) {
    document.querySelector('#current-pattern').dataset.solved = true
    document.querySelector('#patterns .pattern[data-selected=true]').dataset.solved = true

    const modal = document.querySelector('.modal-container')
    modal.querySelector('.modal .modal-content .modal-body').innerHTML = svgTag
    modal.classList.remove('display-none')
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

  function findTop(polygon) {
    return polygon.children.find((child) => child.userData.type == 'top')
  }

  function findMain(polygon) {
    return polygon.children.find((child) => child.userData.type == 'main')
  }
}

export { initAndPlay };