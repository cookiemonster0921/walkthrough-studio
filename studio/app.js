/* No build step, external requests, analytics, microphone, or upload endpoint. */
'use strict';
const C = globalThis.WalkthroughCore;
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
let project = null, assets = new Map(), images = new Map(), objectURLs = [], current = 0, playing = false, origin = 0, raf = 0, recording = null, exporting = false, musicFile = null;
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function fmt(t) { return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`; }
function stopPreview() { playing = false; cancelAnimationFrame(raf); $('play').textContent = 'Play preview'; }
function download(blob, filename) { const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
function roundRect(box, color, stroke) { ctx.beginPath(); ctx.roundRect(box.x, box.y, box.w, box.h, Math.min(12, box.h / 2)); ctx.fillStyle = color; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); } }
function ellipsis(text, width) { while (text && ctx.measureText(text).width > width) text = text.slice(0, -2); return text; }
function viewport() { return {x: project.width * .035, y: project.height * .16, w: project.width * .93, h: project.height * .69}; }
function drawHighlight(h, camera, scene, local, vp) {
  if (local < (h.start ?? 0) || local >= (h.end ?? scene.duration)) return;
  const target = C.intersect(camera.rect(h.rect), camera.painted);
  if (!target) return;
  const alpha = C.ease((local - (h.start ?? 0)) / .35);
  ctx.save(); ctx.globalAlpha = alpha;
  roundRect(target, 'rgba(81,215,198,.10)', '#28baa9');
  if (h.label) {
    const fs = project.width / 70; ctx.font = `600 ${fs}px system-ui,sans-serif`;
    const labelText = ellipsis(h.label, vp.w * .46), w = ctx.measureText(labelText).width + 32, height = fs + 24;
    const right = h.side === 'right';
    const label = {x: right ? vp.x + vp.w - w : vp.x, y: project.height * .88, w, h: height};
    const center = {x: label.x + label.w / 2, y: label.y + label.h / 2};
    const end = C.borderPoint(target, center), start = C.borderPoint(label, end);
    ctx.strokeStyle = '#51d7c6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(end.x, end.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#51d7c6'; ctx.fill();
    roundRect(label, '#102c3a', '#51d7c6'); ctx.fillStyle = '#fff'; ctx.fillText(labelText, label.x + 16, label.y + fs + 7);
  }
  ctx.restore();
}
function draw(seconds) {
  if (!project) { ctx.fillStyle = '#0c1c2d'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#80d9cf'; ctx.font = '42px system-ui'; ctx.fillText('Load a project to preview your walkthrough.', 90, 180); return; }
  current = Math.max(0, Math.min(seconds, C.duration(project)));
  const {scene, index, local} = C.sceneAt(project, current), vp = viewport(), cam = C.camera(scene, local, vp, 1.5);
  ctx.fillStyle = '#0c1c2d'; ctx.fillRect(0, 0, project.width, project.height);
  ctx.fillStyle = '#51d7c6'; ctx.font = `700 ${project.width / 86}px system-ui`; ctx.fillText(project.title.toUpperCase(), vp.x, project.height * .058);
  ctx.fillStyle = '#fff'; ctx.font = `650 ${project.width / 45}px system-ui`; ctx.fillText(ellipsis(scene.title, vp.w), vp.x, project.height * .115);
  ctx.fillStyle = '#fff'; ctx.fillRect(vp.x, vp.y, vp.w, vp.h);
  ctx.save(); ctx.beginPath(); ctx.rect(vp.x, vp.y, vp.w, vp.h); ctx.clip();
  ctx.drawImage(images.get(scene.image), cam.crop.x, cam.crop.y, cam.crop.w, cam.crop.h, cam.painted.x, cam.painted.y, cam.painted.w, cam.painted.h);
  ctx.restore();
  // Labels have their own footer row. Prevent label overlap by allowing at most two per scene.
  for (const h of scene.highlights || []) drawHighlight(h, cam, scene, local, vp);
  ctx.fillStyle = '#a9c1d0'; ctx.font = `${project.width / 110}px system-ui`; ctx.fillText(project.footer || 'Local walkthrough', vp.x, project.height * .974);
  ctx.fillStyle = '#294251'; ctx.fillRect(vp.x, project.height * .988, vp.w, 4);
  ctx.fillStyle = '#51d7c6'; ctx.fillRect(vp.x, project.height * .988, vp.w * current / C.duration(project), 4);
  $('scrub').value = current; $('time').textContent = `${fmt(current)} / ${fmt(C.duration(project))}`;
  [...$('scenes').children].forEach((li, i) => li.classList.toggle('active', i === index));
}
async function applyProject(candidate, fileMap) {
  C.validate(candidate);
  const loaded = new Map(), newURLs = [];
  try {
    for (const s of candidate.scenes) {
      if (loaded.has(s.image)) {
        const img = loaded.get(s.image);
        if (img.naturalWidth !== s.source.width || img.naturalHeight !== s.source.height) throw new Error(`${s.id}: conflicting source dimensions`);
        continue;
      }
      const file = fileMap.get(s.image);
      if (!file) throw new Error(`Missing image: ${s.image}. Open the entire project folder.`);
      const url = URL.createObjectURL(file); newURLs.push(url);
      const img = new Image(); img.src = url; await img.decode();
      if (img.naturalWidth !== s.source.width || img.naturalHeight !== s.source.height) throw new Error(`${s.id}: manifest says ${s.source.width}×${s.source.height}, image is ${img.naturalWidth}×${img.naturalHeight}. Recheck coordinates.`);
      loaded.set(s.image, img);
    }
  } catch (e) { newURLs.forEach(URL.revokeObjectURL); throw e; }
  stopPreview(); objectURLs.forEach(URL.revokeObjectURL); objectURLs = newURLs;
  project = candidate; assets = fileMap; images = loaded; canvas.width = project.width; canvas.height = project.height;
  $('editor').value = JSON.stringify(project, null, 2); $('scrub').max = C.duration(project);
  $('scenes').replaceChildren(); let at = 0;
  for (const s of project.scenes) { const li = document.createElement('li'); li.textContent = `${s.title} · ${s.duration}s`; const start = at; li.onclick = () => { if (!exporting) { stopPreview(); draw(start); } }; $('scenes').append(li); at += s.duration; }
  for (const id of ['play', 'scrub', 'apply', 'save']) $(id).disabled = false;
  $('export').disabled = typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function';
  draw(0); status(`Loaded ${project.scenes.length} scenes · ${fmt(C.duration(project))}. Review every highlight before export.`);
}
async function openFiles(files) {
  if (exporting) return;
  try {
    const map = new Map();
    for (const file of files) {
      const path = file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name;
      if (map.has(path)) throw new Error(`Duplicate filename ${path}; use the folder picker instead`);
      map.set(path, file);
    }
    const manifests = [...map.keys()].filter(p => p === 'project.json');
    if (manifests.length !== 1) throw new Error('Choose the folder with project.json directly inside it');
    await applyProject(JSON.parse(await map.get(manifests[0]).text()), map);
  } catch (e) { status(e.message, true); }
}
$('folder').onchange = e => openFiles([...e.target.files]); $('files').onchange = e => openFiles([...e.target.files]);
$('apply').onclick = async () => { try { await applyProject(JSON.parse($('editor').value), assets); } catch(e) { status(e.message, true); } };
$('save').onclick = () => download(new Blob([JSON.stringify(project, null, 2)], {type:'application/json'}), 'project.json');
$('scrub').oninput = e => { stopPreview(); draw(Number(e.target.value)); };
$('play').onclick = () => {
  if (playing) return stopPreview();
  if (current >= C.duration(project)) current = 0;
  playing = true; origin = performance.now() - current * 1000; $('play').textContent = 'Pause preview';
  function tick(now) { if (!playing) return; draw((now-origin)/1000); if (current >= C.duration(project)) stopPreview(); else raf = requestAnimationFrame(tick); }
  raf = requestAnimationFrame(tick);
};
$('music').onchange = e => { musicFile = e.target.files[0] || null; $('music-status').textContent = musicFile ? `Music: ${musicFile.name}. It will loop during export.` : 'Music: none.'; };
$('demo').onclick = async () => {
  if (location.protocol === 'file:') return status('For the demo, choose examples/demo with Open project folder. No server is required.');
  try {
    const base = new URL('../examples/demo/', location.href), p = await (await fetch(new URL('project.json', base))).json(), map = new Map();
    for (const s of p.scenes) map.set(s.image, await (await fetch(new URL(s.image, base))).blob());
    await applyProject(p, map);
  } catch(e) { status(e.message, true); }
};
async function exportVideo() {
  if (!project || exporting) return;
  const mime = C.chooseMime(type => MediaRecorder.isTypeSupported(type));
  if (!mime) return status('This browser cannot encode a supported video format.', true);
  stopPreview(); draw(0);
  let stream, audioContext, musicElement, musicURL, rafId, cancelled = false, failure = null;
  const chunks = [], controls = [...document.querySelectorAll('button,input,textarea')];
  const oldDisabled = controls.map(e => e.disabled);
  const cancel = reason => { cancelled = true; failure = reason; if (recording?.state === 'recording') recording.stop(); };
  const onHidden = () => { if (document.hidden) cancel('Export cancelled because the tab was hidden. Keep it visible and try again.'); };
  exporting = true; controls.forEach(e => e.disabled = true);
  try {
    stream = canvas.captureStream(project.fps);
    if (musicFile) {
      audioContext = new AudioContext(); await audioContext.resume();
      musicURL = URL.createObjectURL(musicFile); musicElement = new Audio(musicURL); musicElement.loop = true;
      const source = audioContext.createMediaElementSource(musicElement), gain = audioContext.createGain(), destination = audioContext.createMediaStreamDestination();
      gain.gain.value = .55; source.connect(gain).connect(destination);
      destination.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      await musicElement.play();
    }
    recording = new MediaRecorder(stream, {mimeType:mime, videoBitsPerSecond:10000000});
    const stopped = new Promise((resolve, reject) => { recording.onstop = resolve; recording.onerror = e => reject(e.error || new Error('Encoder failed')); });
    recording.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    $('cancel').hidden = false; $('cancel').disabled = false;
    $('cancel').onclick = () => cancel('Export cancelled. No output was saved.');
    document.addEventListener('visibilitychange', onHidden); recording.start(500);
    const began = performance.now(), total = C.duration(project);
    function tick(now) {
      if (recording?.state !== 'recording') return;
      const elapsed = Math.min(total, (now-began)/1000); draw(elapsed);
      status(`Exporting ${fmt(elapsed)} / ${fmt(total)} · keep this tab visible`);
      if (elapsed >= total) recording.stop(); else rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick); await stopped;
    if (cancelled) status(failure, true);
    else {
      const extension = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'walkthrough';
      download(new Blob(chunks, {type:mime}), `${slug}-${new Date().toISOString().replace(/[:.]/g,'-')}.${extension}`);
      status('Export complete. Play the downloaded file and check timing and annotation alignment.');
    }
  } catch(e) { status(`Export failed: ${e.message}`, true); }
  finally {
    cancelAnimationFrame(rafId); document.removeEventListener('visibilitychange', onHidden);
    if (recording?.state === 'recording') recording.stop(); recording = null; exporting = false;
    stream?.getTracks().forEach(t=>t.stop()); musicElement?.pause(); if (audioContext) await audioContext.close(); if (musicURL) URL.revokeObjectURL(musicURL);
    controls.forEach((e,i)=>e.disabled=oldDisabled[i]); $('cancel').hidden = true;
  }
}
$('export').onclick = exportVideo;
draw(0);
