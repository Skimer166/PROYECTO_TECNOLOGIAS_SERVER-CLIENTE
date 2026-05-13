// Carga variables de entorno desde el archivo .env raiz del proyecto
// para que process.env las tenga disponibles durante los tests E2E
const fs   = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    // No sobreescribir variables ya definidas en el entorno del sistema
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}
