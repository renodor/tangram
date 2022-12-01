import { Controller } from "@hotwired/stimulus"
// import { initAndPlay } from '../tangram/game'

import * as THREE from 'three';
import { OrbitControls } from 'three-orbit-controls';
import Tangram from '../tangram/tangram.js'

export default class extends Controller {
  static values = {
    currentPatternId: Number,
    currentPatternPolygons: Object,
    currentPatternSolved: Boolean
  }

  connect() {
    this.initAndPlay(this.element)
  }

  changeCurrentPattern({ detail: { id, solved } }) {
    this.currentPatternIdValue = id
    this.currentPatternSolvedValue = solved
  }

  currentPatternIdValueChanged() {
    fetch(`/patterns/${this.currentPatternIdValue}`, { headers: { 'accept': 'application/json' } })
      .then((response) => response.json())
      .then(({ polygons, solved }) => {
        this.currentPatternPolygonsValue = polygons
        this.currentPatternSolvedValue = solved
      })
  }

  initAndPlay(canvas) {
    // INIT
    // const darkColor = 0x5aaaa5
    // const lightColor = 0x69bfbc
    // const backgroundColor = 0xF3EADD

    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.position.z = 50

    // LIGHTS
    const directionalLight = new THREE.DirectionalLight()
    directionalLight.position.set(15, 0, 25)
    this.scene.add(directionalLight)

    // const ambiantLight = new THREE.AmbientLight(0x404040)
    // this.scene.add(ambiantLight)

    // HELPERS
    // const grid = new THREE.GridHelper(100, 100);
    // grid.name = 'grid'
    // grid.rotation.x = Math.PI / 2;
    // this.scene.add(grid);

    // const axesHelper = new THREE.AxesHelper(100);
    // this.scene.add(axesHelper);

    // PLANE
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xd7e6e8 });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.receiveShadow = true
    this.scene.add(planeMesh);

    this.tangram = new Tangram(20)
    this.patternRef = this.tangram.mediumTriangle

    this.tangram.polygons.forEach((polygon, index) => {
      polygon.userData.index = index
      this.scene.add(polygon)
    })

    // Controls
    // const orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    // orbitControls.enableRotate = false
    // orbitControls.mouseButtons['LEFT'] = THREE.MOUSE.PAN

    // Collision
    this.coordinate = new THREE.Vector3()

    // RAYCASTER
    this.raycaster = new THREE.Raycaster()
    this.worldPosition = new THREE.Vector3()
    this.pointer = new THREE.Vector2()
    this.offset = new THREE.Vector2()
    this.planeIntersectionPoint = new THREE.Vector2()
    this.localIntersection = new THREE.Vector2()

    this.selectedPolygon

    this.pointerMoveHandler = this.onPointerMove.bind(this)
    window.addEventListener('resize', this.onWindowResize.bind(this))
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this))
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this))
    canvas.addEventListener('dblclick', this.onDoubleClick.bind(this))
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    document.getElementById('pattern-reveal').addEventListener('click', event => {
      console.log(JSON.stringify(this.revealPattern()))
    });

    // this.tangram.bigTriangle1.position.set(-20, 0)
    // this.tangram.bigTriangle2.position.set(-20, 12)
    // this.tangram.smallTriangle1.position.set(15, 10)
    // this.tangram.smallTriangle2.position.set(15, 0)
    // this.tangram.mediumTriangle.position.set(0, 10)
    // this.tangram.parallelogram.position.set(0, -8)

    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    // orbitControls.update()
    this.renderer.render(this.scene, this.camera)
  }

  setPointer(x, y) {
    this.pointer.set(
      (x / window.innerWidth) * 2 - 1,
      - (y / window.innerHeight) * 2 + 1
    )
  }

  setSelectedPolygon(polygon) {
    if (this.selectedPolygon) { this.removeSelectedPolygon() }

    this.selectedPolygon = polygon
    this.findTop(this.selectedPolygon).material.opacity = 0.85
    this.selectedPolygon.position.z = 0.1
  }

  removeSelectedPolygon() {
    this.selectedPolygon.position.z = 0
    this.findTop(this.selectedPolygon).material.opacity = 0
    this.selectedPolygon = null
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onDoubleClick(event) {
    this.setPointer(event.clientX, event.clientY)

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const polygonIntersection = this.raycaster.intersectObjects(this.tangram.polygons)[0];

    if (polygonIntersection) {
      this.setSelectedPolygon(polygonIntersection.object.parent)
      if (this.selectedPolygon.userData.type == 'parallelogram') {
        this.flipPolygon(this.selectedPolygon)
        this.updateSelectedPolygonPointsAndCheckCollisions()
      }
    }
  }

  onPointerDown(event) {
    this.setPointer(event.clientX, event.clientY)

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const polygonIntersection = this.raycaster.intersectObjects(this.tangram.polygons)[0];

    if (polygonIntersection) {
      // orbitControls.enabled = false

      const movementType = polygonIntersection.object.userData.type == 'top' ? 'drag' : 'rotate'

      this.setSelectedPolygon(polygonIntersection.object.parent)
      this.selectedPolygon.userData.movementType = movementType
      this.selectedPolygon.userData.savedRotation = this.selectedPolygon.rotation.z

      this.offset.copy(polygonIntersection.point).sub(this.worldPosition.setFromMatrixPosition(this.selectedPolygon.matrixWorld));

      this.canvas.addEventListener('pointermove', this.pointerMoveHandler)
    } else if (this.selectedPolygon) {
      this.removeSelectedPolygon()
    }
  }

  onPointerUp() {
    this.canvas.removeEventListener('pointermove', this.pointerMoveHandler)

    if (this.selectedPolygon) {
      this.selectedPolygon.position.z = 0
      this.updateSelectedPolygonPointsAndCheckCollisions()

      if (!this.tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
        this.checkPattern()
      }

      // orbitControls.enabled = true
    }
  }

  onPointerMove(event) {
    this.setPointer(event.clientX, event.clientY)

    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.ray.intersectPlane(this.plane, this.planeIntersectionPoint);

    if (this.selectedPolygon.userData.movementType == 'drag') {
      this.dragObject(this.planeIntersectionPoint)
    } else {
      this.rotateObject(this.planeIntersectionPoint)
    }
  }

  onKeyDown(event) {
    if (event.key === 'n') {
      const currentSelectedPolygonIndex = this.selectedPolygon?.userData?.index || 0
      this.setSelectedPolygon(this.tangram.polygons[currentSelectedPolygonIndex + 1] || this.tangram.polygons[0])
    } else if (this.selectedPolygon) {
      switch (event.key) {
        case "ArrowLeft":
          this.selectedPolygon.position.x -= 0.2
          break;
        case "ArrowRight":
          this.selectedPolygon.position.x += 0.2
          break;
        case "ArrowUp":
          this.selectedPolygon.position.y += 0.2
          break;
        case "ArrowDown":
          this.selectedPolygon.position.y -= 0.2
          break;
        case "r":
          this.selectedPolygon.rotation.z += 0.1
          break;
        case "l":
          this.selectedPolygon.rotation.z -= 0.1
          break;
        case "f":
          if (this.selectedPolygon.name == 'parallelogram') {
            this.flipPolygon(this.selectedPolygon)
          }
          break;
        case 'Escape':
          this.removeSelectedPolygon(this.selectedPolygon)
          break;
      }
    }
  }

  onKeyUp() {
    if (this.selectedPolygon) {
      this.updateSelectedPolygonPointsAndCheckCollisions()

      if (!this.tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
        this.checkPattern()
      }
    }
  }

  dragObject(planeIntersectionPoint) {
    this.selectedPolygon.position.x = planeIntersectionPoint.x - this.offset.x
    this.selectedPolygon.position.y = planeIntersectionPoint.y - this.offset.y
  }

  rotateObject(planeIntersectionPoint) {
    this.localIntersection.subVectors(planeIntersectionPoint, this.selectedPolygon.position)
    this.selectedPolygon.rotation.z = this.selectedPolygon.userData.savedRotation + (this.localIntersection.angle() - this.offset.angle())
  }

  updateSelectedPolygonPointsAndCheckCollisions() {
    this.selectedPolygon.updateMatrixWorld()
    this.selectedPolygon.userData.currentPoints = this.selectedPolygon.userData.originalPoints.map(([x, y]) => {
      this.coordinate.set(x, y)
      this.selectedPolygon.localToWorld(this.coordinate)
      return [this.coordinate.x, this.coordinate.y]
    })
    this.checkCollisions()
  }

  checkCollisions() {
    this.tangram.polygons.forEach((polygon) => this.removeCollisionToPolygon(polygon))

    this.tangram.polygons.forEach((polygon) => {
      this.tangram.polygons.forEach((polygon2) => {
        if (polygon != polygon2) {
          const collision = polygon.userData.currentPoints.some(([x, y]) => this.pointIsWithinPolygon(polygon2.userData.currentPoints, x, y))
          if (collision) {
            this.addCollisionToPolygon(polygon)
            this.addCollisionToPolygon(polygon2)
          }
        }
      })
    })
  }

  addCollisionToPolygon(polygon) {
    polygon.userData.isColliding = true
    this.findMain(polygon).material.opacity = 0.5
    // this.findTop(polygon).material.opacity = 0
    // polygon.children.forEach((child) => child.material.opacity = 0.5)
    // polygon.children[1].material.color.setHex(0x808080)
  }

  removeCollisionToPolygon(polygon) {
    polygon.userData.isColliding = false
    this.findMain(polygon).material.opacity = 1
  }

  pointIsWithinPolygon(polygonPoints, x, y) {
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

  polygonVerticesToPatternRefLocal(polygon) {
    return polygon.userData.verticesIndexes.map((index) => {
      const vertex = polygon.userData.currentPoints[index]
      this.coordinate.set(vertex[0], vertex[1])
      this.patternRef.worldToLocal(this.coordinate)
      return [this.coordinate.x, this.coordinate.y]
    })
  }

  checkPattern() {
    this.comparePolygonsWitCurrentPatternPolygons()
  }

  comparePolygonsWitCurrentPatternPolygons() {
    const polygonsMatchPattern = this.tangram.polygons.every((polygon) => {
      if (polygon == this.patternRef) { return true }

      return this.polygonVerticesToPatternRefLocal(polygon).every(([polygonX, polygonY], index) => {
        if (polygon.userData.duplicated) {
          return this.currentPatternPolygonsValue[polygon.name].some((patternPoints) => {
            const xDiff = Math.abs(polygonX - patternPoints[index][0])
            const yDiff = Math.abs(polygonY - patternPoints[index][1])
            return (xDiff <= 2) && (yDiff <= 2)
          })
        } else {
          return this.currentPatternPolygonsValue[polygon.name].some(([patternX, patternY]) => {
            const xDiff = Math.abs(polygonX - patternX)
            const yDiff = Math.abs(polygonY - patternY)

            // console.log({
            //   xDiff: xDiff,
            //   yDiff: yDiff,
            //   polygonX: polygonX,
            //   polygonY: polygonY,
            //   patternX: patternX,
            //   patternY: this.currentPatternPolygonsValue[polygon.name][index][1],
            //   result: (xDiff <= 2) && (yDiff <= 2)
            // })
            return (xDiff <= 2) && (yDiff <= 2)
          })

        }
      })
    })

    if (polygonsMatchPattern) {
      console.log(`Bravo you found a pattern!`)

      if (!this.currentPatternSolvedValue) {
        this.currentPatternSolvedValue = true
        fetch(
          `/solved_patterns`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pattern_id: this.currentPatternIdValue })
          }
        )
        .then((response) => response.text())
        .then((svgTag) => this.dispatch('newSolvedPattern', { detail: { svgTag } }))

        // TODO: dispatch an event to patterns controller to mark display this new pattern has solved
        // (show filled svg + eye to display the revealed svg)
      }
    }
  }

  displayNewSolvedPattern(svgTag) {
    document.querySelector('#current-pattern').dataset.solved = true
    document.querySelector('#patterns .pattern[data-selected=true]').dataset.solved = true

    const modal = document.querySelector('.modal-container')
    modal.querySelector('.modal .modal-content .modal-body').innerHTML = svgTag
    modal.classList.remove('display-none')
  }

  roundAtTwoDecimal(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  revealPattern() {
    const pattern = {}
    this.tangram.polygons.forEach((polygon) => {
      const roundedVertices = this.polygonVerticesToPatternRefLocal(polygon).map(([x, y]) => [roundAtTwoDecimal(x), roundAtTwoDecimal(y)])
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

  flipPolygon(polygon) {
    polygon.scale.x *= -1
  }

  findTop(polygon) {
    return polygon.children.find((child) => child.userData.type == 'top')
  }

  findMain(polygon) {
    return polygon.children.find((child) => child.userData.type == 'main')
  }
}
