const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const outputPath = path.join(__dirname, 'js', 'env.js');

let envConfig = {};

// Intentar leer .env local
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const lines = envFile.split('\n');
    for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...values] = line.split('=');
            if (key) {
                envConfig[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
            }
        }
    }
}

// También tomar variables de entorno del sistema (útil para Railway/producción)
if (process.env.API_BASE_URL) {
    envConfig.API_BASE_URL = process.env.API_BASE_URL;
}

const jsContent = `// Archivo autogenerado por build-env.js\nwindow.ENV = ${JSON.stringify(envConfig, null, 4)};\n`;

if (!fs.existsSync(path.join(__dirname, 'js'))) {
    fs.mkdirSync(path.join(__dirname, 'js'));
}

fs.writeFileSync(outputPath, jsContent, 'utf-8');
console.log('Variables de entorno generadas en js/env.js');
