import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode: the experiences own WebGL contexts and rAF loops that must mount exactly once.
createRoot(document.getElementById('root')!).render(<App />)
