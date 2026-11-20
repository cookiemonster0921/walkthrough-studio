/* Shared pure geometry/validation. Classic browser script + CommonJS for tests. */
(function (root) {
  'use strict';
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  function rect(r, name) {
    if (!r || !['x', 'y', 'w', 'h'].every(k => finite(r[k])) || r.w <= 0 || r.h <= 0) throw new Error(`${name}: expected a positive {x,y,w,h} rectangle`);
  }
  function contained(r, size, name) {
    rect(r, name);
    if (r.x < 0 || r.y < 0 || r.x + r.w > size.width || r.y + r.h > size.height) throw new Error(`${name}: rectangle is outside the source image`);
  }
  function safePath(p) {
    return typeof p === 'string' && p.length > 0 && !p.includes('\\') && !/^(?:[a-z]+:|[\\/])/i.test(p) && !p.split('/').includes('..');
  }
  function validate(project) {
    if (!project || project.version !== 1) throw new Error('Expected project version 1');
    if (typeof project.title !== 'string' || !project.title.trim()) throw new Error('Project title is required');
    if (!Number.isInteger(project.width) || !Number.isInteger(project.height) || project.width < 320 || project.height < 180 || project.width > 3840 || project.height > 2160) throw new Error('Output size must be 320–3840 × 180–2160');
    if (![24, 25, 30, 60].includes(project.fps)) throw new Error('fps must be 24, 25, 30 or 60');
    if (!Array.isArray(project.scenes) || !project.scenes.length) throw new Error('At least one scene is required');
    const ids = new Set();
    for (const [i, s] of project.scenes.entries()) {
      const n = `Scene ${i + 1}`;
      if (typeof s.id !== 'string' || !s.id || ids.has(s.id)) throw new Error(`${n}: unique id required`);
      ids.add(s.id);
      if (typeof s.title !== 'string') throw new Error(`${n}: title must be text`);
      if (!finite(s.duration) || s.duration < 1 || s.duration > 300) throw new Error(`${n}: duration must be 1–300 seconds`);
      if (!safePath(s.image)) throw new Error(`${n}: use a relative local image path`);
      if (!s.source || !Number.isInteger(s.source.width) || !Number.isInteger(s.source.height) || s.source.width < 1 || s.source.height < 1) throw new Error(`${n}: source width and height are required`);
      if (s.crop) contained(s.crop, s.source, `${n} crop`);
      if (s.zoomTo) contained(s.zoomTo, s.source, `${n} zoomTo`);
      if (s.zoomSeconds !== undefined && (!finite(s.zoomSeconds) || s.zoomSeconds <= 0 || s.zoomSeconds > s.duration)) throw new Error(`${n}: zoomSeconds must fit the scene`);
      if (s.highlights !== undefined && !Array.isArray(s.highlights)) throw new Error(`${n}: highlights must be an array`);
      if ((s.highlights || []).length > 2) throw new Error(`${n}: split more than two highlights into separate scenes`);
      for (const [j, h] of (s.highlights || []).entries()) {
        contained(h.rect, s.source, `${n} highlight ${j + 1}`);
        if (typeof h.label !== 'string') throw new Error(`${n}: highlight label must be text`);
        if (h.side !== undefined && !['left','right'].includes(h.side)) throw new Error(`${n}: label side must be left or right`);
        const start = h.start ?? 0, end = h.end ?? s.duration;
        if (!finite(start) || !finite(end) || start < 0 || end <= start || end > s.duration) throw new Error(`${n}: highlight timing is outside the scene`);
      }
      const hs=s.highlights || [];
      for (let a=0;a<hs.length;a++) for (let b=a+1;b<hs.length;b++) {
        const overlap=(hs[a].start ?? 0)<(hs[b].end ?? s.duration) && (hs[b].start ?? 0)<(hs[a].end ?? s.duration);
        if (overlap && (hs[a].side || 'left')===(hs[b].side || 'left')) throw new Error(`${n}: simultaneous labels must use opposite sides`);
      }
    }
    return project;
  }
  const duration = p => p.scenes.reduce((sum, s) => sum + s.duration, 0);
  function sceneAt(p, seconds) {
    const clamped = Math.max(0, Math.min(seconds, duration(p)));
    let start = 0;
    for (let index = 0; index < p.scenes.length; index++) {
      const scene = p.scenes[index];
      if (clamped < start + scene.duration || index === p.scenes.length - 1) return {scene, index, local: clamped - start, start};
      start += scene.duration;
    }
  }
  const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  function camera(scene, seconds, viewport, maxScale = 1.5) {
    const full = {x: 0, y: 0, w: scene.source.width, h: scene.source.height};
    const from = scene.crop || full, to = scene.zoomTo || from;
    const t = ease(seconds / (scene.zoomSeconds || 1));
    const crop = Object.fromEntries(['x', 'y', 'w', 'h'].map(k => [k, from[k] + (to[k] - from[k]) * t]));
    const scale = Math.min(viewport.w / crop.w, viewport.h / crop.h, maxScale);
    const painted = {x: viewport.x + (viewport.w - crop.w * scale) / 2, y: viewport.y + (viewport.h - crop.h * scale) / 2, w: crop.w * scale, h: crop.h * scale};
    const point = (x, y) => ({x: painted.x + (x - crop.x) * scale, y: painted.y + (y - crop.y) * scale});
    return {crop, scale, painted, point, rect(r) { const p = point(r.x, r.y); return {...p, w: r.w * scale, h: r.h * scale}; }};
  }
  function intersect(a, b) {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y), right = Math.min(a.x + a.w, b.x + b.w), bottom = Math.min(a.y + a.h, b.y + b.h);
    return right > x && bottom > y ? {x, y, w: right - x, h: bottom - y} : null;
  }
  function borderPoint(box, point) {
    let x = Math.max(box.x, Math.min(box.x + box.w, point.x)), y = Math.max(box.y, Math.min(box.y + box.h, point.y));
    if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) {
      const edges = [[x - box.x, 'left'], [box.x + box.w - x, 'right'], [y - box.y, 'top'], [box.y + box.h - y, 'bottom']].sort((a,b) => a[0]-b[0]);
      if (edges[0][1] === 'left') x = box.x;
      if (edges[0][1] === 'right') x = box.x + box.w;
      if (edges[0][1] === 'top') y = box.y;
      if (edges[0][1] === 'bottom') y = box.y + box.h;
    }
    return {x, y};
  }
  function chooseMime(supports) {
    return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(supports) || null;
  }
  const api = {validate, safePath, duration, sceneAt, ease, camera, intersect, borderPoint, chooseMime};
  root.WalkthroughCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
