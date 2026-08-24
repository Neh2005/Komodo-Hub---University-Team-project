
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Replaces the unpinned, no-integrity-check CDN <script>/<link> tags that used to sit in
// index.html (ZAP flagged them: Sub Resource Integrity Attribute Missing, Medium) with
// the version already pinned in package.json and verified by npm's lockfile — needed for
// Header.jsx's data-bs-toggle mobile nav collapse (react-bootstrap's own components don't
// need this, but that raw Bootstrap JS behavior does).
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

createRoot(document.getElementById('root')).render(
    <App />
  
)
