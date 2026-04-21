import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de animación
// ─────────────────────────────────────────────────────────────────────────────
const ANIM = {
    velocidad: 2.5,
    amplHombros: 0.6,
    amplCaderas: 0.8,
    amplCodos: 0.35,
    amplRodillas: 0.5,
}

// ─────────────────────────────────────────────────────────────────────────────
// createRobot
// ─────────────────────────────────────────────────────────────────────────────
export function createRobot() {
    // ── Materiales ──────────────────────────────────────────────────────────────
    const matCabeza = new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    const matCuerpo = new THREE.MeshStandardMaterial({ color: 0xFF6B6B })
    const matBrazos = new THREE.MeshStandardMaterial({ color: 0x4ECDC4 })
    const matPiernas = new THREE.MeshStandardMaterial({ color: 0x95E1D3 })
    const matArticulacion = new THREE.MeshStandardMaterial({ color: 0x888888 })

    // ── Geometrías reutilizables ────────────────────────────────────────────────
    const geomBrazoSup = new THREE.CylinderGeometry(0.15, 0.15, 0.50, 16)
    const geomAntebrazo = new THREE.CylinderGeometry(0.12, 0.12, 0.50, 16)
    const geomMuslo = new THREE.CylinderGeometry(0.15, 0.15, 0.55, 16)
    const geomTibia = new THREE.CylinderGeometry(0.12, 0.12, 0.50, 16)
    const geomEsfera = new THREE.SphereGeometry(0.16, 16, 16)
    const geomHombro = new THREE.SphereGeometry(0.20, 16, 16)
    const geomPie = new THREE.BoxGeometry(0.20, 0.10, 0.35)

    function makeArticulacion(geom = geomEsfera) {
        const mesh = new THREE.Mesh(geom, matArticulacion)
        mesh.castShadow = true
        return mesh
    }

    function makeBrazo(signo) {
        const hombro = new THREE.Group()
        hombro.position.set(signo * 0.55, 0.5, 0)
        hombro.add(makeArticulacion(geomHombro))

        const brazoSup = new THREE.Mesh(geomBrazoSup, matBrazos)
        brazoSup.position.y = -0.30
        brazoSup.castShadow = true
        hombro.add(brazoSup)

        const codo = new THREE.Group()
        codo.position.y = -0.30         // posición original conservada
        codo.add(makeArticulacion())
        brazoSup.add(codo)

        const antebrazo = new THREE.Mesh(geomAntebrazo, matBrazos)
        antebrazo.position.y = -0.30    // posición original conservada
        antebrazo.castShadow = true
        codo.add(antebrazo)

        return { hombro, codo, antebrazo }  // ← codo expuesto
    }

    function makePierna(signo) {
        const cadera = new THREE.Group()
        cadera.position.set(signo * 0.20, -0.65, 0)

        const esferaCadera = makeArticulacion()
        cadera.add(esferaCadera)

        const muslo = new THREE.Mesh(geomMuslo, matPiernas)
        muslo.position.y = -0.325
        muslo.castShadow = true
        esferaCadera.add(muslo)

        const rodilla = new THREE.Group()
        rodilla.position.y = -0.35      // posición original conservada
        rodilla.add(makeArticulacion())
        muslo.add(rodilla)

        const tibia = new THREE.Mesh(geomTibia, matPiernas)
        tibia.position.y = -0.30        // posición original conservada
        tibia.castShadow = true
        rodilla.add(tibia)

        const tobillo = new THREE.Group()
        tobillo.position.y = -0.30
        tibia.add(tobillo)

        const pie = new THREE.Mesh(geomPie, matPiernas)
        pie.position.y = 0
        pie.castShadow = true
        tobillo.add(pie)

        return { cadera, rodilla }  // ← rodilla expuesta
    }

    // ── Ensamblaje ──────────────────────────────────────────────────────────────
    const robot = new THREE.Group()

    const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), matCabeza)
    cabeza.position.y = 1.0
    cabeza.castShadow = true
    robot.add(cabeza)

    // ── Cara ────────────────────────────────────────────────────────────────────
    const matOjo = new THREE.MeshStandardMaterial({ color: 0x111111 })
    const matPupila = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 })
    const matBoca = new THREE.MeshStandardMaterial({ color: 0x222222 })
    const matAntena = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const matPuntaAnt = new THREE.MeshStandardMaterial({ color: 0xFF4444, emissive: 0xFF2222, emissiveIntensity: 0.5 })

    function makeOjo(signoX) {
        const grupo = new THREE.Group()
        grupo.position.set(signoX * 0.13, 0.08, 0.31)

        const globo = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 16),
            matOjo
        )
        globo.castShadow = true
        grupo.add(globo)

        const pupila = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16),
            matPupila
        )
        pupila.rotation.x = Math.PI / 2
        pupila.position.z = 0.065
        grupo.add(pupila)

        const parpado = new THREE.Group()
        parpado.position.z = 0.065
        const parpadoMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.072, 0.072, 0.018, 16),
            new THREE.MeshStandardMaterial({ color: 0xFFD700 })
        )
        parpadoMesh.rotation.x = Math.PI / 2
        parpado.add(parpadoMesh)
        grupo.add(parpado)

        return { grupo, parpado }
    }

    const ojoIzq = makeOjo(-1)
    const ojoDer = makeOjo(1)
    cabeza.add(ojoIzq.grupo)
    cabeza.add(ojoDer.grupo)

    const bocaMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.10, 0.025, 8, 20, Math.PI),
        matBoca
    )
    bocaMesh.rotation.z = Math.PI
    bocaMesh.position.set(0, -0.15, 0.305)
    cabeza.add(bocaMesh)

    function makeAntena(signoX) {
        const grupo = new THREE.Group()
        grupo.position.set(signoX * 0.20, 0.25, 0)
        grupo.rotation.z = signoX * (10 * Math.PI / 180)

        const palo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.40, 12),
            matAntena
        )
        palo.position.y = 0.20
        palo.castShadow = true
        grupo.add(palo)

        const punta = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 12, 12),
            matPuntaAnt
        )
        punta.position.y = 0.42
        punta.castShadow = true
        grupo.add(punta)

        return grupo
    }

    cabeza.add(makeAntena(-1))
    cabeza.add(makeAntena(1))

    robot.userData.parpados = {
        izq: ojoIzq.parpado,
        der: ojoDer.parpado,
    }

    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), matCuerpo)
    cuerpo.castShadow = true
    robot.add(cuerpo)

    const brazoIzq = makeBrazo(-1)
    robot.add(brazoIzq.hombro)

    const brazoDer = makeBrazo(1)
    robot.add(brazoDer.hombro)

    const piernaIzq = makePierna(-1)
    robot.add(piernaIzq.cadera)

    const piernaDer = makePierna(1)
    robot.add(piernaDer.cadera)

    robot.userData.articulaciones = {
        hombroIzq:         brazoIzq.hombro,
        hombroDer:         brazoDer.hombro,
        codoIzq:           brazoIzq.codo,       // ← añadido
        codoDer:           brazoDer.codo,       // ← añadido
        caderaIzq:         piernaIzq.cadera,
        caderaDer:         piernaDer.cadera,
        rodillaIzq:        piernaIzq.rodilla,
        rodillaDer:        piernaDer.rodilla,
    }

    return robot
}

// ─────────────────────────────────────────────────────────────────────────────
// animateRobot
// ─────────────────────────────────────────────────────────────────────────────
export function animateRobot(robot, timestamp) {
    const ud = robot.userData

    if (ud.lastTime       === undefined) ud.lastTime       = 0
    if (ud.elapsed        === undefined) ud.elapsed        = 0
    if (ud.proxPestanyo   === undefined) ud.proxPestanyo   = 3.0
    if (ud.tiempoPestanyo === undefined) ud.tiempoPestanyo = 0

    const delta = ud.lastTime === 0 ? 0 : (timestamp - ud.lastTime) * 0.001
    ud.lastTime = timestamp
    ud.elapsed += delta

    const { hombroIzq, hombroDer, codoIzq, codoDer,
            caderaIzq, caderaDer, rodillaIzq, rodillaDer } = ud.articulaciones

    const fase  = ud.elapsed * ANIM.velocidad
    const s     = Math.sin(fase)
    const sCodo = Math.sin(fase + Math.PI * 0.5)   // ← definido aquí

    // Hombros
    hombroIzq.rotation.x =  s * ANIM.amplHombros
    hombroDer.rotation.x = -s * ANIM.amplHombros

    // Caderas
    caderaIzq.rotation.x = -s * ANIM.amplCaderas
    caderaDer.rotation.x =  s * ANIM.amplCaderas

    // Codos
    codoIzq.rotation.x =  sCodo * ANIM.amplCodos
    codoDer.rotation.x = -sCodo * ANIM.amplCodos

    // Rodillas
    rodillaIzq.rotation.x = Math.max(0, -s) * ANIM.amplRodillas
    rodillaDer.rotation.x = Math.max(0,  s) * ANIM.amplRodillas

    // Pestañeo
    const { izq, der } = ud.parpados
    ud.proxPestanyo   -= delta
    ud.tiempoPestanyo  = Math.max(0, ud.tiempoPestanyo - delta)

    if (ud.proxPestanyo <= 0) {
        ud.proxPestanyo   = 2.5 + Math.random() * 2.5
        ud.tiempoPestanyo = 0.30
    }

    // Función triangular: 1 (abierto) → 0 (cerrado) → 1 (abierto)
    const t      = ud.tiempoPestanyo / 0.30
    const escala = t < 0.5 ? t * 2 : (1 - t) * 2
    izq.scale.y  = escala
    der.scale.y  = escala
}