const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../studio/core.js');
const fixture = () => ({version:1,title:'Demo',width:1920,height:1080,fps:30,scenes:[{id:'a',title:'First',duration:4,image:'screens/a.png',source:{width:3840,height:2160},crop:{x:2000,y:100,w:1800,h:1000},zoomTo:{x:2400,y:200,w:1200,h:700},highlights:[{rect:{x:2764,y:322,w:1030,h:40},label:'Title',start:1,end:4}]}]});
test('accepts a real source-pixel rectangle and rejects boxes from the wrong resolution',()=>{
  C.validate(fixture());const p=fixture();p.scenes[0].source={width:1920,height:1080};assert.throws(()=>C.validate(p),/outside the source/);
});
test('maps image pixels and annotation borders through one transform throughout zoom',()=>{
  const s=fixture().scenes[0],vp={x:60,y:160,w:1800,h:790},target=s.highlights[0].rect;
  for (const time of [0,.2,.7,1,3.5]) {
    const cam=C.camera(s,time,vp),r=cam.rect(target);
    assert.equal(r.x,cam.painted.x+(target.x-cam.crop.x)*cam.scale);
    assert.equal(r.y,cam.painted.y+(target.y-cam.crop.y)*cam.scale);
    assert.ok(Math.abs(r.w/r.h-target.w/target.h)<1e-10);
    assert.ok(cam.scale<=1.5);
  }
});
test('known cropped screenshot coordinates land on the expected control borders',()=>{
  const s={source:{width:1600,height:900},crop:{x:400,y:200,w:800,h:400}};
  const cam=C.camera(s,0,{x:60,y:160,w:1800,h:790});
  assert.deepEqual(cam.rect({x:480,y:240,w:80,h:40}),{x:480,y:315,w:120,h:60});
});
test('uses letterboxing and caps enlargement rather than stretching tiny screenshots',()=>{
  const s={source:{width:100,height:100}};const cam=C.camera(s,0,{x:0,y:0,w:1920,h:1080});assert.equal(cam.scale,1.5);assert.equal(cam.painted.w,150);assert.equal(cam.painted.h,150);
});
test('boundary timing selects the next scene and preserves the final frame',()=>{
  const p=fixture();p.scenes.push({...p.scenes[0],id:'b',duration:6});assert.equal(C.sceneAt(p,4).scene.id,'b');assert.equal(C.sceneAt(p,10).local,6);assert.equal(C.duration(p),10);
});
test('rejects remote/traversal assets, duplicate ids and invalid highlight windows',()=>{
  for (const name of ['../secret.png','https://example.com/screen.png','C:\\screen.png','/screen.png']) {const p=fixture();p.scenes[0].image=name;assert.throws(()=>C.validate(p),/relative local/);}
  const p=fixture();p.scenes.push({...p.scenes[0]});assert.throws(()=>C.validate(p),/unique id/);
  const q=fixture();q.scenes[0].highlights[0].end=5;assert.throws(()=>C.validate(q),/timing/);
});
test('clips highlights to the painted image and attaches leaders to borders',()=>{
  assert.deepEqual(C.intersect({x:5,y:5,w:20,h:20},{x:10,y:10,w:20,h:20}),{x:10,y:10,w:15,h:15});
  assert.deepEqual(C.borderPoint({x:100,y:100,w:300,h:40},{x:0,y:300}),{x:100,y:140});
});
test('does not promise MP4 when the browser only encodes WebM',()=>{
  assert.equal(C.chooseMime(t=>t==='video/webm'),'video/webm');assert.equal(C.chooseMime(()=>false),null);assert.equal(C.chooseMime(t=>t==='video/mp4'),'video/mp4');
});
test('prevents simultaneous callout labels from covering one another',()=>{
  const p=fixture();p.scenes[0].highlights.push({...p.scenes[0].highlights[0]});
  assert.throws(()=>C.validate(p),/opposite sides/);
  p.scenes[0].highlights[1].side='right';C.validate(p);
});
