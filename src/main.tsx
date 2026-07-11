import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Debug } from './components/Debug'
import './index.css'

// A hidden debug route: `#t=dbg` renders the internal Debug harness instead of
// the app. Decided at the root, above useAppState, so the app's URL-state sync
// never runs in debug mode and can't overwrite the debug hash.
const isDebug = () => window.location.hash.replace(/^#/, '') === 't=dbg'

function Root() {
  const [debug, setDebug] = useState(isDebug)
  useEffect(() => {
    const onHash = () => setDebug(isDebug())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return debug ? <Debug /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
