import { Controller } from '@hotwired/stimulus'

import * as THREE from 'three';
import { OrbitControls } from 'three-orbit-controls';
import Tangram from 'tangram';

export default class extends Controller {
  static values = {
    textures: Object,
    currentPatternId: Number,
    currentPatternSolved: Boolean
  }

  connect() {
    this.initAndPlay(this.element)
    this.currentPatternSolutions // not a "value" because we don't want to expose that has a HTML data attribute...
  }

  // Triggered when user change the pattern currently trying to be solved
  changeCurrentPattern({ detail: { id, solved } }) {
    this.currentPatternIdValue = id
    this.currentPatternSolvedValue = solved
  }

  // Triggered when currentPatternId change,
  // it will fetch new current pattern solutions and "solved" boolean value
  currentPatternIdValueChanged() {
    fetch(`/patterns/${this.currentPatternIdValue}`, { headers: { 'accept': 'application/json' } })
      .then((response) => response.json())
      .then(({ solutions, solved }) => {
        this.currentPatternSolutions = solutions
        this.currentPatternSolvedValue = solved
      })
  }

  initAndPlay(canvas) {
    // INIT
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

    this.tangram = new Tangram(20, this.texturesValue);
    this.patternRef = this.tangram.mediumTriangle

    this.tangram.polygons.forEach((polygon, index) => {
      polygon.userData.index = index
      this.scene.add(polygon)
    })

    // Controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableRotate = false
    this.orbitControls.maxDistance = 100;
    this.orbitControls.minDistance = 20;
    this.orbitControls.mouseButtons['LEFT'] = THREE.MOUSE.PAN
    this.orbitControls.touches['ONE'] = THREE.TOUCH.PAN

    const minPan = new THREE.Vector3(- 50, - 50, - 50);
    const maxPan = new THREE.Vector3(50, 50, 50);
    const orbitControlsFocusPoint = new THREE.Vector3();

    this.orbitControls.addEventListener('change', () => {
      orbitControlsFocusPoint.copy(this.orbitControls.target)
      this.orbitControls.target.clamp(minPan, maxPan);
      orbitControlsFocusPoint.sub(this.orbitControls.target);
      this.camera.position.sub(orbitControlsFocusPoint);
    })

    // Collision
    this.coordinate = new THREE.Vector3()

    // Raycaster
    this.raycaster = new THREE.Raycaster()
    this.worldPosition = new THREE.Vector3()
    this.pointer = new THREE.Vector2()
    this.offset = new THREE.Vector2()
    this.planeIntersectionPoint = new THREE.Vector2()
    this.localIntersection = new THREE.Vector2()

    this.selectedPolygon

    // Used to count pointer down event in order to react in case of double click/tap
    this.pointerDownCount = 0
    this.pointerDownTimeOutId

    // Event handlers
    this.pointerMoveHandler = this.onPointerMove.bind(this)
    window.addEventListener('resize', this.onWindowResize.bind(this))
    window.addEventListener('orientationchange', this.onWindowResize.bind(this)) // Legacy event for old devices
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this))
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this))
    // canvas.addEventListener('pointerup', this.onPointerUpMaybeDouble.bind(this))
    // canvas.addEventListener('dblclick', this.onDoubleClick.bind(this))

    // Admin feature to add new solution to a pattern
    // (triggered by a button only visible for admins)
    document.getElementById('create-solution')?.addEventListener('click', () => {
      this.createSolutionFromPolygons()
    });

    this.setInitialPositions()

    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.orbitControls.update()
    this.renderer.render(this.scene, this.camera)
  }

  // Place polygons in an "harmonized" way when game starts
  setInitialPositions() {
    let bigTriangleCount   = 0
    let smallTriangleCount = 0

    this.tangram.polygons.forEach((polygon) => {
      switch (polygon.name) {
        case 'cube':
          polygon.position.set(-0.1043734311668123, 1.21865161319267)
          polygon.rotation.z = -0.8134103462697739
          break;
        case 'bigTriangle':
          if (bigTriangleCount === 0) {
            polygon.position.set(-20.36165560764941, 6.96388943681312)
            polygon.rotation.z = 6.519747708306367
            bigTriangleCount += 1
          } else {
            polygon.position.set(24.599322892034973, -6.019497732554433)
            polygon.rotation.z = -1.994077903661601
          }
          break;
        case 'smallTriangle':
          if (smallTriangleCount === 0) {
            polygon.position.set(11.993835687996796, -0.5682255555855642)
            polygon.rotation.z = 1.915140347823394
            smallTriangleCount += 1
          } else {
            polygon.position.set(14.79895073744335, 12.530463600791704)
            polygon.rotation.z = -0.32290721988959836
          }
          break;
        case 'mediumTriangle':
          polygon.position.set(-14.47477365349403, -6.611277123827459)
          polygon.rotation.z = -2.498864655040359
          break;
        case 'parallelogram':
          polygon.position.set(-0.15885088312089946, 13.282581820531234)
          polygon.rotation.z = 0.33977633377913374
          break;
      }

      this.setSelectedPolygon(polygon)
      this.updateSelectedPolygonPointsAndCheckCollisions()
      this.removeSelectedPolygon()
    })
  }

  setPointer(x, y) {
    this.pointer.set(
      (x / window.innerWidth) * 2 - 1,
      - (y / window.innerHeight) * 2 + 1
    )
  }

  // Set a new polygon as the "selected" one
  // selected polygon appear a bit more up and with less opacity than other polygons
  // selected polygon is stored in selectedPolygon variable
  setSelectedPolygon(polygon) {
    if (this.selectedPolygon) { this.removeSelectedPolygon() }

    this.selectedPolygon = polygon
    this.findTop(this.selectedPolygon).material.opacity = 0.85
    this.selectedPolygon.position.z = 0.1
  }

  // Remove polygon from the "selected" one
  removeSelectedPolygon() {
    this.findTop(this.selectedPolygon).material.opacity = 0
    this.selectedPolygon = null
  }

  // Update camera and renderer on window resize
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // On pointer down trigger simplePointerDownHandler method
  // but also a 300ms timer during witch we listen for other pointer down event
  // this allows to trigger doublePointerDownHandler method in case of double click/tap
  onPointerDown(event) {
    event.preventDefault()
    if (event.isPrimary) { this.pointerDownCount += 1 }
    this.simplePointerDownHandler(event)

    if (this.pointerDownCount > 1) {
      clearTimeout(this.pointerDownTimeOutId)
      this.pointerDownCount = 0
      this.doublePointerDownHandler(event)
    } else {
      this.pointerDownTimeOutId = setTimeout(() => {
        this.pointerDownCount = 0
      }, 300);
    }
  }

  // When pointer is down (click or tap), check if a polygon has been clicked/taped,
  // if yes, set this polygon as the new "selected polygon",
  // and define if click/tap was made on top or main part of polygon
  // (which later define if polygon needs to be rotated or draged)
  // then if pointer moves, calls on PointerMove handler
  simplePointerDownHandler(event) {
    this.setPointer(event.clientX, event.clientY)

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const polygonIntersection = this.raycaster.intersectObjects(this.tangram.polygons)[0];

    if (polygonIntersection && event.isPrimary) {
      this.orbitControls.enabled = false

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

  // Flip the parallelogram polygon when double clicked
  doublePointerDownHandler(event) {
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

  // When pointer is up (click or tap), if no polygons are colliding,
  // check if the patern has been resolved
  onPointerUp() {
    this.canvas.removeEventListener('pointermove', this.pointerMoveHandler)

    if (this.selectedPolygon) {
      this.selectedPolygon.position.z = 0
      this.updateSelectedPolygonPointsAndCheckCollisions()

      if (!this.tangram.polygons.some((polygon) => polygon.userData.isColliding)) {
        this.checkPattern()
      }
    }

    this.orbitControls.enabled = true
  }

  // Called only when a polygon has been clicked/taped and then pointer has moved,
  // it will then call the relevant action to do (rotate, or drag the polygon)
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

  // Drag the selected polygon
  dragObject(planeIntersectionPoint) {
    this.selectedPolygon.position.x = planeIntersectionPoint.x - this.offset.x
    this.selectedPolygon.position.y = planeIntersectionPoint.y - this.offset.y
  }

  // Rotate the selected polygon
  rotateObject(planeIntersectionPoint) {
    this.localIntersection.subVectors(planeIntersectionPoint, this.selectedPolygon.position)
    this.selectedPolygon.rotation.z = this.selectedPolygon.userData.savedRotation + (this.localIntersection.angle() - this.offset.angle())
  }

  // Update selected polygon current points comparing it with its original points and the current polygon position
  // then check for collisions
  // this method is called any time a polygon has moved
  updateSelectedPolygonPointsAndCheckCollisions() {
    this.selectedPolygon.updateMatrixWorld()
    this.selectedPolygon.userData.currentPoints = this.selectedPolygon.userData.originalPoints.map(([x, y]) => {
      this.coordinate.set(x, y)
      this.selectedPolygon.localToWorld(this.coordinate)
      return [this.coordinate.x, this.coordinate.y]
    })
    this.checkCollisions()
  }

  // Check if any point of any polygon collides with any point of any other polygon
  // if yes, add collision to both colliding polygons
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

  // Add collision to given polygon
  addCollisionToPolygon(polygon) {
    polygon.userData.isColliding = true
    this.findMain(polygon).material.opacity = 0.5
  }

  // Remove collision to given polygon
  removeCollisionToPolygon(polygon) {
    polygon.userData.isColliding = false
    this.findMain(polygon).material.opacity = 1
  }

  // Check if given point collides with any of the points of the given polygon
  // Solution given by this post: https://discourse.threejs.org/t/find-simple-2d-shapes-collision/43517/12
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

  // Check if pattern is solved,
  // if yes, and it's the first time for this user, mark this pattern as solved for this user
  // and dispatch "currentPatternSolvedForTheFirstTime" event that will trigger winning modal
  // if yes, and user had already solved this pattern, trigger "currentPatternSolved" event that will just animate pattern icon
  checkPattern() {
    const polygonsMatchSolution = this.currentPatternSolutions.some((solution) => {
      return this.comparePolygonsSolution(solution)
    })

    if (polygonsMatchSolution) {
      console.log('Bravo you found a pattern!')

      if (!this.currentPatternSolvedValue) {
        this.currentPatternSolvedValue = true
        fetch(
          '/solved_patterns',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pattern_id: this.currentPatternIdValue })
          }
        )
          .then((response) => response.json())
          .then((payload) => this.dispatch('currentPatternSolvedForTheFirstTime', { detail: payload }))

      } else {
        this.dispatch('currentPatternSolved')
      }
    }
  }

  // Compare current polygons positions against the given pattern solution:
  // If polygon is the "patternRef" (the medium triangle), skip it.
  // Indeed all solutions are generated taking the medium triangle as reference (always at the same position, in the center of the pattern),
  // because it is the only polygon that can have only 1 exact position in every solutions:
  // it is not duplicated (unlike other triangles), and it can't be rotate into the same position (unlike the square and parallelogram).
  // For all other polygons, map all its current points into the local world of the pattern ref,
  // and then compare all those points against the points of the same polygon of the solution, to know if the polygon is at the correct position
  // (with an error margin of 2 units, so that polygons don't have to be at the exact same position than the solution)
  // If all polygons are at the correct position return true, it means user found one of the solutions of the current pattern
  comparePolygonsSolution(solution) {
    return this.tangram.polygons.every((polygon) => {
      if (polygon == this.patternRef) { return true }

      return this.polygonVerticesToPatternRefLocal(polygon).every(([polygonX, polygonY], index) => {
        if (polygon.userData.duplicated) {
          return solution[polygon.name].some((patternPoints) => {
            const xDiff = Math.abs(polygonX - patternPoints[index][0])
            const yDiff = Math.abs(polygonY - patternPoints[index][1])
            return (xDiff <= 2) && (yDiff <= 2)
          })
        } else {
          return solution[polygon.name].some(([patternX, patternY]) => {
            const xDiff = Math.abs(polygonX - patternX)
            const yDiff = Math.abs(polygonY - patternY)

            // console.log({
            //   xDiff: xDiff,
            //   yDiff: yDiff,
            //   polygonX: polygonX,
            //   polygonY: polygonY,
            //   patternX: patternX,
            //   patternY: solution[polygon.name][index][1],
            //   result: (xDiff <= 2) && (yDiff <= 2)
            // })
            return (xDiff <= 2) && (yDiff <= 2)
          })

        }
      })
    })
  }

  // Map points of the given polygons to the local world of pattern ref
  polygonVerticesToPatternRefLocal(polygon) {
    return polygon.userData.verticesIndexes.map((index) => {
      const vertex = polygon.userData.currentPoints[index]
      this.coordinate.set(vertex[0], vertex[1])
      this.patternRef.worldToLocal(this.coordinate)
      return [this.coordinate.x, this.coordinate.y]
    })
  }

  // Flip given polygon horizontally
  flipPolygon(polygon) {
    polygon.scale.x *= -1
  }

  // Helper method to find top shape of given polygon
  findTop(polygon) {
    return polygon.children.find((child) => child.userData.type == 'top')
  }

  // Helper method to find main shape of given polygon
  findMain(polygon) {
    return polygon.children.find((child) => child.userData.type == 'main')
  }

  // Only accessible by admin users.
  // Helper to easily create new solution for current pattern from the position of current polygons
  createSolutionFromPolygons() {
    const polygons = this.tangram.polygons.map((polygon) => {
      const roundedVertices = this.polygonVerticesToPatternRefLocal(polygon).map(([x, y]) => [this.roundAtTwoDecimal(x), this.roundAtTwoDecimal(y)])
      return {
        shape: polygon.name,
        points: roundedVertices
      }
    })

    fetch(
      '/solutions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            pattern_id: this.currentPatternIdValue,
            polygons: polygons
          }
        )
      }
    ).then((response) => {
      if (response.status == 201) {
        console.log(`New solution created for current pattern (with id: ${this.currentPatternIdValue})`)
      } else {
        console.log(`Error: ${response.status}`)
      }
    })
  }

  // Helper method to round number
  roundAtTwoDecimal(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }
}
