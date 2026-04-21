# Visor 3D — Proyecto Base

## Arrancar el proyecto

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

## ¿Dónde trabajo?

Toda la lógica Three.js está en **`src/hooks/useVisor3D.js`**.
Busca los comentarios `TODO` para saber qué tienes que añadir.

## Estructura

```
src/
├── App.jsx              ← Componente React principal (no toques)
├── App.css              ← Estilos del layout
├── main.jsx             ← Punto de entrada React (no toques)
├── index.css            ← Estilos globales
└── hooks/
    └── useVisor3D.js    ← ⭐ AQUÍ TRABAJAS ⭐
```

## Requisitos de la práctica

### Obligatorio
- [ ] 3 geometrías diferentes (BoxGeometry, SphereGeometry, TorusGeometry...)
- [ ] Al menos 2 luces (AmbientLight + otra)
- [ ] OrbitControls funcional
- [ ] Animación básica en el loop

### Opcionales ⭐
- [ ] Panel de UI para cambiar color o velocidad (dat.GUI o leva)
- [ ] Raycasting: click sobre objeto cambia su color
- [ ] Cargar modelo GLTF con GLTFLoader
