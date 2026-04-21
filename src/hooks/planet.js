import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const loader = new THREE.TextureLoader()

const ASTEROID_TEXTURES = [
    loader.load('/textures/asteroide_ceres.jpg'),
    loader.load('/textures/asteroide_eris.jpg'),
    loader.load('/textures/asteroide_haumea.jpg'),
    loader.load('/textures/asteroide_makemake.jpg'),
]

const NUBES_TEX = loader.load('/textures/nubes.jpg')
NUBES_TEX.wrapS = THREE.RepeatWrapping
NUBES_TEX.wrapT = THREE.ClampToEdgeWrapping

const CINTURONES = [
    { radio: 2.0, inclinacion: 0.30, velocidad: 0.08, cantidad: 55, dispersion: 0.30 },
    { radio: 2.9, inclinacion: 0.55, velocidad: -0.05, cantidad: 40, dispersion: 0.45 },
    { radio: 3.8, inclinacion: 0.15, velocidad: 0.03, cantidad: 30, dispersion: 0.60 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function rand(seed) {
    const x = Math.sin(seed + 1) * 43758.5453
    return x - Math.floor(x)
}

function makeCinturon({ radio, inclinacion, cantidad, dispersion }, semillaBase) {
    const group = new THREE.Group()
    group.rotation.x = inclinacion

    const colores = [0x888880, 0x706860, 0x998870, 0xAAA090, 0x605850]

    for (let i = 0; i < cantidad; i++) {
        const r0 = rand(semillaBase + i * 3)
        const r1 = rand(semillaBase + i * 3 + 1)
        const r2 = rand(semillaBase + i * 3 + 2)

        const angulo = (i / cantidad) * Math.PI * 2 + (r0 - 0.5) * 0.4
        const radioLocal = radio + (r1 - 0.5) * dispersion
        const elevacion = (r2 - 0.5) * dispersion * 0.4
        const tamaño = 0.03 + r0 * 0.07

        // Elegir textura aleatoria de asteroides
        const texIdx = Math.floor(r2 * ASTEROID_TEXTURES.length)
        const asteroidTexture = ASTEROID_TEXTURES[texIdx].clone()
        asteroidTexture.wrapS = THREE.RepeatWrapping
        asteroidTexture.wrapT = THREE.RepeatWrapping
        // Offset UV aleatorio para mostrar parte diferente de la textura
        asteroidTexture.offset.set(rand(semillaBase + i * 7), rand(semillaBase + i * 7 + 1))
        asteroidTexture.repeat.set(0.5 + r0 * 0.5, 0.5 + r1 * 0.5)
        asteroidTexture.needsUpdate = true

        const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(tamaño, 1),
            new THREE.MeshStandardMaterial({
                color: colores[i % colores.length],
                map: asteroidTexture,
                roughness: 0.9,
                metalness: 0.05,
                flatShading: true,
            })
        )

        mesh.scale.set(1 + r0 * 0.6, 0.6 + r1 * 0.8, 0.7 + r2 * 0.6)
        mesh.position.set(
            Math.cos(angulo) * radioLocal,
            elevacion,
            Math.sin(angulo) * radioLocal,
        )
        mesh.rotation.set(r0 * Math.PI * 2, r1 * Math.PI * 2, r2 * Math.PI * 2)
        // Guardar datos para animación de rotación propia
        mesh.userData.rotSpeed = {
            x: (r0 - 0.5) * 0.5,
            y: (r1 - 0.5) * 0.5,
            z: (r2 - 0.5) * 0.5,
        }

        group.add(mesh)
    }

    return group
}

// ─────────────────────────────────────────────────────────────────────────────
// Ruido esférico FBM
// ─────────────────────────────────────────────────────────────────────────────

function hashV(ix, iy, iz) {
    let n = ix * 1619 + iy * 31337 + iz * 6791
    n = (n << 13) ^ n
    return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0)
}

function smoothstep(t) { return t * t * (3 - 2 * t) }

function lerp(a, b, t) { return a + (b - a) * t }

function valueNoise3D(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
    const fx = x - ix, fy = y - iy, fz = z - iz
    const ux = smoothstep(fx), uy = smoothstep(fy), uz = smoothstep(fz)

    return lerp(
        lerp(lerp(hashV(ix,   iy,   iz),   hashV(ix+1, iy,   iz),   ux),
             lerp(hashV(ix,   iy+1, iz),   hashV(ix+1, iy+1, iz),   ux), uy),
        lerp(lerp(hashV(ix,   iy,   iz+1), hashV(ix+1, iy,   iz+1), ux),
             lerp(hashV(ix,   iy+1, iz+1), hashV(ix+1, iy+1, iz+1), ux), uy),
        uz
    )
}

function fbm(x, y, z, octaves = 6, lacunarity = 2.1, gain = 0.5) {
    let value = 0, amplitude = 0.5, frequency = 1.0, maxVal = 0
    for (let o = 0; o < octaves; o++) {
        value += amplitude * valueNoise3D(x * frequency, y * frequency, z * frequency)
        maxVal += amplitude
        amplitude *= gain
        frequency *= lacunarity
    }
    return value / maxVal
}

function uvToSphere(u, v) {
    const theta = u * Math.PI * 2
    const phi   = v * Math.PI
    return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
    }
}

function createAlienCloudTexture({
    seed = 0,
    bandStrength = 0.6,
    coverage = 0.45,
    stormCount = 2,
    tint = [255, 240, 220],
    size = 512,
} = {}) {
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext("2d")
    const imageData = ctx.createImageData(size, size)
    const data = imageData.data

    const storms = []
    for (let s = 0; s < stormCount; s++) {
        const sr = seed * 100 + s * 73.13
        storms.push({
            lat:      (Math.sin(sr * 17.3) * 0.5 + 0.5) * 0.7 + 0.15,
            lon:      Math.sin(sr * 31.7) * 0.5 + 0.5,
            radius:   0.04 + Math.abs(Math.sin(sr * 11.1)) * 0.06,
            strength: 0.6  + Math.abs(Math.sin(sr * 7.7))  * 0.4,
        })
    }

    for (let py = 0; py < size; py++) {
        const v   = py / size
        const lat = v
        const windBias = Math.sin(lat * Math.PI * 3) * bandStrength * 0.15

        for (let px = 0; px < size; px++) {
            const u = px / size
            const p = uvToSphere(u, v)

            const shearU    = u + windBias
            const pSheared  = uvToSphere(shearU, v)
            const s         = seed * 3.7

            const cloud  = fbm(pSheared.x * 5 + s, pSheared.y * 5 + s, pSheared.z * 5 + s, 6)
            const detail = fbm(p.x * 15 + s + 1.1,  p.y * 15 + s,        p.z * 15 + s,        4, 2.3, 0.45)
            const ridged = 1 - Math.abs(fbm(p.x * 8 + s, p.y * 8 + s, p.z * 8 + s, 5))
            const erosion = fbm(p.x * 20 + s, p.y * 20 + s, p.z * 20 + s, 3)
            const bandNoise = fbm(p.x * 2 + s, p.y * 2, p.z * 2, 3)
            const band =
                Math.pow(Math.abs(Math.sin(lat * Math.PI * 4 + windBias * 5)), 1.2) *
                bandStrength *
                (0.6 + bandNoise * 0.4)

            let density = cloud * 0.5 + ridged * 0.3 + detail * 0.2 - erosion * 0.15;


            // Añadir tormentas (si las hay)
            for (const storm of storms) {
                const du = Math.min(Math.abs(u - storm.lon), 1 - Math.abs(u - storm.lon));
                const dv = v - storm.lat;
                const dist = Math.sqrt(du * du + dv * dv);
                if (dist < storm.radius * 3) {
                    const angle = Math.atan2(dv, du) + dist * 8;
                    const noiseStorm = fbm(du * 10, dv * 10, s, 3);
                    const spiral =
                        Math.cos(angle + noiseStorm * 2) *
                        (1 - dist / (storm.radius * 3));
                    density += spiral * storm.strength * 0.25 * Math.exp(-dist / storm.radius);
                }
            }
            // minDensity depende de coverage: más coverage = umbral más bajo = más nubes
            const minDensity = 0.35 - coverage * 0.30
            const maxDensity = 0.90
            let t = (density - minDensity) / (maxDensity - minDensity)
            t = Math.max(0, Math.min(1, t))

            const contrasted = Math.pow(t, 2.5) * 0.95
            const alpha = contrasted * 0.98
            const colorVar = density * 40 + fbm(p.x * 6, p.y * 6, p.z * 6, 2) * 20
            const i = (py * size + px) * 4
            data[i]     = tint[0]
            data[i + 1] = tint[1] + colorVar * 0.8
            data[i + 2] = tint[2] + colorVar * 0.6
            data[i + 3] = alpha * 255
        }
    }

    ctx.putImageData(imageData, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
}

// ─────────────────────────────────────────────────────────────────────────────
// createPlanet
// ─────────────────────────────────────────────────────────────────────────────
export function createPlanet() {
    const group = new THREE.Group()

    // ── Planeta ───────────────────────────────────────────────────────────────
    const textura = loader.load("/textures/Terrestrial2.png")

    const planeta = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 128, 128),
        new THREE.MeshPhongMaterial({
            color: 0xffcc88,
            map: textura,
            shininess: 5,
            emissive: 0x331100,
        })
    )
    planeta.castShadow = true
    planeta.receiveShadow = true
    planeta.renderOrder = 1
    group.add(planeta)

    // ── Atmósfera ─────────────────────────────────────────────────────────────
    const atmosfera = new THREE.Mesh(
        new THREE.SphereGeometry(1.28, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xadbcff,
            transparent: true,
            opacity: 0.10,
            side: THREE.BackSide,
            depthWrite: false,
        })
    )
    atmosfera.renderOrder = 3
    atmosfera.material.depthWrite = false
    group.add(atmosfera)

    // ── Nubes en tres capas (textura real de la Tierra) ──────────────────────

    // Clonamos la textura para que cada capa tenga su propio offset UV
    const texNubes1 = NUBES_TEX.clone()
    texNubes1.wrapS = THREE.RepeatWrapping
    texNubes1.offset.x = 0.0

    const texNubes2 = NUBES_TEX.clone()
    texNubes2.wrapS = THREE.RepeatWrapping
    texNubes2.offset.x = 0.33

    const texNubes3 = NUBES_TEX.clone()
    texNubes3.wrapS = THREE.RepeatWrapping
    texNubes3.offset.x = 0.66

    // Capa 1 — nubes bajas densas (más opaca, radio más pegado al planeta)
    const nubes = new THREE.Mesh(
        new THREE.SphereGeometry(1.225, 128, 128),
        new THREE.MeshBasicMaterial({
            map: texNubes1,
            transparent: true, opacity: 0.95,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    )
    nubes.renderOrder = 2
    group.add(nubes)

    // Capa 2 — nubes medias, desplazadas (semitransparente)
    const nubesMid = new THREE.Mesh(
        new THREE.SphereGeometry(1.245, 64, 64),
        new THREE.MeshBasicMaterial({
            map: texNubes2,
            transparent: true, opacity: 0.75,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    )
    nubesMid.renderOrder = 2
    group.add(nubesMid)

    // Capa 3 — cirros altos, casi transparentes (radio mayor)
    const nubesAltas = new THREE.Mesh(
        new THREE.SphereGeometry(1.265, 64, 64),
        new THREE.MeshBasicMaterial({
            map: texNubes3,
            transparent: true, opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    )
    nubesAltas.renderOrder = 2
    group.add(nubesAltas)

    // ── Cinturones de asteroides ──────────────────────────────────────────────
    const cinturones = CINTURONES.map((cfg, idx) => {
        const c = makeCinturon(cfg, idx * 1000)
        group.add(c)
        return { group: c, velocidad: cfg.velocidad }
    })

    // Referencias animables — todas en un único bloque, sin sobreescrituras
    group.userData.planeta    = planeta
    group.userData.atmosfera  = atmosfera
    group.userData.nubes      = nubes
    group.userData.nubesMid   = nubesMid
    group.userData.nubesAltas = nubesAltas
    group.userData.cinturones = cinturones

    // Fase inicial para opacidad de nubes (cada capa desfasada)
    group.userData.cloudPhases = [0, 2.1, 4.2]

    return group
}

// ─────────────────────────────────────────────────────────────────────────────
// animatePlanet
// ─────────────────────────────────────────────────────────────────────────────
export function animatePlanet(group, timestamp) {
    const ud = group.userData

    if (ud.lastTime === undefined) ud.lastTime = 0
    if (ud.elapsed  === undefined) ud.elapsed  = 0

    const delta = ud.lastTime === 0 ? 0 : (timestamp - ud.lastTime) * 0.001
    ud.lastTime = timestamp
    ud.elapsed += delta

    // ── Movimiento de texturas de nubes (simula vientos) ──
    if (ud.nubes && ud.nubes.material.map) {
        ud.nubes.material.map.offset.x += delta * 0.01
    }
    if (ud.nubesMid && ud.nubesMid.material.map) {
        ud.nubesMid.material.map.offset.x -= delta * 0.02
    }
    if (ud.nubesAltas && ud.nubesAltas.material.map) {
        ud.nubesAltas.material.map.offset.x += delta * 0.05
    }

    // ── Rotación del planeta ──
    if (ud.planeta) ud.planeta.rotation.y = ud.elapsed * 0.3

    // ── Rotación de capas de nubes ──
    if (ud.nubes)      ud.nubes.rotation.y      += delta * 0.04
    if (ud.nubesMid)   ud.nubesMid.rotation.y   -= delta * 0.07
    if (ud.nubesAltas) ud.nubesAltas.rotation.y += delta * 0.18

    // ── Opacidad variable suave para simular nubes reales ──
    // Cada capa tiene su propia fase para que no todas cambien a la vez
    const phases = ud.cloudPhases || [0, 2.1, 4.2]
    phases[0] += delta * 0.15
    phases[1] += delta * 0.22
    phases[2] += delta * 0.35
    ud.cloudPhases = phases

    if (ud.nubes) {
        // Opacidad oscila entre 0.75 y 1.0 — nubes bajas son más estables
        ud.nubes.material.opacity = 0.88 + Math.sin(phases[0]) * 0.12
    }
    if (ud.nubesMid) {
        // Opacidad oscila entre 0.55 y 0.95 — medias cambian más
        ud.nubesMid.material.opacity = 0.75 + Math.sin(phases[1]) * 0.20
    }
    if (ud.nubesAltas) {
        // Opacidad oscila entre 0.35 y 0.90 — altas son muy variables
        ud.nubesAltas.material.opacity = 0.62 + Math.sin(phases[2]) * 0.28
    }

    // ── Atmósfera ──
    if (ud.atmosfera) {
        ud.atmosfera.rotation.y -= delta * 0.01
        ud.atmosfera.material.opacity = 0.15 + Math.sin(ud.elapsed * 0.5) * 0.03
    }

    // ── Cinturones de asteroides ──
    for (const { group: cg, velocidad } of ud.cinturones) {
        cg.rotation.y += velocidad * delta
        // Rotación propia de cada asteroide
        cg.children.forEach(asteroid => {
            if (asteroid.userData.rotSpeed) {
                asteroid.rotation.x += asteroid.userData.rotSpeed.x * delta
                asteroid.rotation.y += asteroid.userData.rotSpeed.y * delta
                asteroid.rotation.z += asteroid.userData.rotSpeed.z * delta
            }
        })
    }
}