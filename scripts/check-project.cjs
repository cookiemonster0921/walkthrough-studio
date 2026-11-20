const fs = require('node:fs');
const path = require('node:path');
const C = require('../studio/core.js');
try {
  const file = path.resolve(process.argv[2] || 'examples/demo/project.json');
  const project = C.validate(JSON.parse(fs.readFileSync(file, 'utf8')));
  const missing = project.scenes.map(s=>s.image).filter(p=>!fs.existsSync(path.resolve(path.dirname(file),p)));
  if (missing.length) throw new Error(`Missing images: ${[...new Set(missing)].join(', ')}`);
  console.log(`Valid manifest: ${project.scenes.length} scenes, ${C.duration(project)} seconds. Verify image dimensions and alignment in Studio.`);
} catch(e) {console.error(e.message);process.exitCode=1;}
