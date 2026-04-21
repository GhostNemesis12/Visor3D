import { useRef, useEffect } from 'react'
import { useVisor3D } from './hooks/useVisor3D'
import './App.css'

export default function App() {
  // canvasRef conecta el elemento <canvas> con Three.js
  const canvasRef = useRef(null)

  // Hook personalizado que contiene TODA la lógica de Three.js
  // Ábrelo en src/hooks/useVisor3D.js para trabajar
  useVisor3D(canvasRef)

  return (
    <div className="app">
      {/* Título de la aplicación */}
      <header className="header">
        <h1>🎮 Visor 3D</h1>
        <p>Usa el ratón para rotar · Scroll para zoom · Click derecho para mover</p>
      </header>

      {/* Canvas donde Three.js pinta la escena 3D */}
      <canvas ref={canvasRef} className="canvas" />

      {/* TODO (Ampliación ⭐): Aquí puedes añadir un panel de controles */}
    </div>
  )
}
