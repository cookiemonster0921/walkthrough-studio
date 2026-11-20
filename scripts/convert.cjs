// Optional local MP4 conversion. Uses an already installed, approved FFmpeg binary.
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const input = process.argv[2], output = process.argv[3] || (input && input.replace(/\.[^.]+$/, '') + '.mp4');
if (!input || !fs.existsSync(input)) { console.error('Usage: npm run convert -- input.webm [new-output.mp4]');process.exit(1); }
if (path.resolve(input) === path.resolve(output) || fs.existsSync(output)) {console.error('Choose a new output filename; existing files are preserved.');process.exit(1);}
const result = spawnSync('ffmpeg',['-n','-i',input,'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output],{stdio:'inherit',shell:false});
if (result.error) console.error('FFmpeg is unavailable. Install an approved copy or use an approved video editor.');
process.exitCode = result.status ?? 1;
