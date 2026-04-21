import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// createCristal
// ─────────────────────────────────────────────────────────────────────────────
export function createCristal() {
    const group = new THREE.Group()

    // ── 1. NÚCLEO ─────────────────────────────────────────────────────────────
    // Icosaedro sólido metálico azul-morado
    const nucleoGeo = new THREE.IcosahedronGeometry(0.55, 1)
    const nucleoMat = new THREE.MeshStandardMaterial({
        color:             0x5533ff,
        emissive:          0x2211aa,
        emissiveIntensity: 0.6,
        metalness:         0.8,
        roughness:         0.2,
    })
    const nucleo = new THREE.Mesh(nucleoGeo, nucleoMat)
    nucleo.castShadow = true
    group.add(nucleo)

    // ── 2. WIREFRAME ──────────────────────────────────────────────────────────
    // Misma geometría pero en modo wireframe, color cian claro
    const wireMat = new THREE.MeshBasicMaterial({
        color:       0x88eeff,
        wireframe:   true,
        transparent: true,
        opacity:     0.55,
    })
    // Ligeramente más grande para evitar z-fighting con el núcleo
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.558, 1), wireMat)
    group.add(wire)

    // ── 3. AURA ───────────────────────────────────────────────────────────────
    // Capa exterior translúcida con emissive para el halo energético
    const auraMat = new THREE.MeshStandardMaterial({
        color:             0x9966ff,
        emissive:          0x6633ff,
        emissiveIntensity: 1.0,
        transparent:       true,
        opacity:           0.22,
        side:              THREE.DoubleSide,
        depthWrite:        false,
    })
    const aura = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), auraMat)
    aura.scale.setScalar(1.2)
    aura.renderOrder = 1
    group.add(aura)

    // ── 4. LUZ PUNTUAL energética ─────────────────────────────────────────────
    // PointLight cerca del cristal para iluminar objetos cercanos
    const luz = new THREE.PointLight(0x6644ff, 2.5, 4.0)
    luz.position.set(0, 0, 0)
    group.add(luz)

    // Referencias para la animación
    group.userData.nucleo = nucleo
    group.userData.wire   = wire
    group.userData.aura   = aura
    group.userData.luz    = luz

    return group
}

// ─────────────────────────────────────────────────────────────────────────────
// animateCristal
// ─────────────────────────────────────────────────────────────────────────────
export function animateCristal(group, timestamp) {
    const ud = group.userData
    if (ud.lastTime === undefined) ud.lastTime = 0
    if (ud.elapsed  === undefined) ud.elapsed  = 0

    const delta = ud.lastTime === 0 ? 0 : (timestamp - ud.lastTime) * 0.001
    ud.lastTime = timestamp
    ud.elapsed += delta

    const t = ud.elapsed

    // Grupo completo: rotación lenta orbital
    group.rotation.y += delta * 0.4
    group.rotation.x  = Math.sin(t * 0.3) * 0.15

    // Movimiento vertical flotante
    group.position.y = Math.sin(t * 1.1) * 0.18

    // Núcleo rota en sentido contrario y más rápido
    ud.nucleo.rotation.y -= delta * 1.1
    ud.nucleo.rotation.x += delta * 0.7

    // Wireframe sigue al grupo (no necesita rotación extra, hereda la del group)
    // pero añadimos un giro propio sutil en Z para dar dinamismo
    ud.wire.rotation.z += delta * 0.5

    // Escala pulsante suave del grupo completo
    const pulse = 1.0 + Math.sin(t * 1.8) * 0.07
    group.scale.setScalar(pulse)

    // Aura pulsa desfasada con mayor amplitud
    const auraPulse = 1.2 + Math.sin(t * 1.8 + 1.2) * 0.12
    ud.aura.scale.setScalar(auraPulse)
    ud.aura.material.opacity           = 0.18 + Math.sin(t * 2.5) * 0.08
    ud.aura.material.emissiveIntensity  = 0.8  + Math.sin(t * 3.0) * 0.5

    // Luz parpadea suavemente
    ud.luz.intensity = 2.0 + Math.sin(t * 4.0) * 0.8
}