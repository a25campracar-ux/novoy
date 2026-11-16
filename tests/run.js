// Ejecuta todas las pruebas (tests/*.test.js). Sin dependencias: `node tests/run.js`.
// Sale con código 1 si alguna falla, para que la integración continua bloquee el despliegue.
const { readdirSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const dir = __dirname;
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8' });
  if (r.status === 0) console.log('OK     ' + f);
  else { failed++; console.log('FALLA  ' + f + '\n' + (r.stderr || r.stdout).split('\n').slice(0, 12).join('\n')); }
}
console.log(`\n${files.length - failed}/${files.length} pruebas correctas`);
process.exit(failed ? 1 : 0);
