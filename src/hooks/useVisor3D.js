import { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createRobot, animateRobot } from "./robot.js"
import { createPlanet, animatePlanet } from './planet.js'
import { createCristal, animateCristal } from './cristal.js'

/**
 * Hook personalizado que inicializa y gestiona la escena Three.js.
 *
 * @param {React.RefObject} canvasRef - referencia al elemento <canvas>
 *
 * ESTRUCTURA DEL HOOK (no cambies el orden):
 *   1. Renderer   → pinta en el canvas
 *   2. Scene      → el "mundo" donde viven los objetos
 *   3. Camera     → el punto de vista
 *   4. Lights     → la iluminación
 *   5. Objects    → las geometrías y materiales (AQUÍ ES DONDE TRABAJARÁS)
 *   6. Controls   → OrbitControls para rotar / zoom con el ratón
 *   7. Loop       → requestAnimationFrame para animar
 *   8. Cleanup    → liberar memoria cuando el componente se desmonte
 */
export function useVisor3D(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ─────────────────────────────────────────────
    // 1. RENDERER
    // WebGLRenderer dibuja la escena en el <canvas>
    // ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.sortObjects = true
    renderer.depthPrepass = false

    // ─────────────────────────────────────────────
    // 2. SCENE
    // La escena es el contenedor de todos los objetos
    // ─────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f0f0f)

    // ─────────────────────────────────────────────
    // 3. CAMERA
    // PerspectiveCamera(fov, aspect, near, far)
    // ─────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      60,                                          // campo de vision
      window.innerWidth / window.innerHeight,      // relacion de aspecto
      0.1,                                         // plano cercano
      1000                                         // plano lejano
    )
    camera.position.set(0, 2, 12)

    // ─────────────────────────────────────────────
    // 4. LIGHTS
    // AmbientLight ilumina todo por igual
    // DirectionalLight proyecta sombras
    // ─────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 8, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

const hemiLight = new THREE.HemisphereLight(
  0x8ecae6, // cielo
  0x1b1b2e, // suelo
  0.8
)
scene.add(hemiLight)

    // ─────────────────────────────────────────────
    // 5. OBJECTS — AQUI ES DONDE TRABAJARAS!
    //
    // Un Mesh = Geometry (forma) + Material (aspecto)
    //
    // Geometrias disponibles:
    //   new THREE.BoxGeometry(w, h, d)
    //   new THREE.SphereGeometry(radius, widthSeg, heightSeg)
    //   new THREE.TorusGeometry(radius, tube, radialSeg, tubularSeg)
    //   new THREE.CylinderGeometry(rTop, rBottom, height, segments)
    //   new THREE.ConeGeometry(radius, height, segments)
    //   new THREE.IcosahedronGeometry(radius, detail)
    //
    // Materiales disponibles:
    //   new THREE.MeshStandardMaterial({ color: 0xff0000 })
    //   new THREE.MeshNormalMaterial()
    //   new THREE.MeshPhongMaterial({ color, shininess })
    //   new THREE.MeshBasicMaterial({ color, wireframe: true })
    // ─────────────────────────────────────────────

    // ---- CREAR ROBOT ----
    // Crear el robot y agregarlo a la escena
    const robot = createRobot()
    robot.position.set(-4, 0.5, 0)
    scene.add(robot)

    // ---- CREAR PLANETA ----
    // Crear el planeta y agregarlo a la escena
    const planet = createPlanet()
    planet.position.set(4, 0.5, 0)
    scene.add(planet)

    // ---- CREAR CRISTAL ----
    const cristal = createCristal() 
    cristal.position.set(-8, 0.5, 0)
    scene.add(cristal)

    // Cubo de ejemplo — cambialp o añade mas geometrias (COMENTADO)
    // const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    // const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4f8ef7 })
    // const cube = new THREE.Mesh(boxGeometry, boxMaterial)
    // cube.castShadow = true
    // cube.position.set(0, 0, 0)
    // scene.add(cube)

    // TODO: Añade al menos 2 geometrias mas aqui
    // Ejemplo: una esfera a la izquierda, un torus a la derecha

    // Suelo
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.5
    floor.receiveShadow = true
    scene.add(floor)

    // ─────────────────────────────────────────────
    // 6. CONTROLS
    // OrbitControls gestiona rotar / zoom / mover
    // ─────────────────────────────────────────────
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 50

    // ─────────────────────────────────────────────
    // 7. ANIMATION LOOP
    // requestAnimationFrame ejecuta esta funcion ~60 veces/seg
    // ─────────────────────────────────────────────
    let animFrameId

    // ─────────────────────────────────────────────────────────────────────────────
    // Animación del robot
    // ─────────────────────────────────────────────────────────────────────────────
    function animate(time) {
      animFrameId = requestAnimationFrame(animate)

      animateRobot(robot, time)
      animatePlanet(planet, time)
      animateCristal(cristal, time)

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // ─────────────────────────────────────────────
    // 8. RESIZE
    // ─────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onResize)

    // ─────────────────────────────────────────────
    // 9. CLEANUP
    // React llama a esta funcion cuando el componente
    // se desmonta para evitar memory leaks
    // ─────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
    }
  }, [canvasRef])
}
