/** Optional adapter: Node + separately installed Playwright. No MCP required. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planFile = process.argv[2];
if (!planFile) throw new Error('Usage: npm run capture -- capture/plan.example.json');
const plan = JSON.parse(await fs.readFile(planFile,'utf8'));
if (!/^https?:\/\//.test(plan.startUrl)) throw new Error('startUrl must be an authorised HTTP(S) application');
if (!Array.isArray(plan.steps) || !plan.steps.length) throw new Error('No capture steps');
const ids = new Set();
for (const step of plan.steps) {
  if (!/^[a-z0-9_-]+$/i.test(step.id)) throw new Error('Step ids must use letters, digits, _ or -');
  if (ids.has(step.id)) throw new Error('Step ids must be unique; existing screenshots are never replaced');
  ids.add(step.id);
  if (step.duration !== undefined && (!Number.isFinite(step.duration) || step.duration < 2 || step.duration > 300)) throw new Error('Capture scene duration must be 2–300 seconds');
  if ((step.targets || []).length > 2) throw new Error('Split more than two targets into separate capture steps');
  for (const action of step.actions || []) if (!['click','fill','waitFor'].includes(action.type) || typeof action.selector !== 'string') throw new Error('Actions must be reviewed click, fill or waitFor selectors');
}
let chromium;
try {({chromium} = await import('playwright'));} catch {throw new Error('Optional capture requires an approved Playwright installation. The browser Studio does not need it.');}
const run = new Date().toISOString().replace(/[:.]/g,'-');
const out = path.join(root,'captures',run);await fs.mkdir(out,{recursive:true});
const profile = path.join(root,'.profiles','capture');
const context = await chromium.launchPersistentContext(profile,{headless:false,viewport:{width:1920,height:1080},deviceScaleFactor:2});
const rl=createInterface({input:stdin,output:stdout});
try {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(plan.startUrl);
  await rl.question('Sign in yourself and review the capture actions. Press Enter only when ready. ');
  const scenes=[];
  for (const step of plan.steps) {
    console.log(`Capturing ${step.id}`);
    for (const action of step.actions || []) {
      const locator=page.locator(action.selector);
      if (action.type==='click') await locator.click();
      if (action.type==='fill') await locator.fill(action.value || '');
      if (action.type==='waitFor') await locator.waitFor({state:'visible'});
    }
    await page.evaluate(()=>document.fonts.ready);
    const targets=[];
    for (const [index,target] of (step.targets || []).entries()) {
      const box=await page.locator(target.selector).boundingBox();
      if (!box) throw new Error(`Missing target ${target.selector}`);
      // Screenshots explicitly use scale:css. DOM coordinates are provisional;
      // review visible borders and correct the project file before export.
      targets.push({rect:{x:box.x,y:box.y,w:box.width,h:box.height},label:target.label || '',side:target.side || (index ? 'right' : 'left'),start:1,end:step.duration || 5});
    }
    const file=`${step.id}.png`;
    await page.screenshot({path:path.join(out,file),fullPage:false,scale:'css',animations:'disabled'});
    const size=page.viewportSize();
    scenes.push({id:step.id,title:step.title || step.id,duration:step.duration || 5,image:file,source:size,highlights:targets});
  }
  await fs.writeFile(path.join(out,'project.json'),JSON.stringify({version:1,title:plan.title || 'Walkthrough',width:1920,height:1080,fps:30,footer:'Review screenshots and highlight alignment',scenes},null,2));
  console.log(`Saved local draft to ${out}. Review it in Studio; DOM targets are not automatically verified against pixels.`);
} finally {rl.close();await context.close();}
