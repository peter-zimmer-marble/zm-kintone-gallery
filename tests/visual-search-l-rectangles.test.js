// Geometry and filter coverage for LHL/RHL max-fitting rectangles in App 6.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);

function node(){
  return {innerHTML:'',textContent:'',value:'',checked:false,hidden:true,
    classList:{toggle(){}},querySelector(){return null;},querySelectorAll(){return [];}};
}
const nodes=new Map(),listeners=new Map(),registrations=[],requests=[];
for(const id of [
  'zmwm-visual-results','zmwm-visual-feedback','zmwm-visual-basket',
  'zmwm-visual-group-banner','zmwm-visual-inventory-scope',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
])nodes.set(id,node());
const ui=node();
ui.addEventListener=(type,handler,capture)=>{
  const all=listeners.get(type)||[];
  all.push({handler,capture:!!capture});
  listeners.set(type,all);
};
ui.querySelector=selector=>nodes.get(selector.slice(1))||null;
nodes.set('zmwm-visual-root',ui);
const app=node();
app.querySelector=selector=>selector==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',app);
const popup=node(),parts=new Map();
for(const selector of [
  '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
  '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
  '#zmwm-visual-lightbox-inventory','#zmwm-visual-lightbox-details',
  '#zmwm-visual-lightbox-staging','#zmwm-visual-lightbox-image',
  '#zmwm-visual-lightbox-caption','#zmwm-visual-lightbox-thumbnails',
  '[data-visual-action="download-photo"]',
  '[data-visual-action="previous-photo"]',
  '[data-visual-action="next-photo"]',
  '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
  '.zmwm-visual-lightbox-panel'
])parts.set(selector,node());
parts.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
popup.querySelector=sel=>parts.get(sel)||null;
nodes.set('zmwm-visual-lightbox',popup);
function piece(id,color,shape,length,width,l2,w2,photo=false){
  const fields={
    $id:String(id),color,color_combined:color,zmv_num:'',
    shape,length:String(length),width:String(width),
    length_2:String(l2),width_2:String(w2),type:'STOCK Rem',
    inventory_status:'In',sale_status:'Avl',rack:'Z-1A',
    material:'Quartz',job:'Kitchen',lot_num:'LOT-'+id,
    in_out_note:'',staging_status:'',
    exact_picture:photo?[{fileKey:'pic-'+id,name:'pic-'+id+'.jpg',
      contentType:'image/jpeg'}]:[],example_picture:[]
  };
  return Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,{value}]));
}
let records=[
  piece(1,'Alpha LHL','Left Hand L',89,16,63,12,true),
  piece(2,'Beta RHL','RHL',89,16,63,12),
  piece(3,'Gamma Straight','Rectangle',90,20,'',''),
  piece(4,'Delta Wide','Rectangle',70,30,'',''),
  piece(5,'Epsilon LHL','LHL',120,20,60,5),
  piece(6,'Zeta Invalid','Left Hand L',89,16,100,12),
  piece(7,'Eta Incomplete','Right Hand L',89,16,'',12),
  piece(8,'Theta Decimal','Right Hand L',90.5,16.125,60.5,11.875)
];
let denyExtraDimensions=false;
async function api(endpoint,method,query){
  if (String(endpoint).includes('/records/acl/evaluate.json'))
    return {rights:[]};
  assert.equal(method,'GET','The rectangle calculator must never update inventory');
  assert.equal(query.app,6);
  requests.push(query);
  if(denyExtraDimensions &&
      (query.fields.includes('length_2')||query.fields.includes('width_2')))
    throw new Error('Extra dimensions restricted by Kintone');
  assert.match(query.query,/inventory_status in \("In"\)/);
  const after=Number(query.query.match(/\$id > (\d+)/)?.[1]||0);
  const limit=Number(query.query.match(/limit (\d+)/)?.[1]||500);
  return {records:records.filter(r=>Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value))
    .slice(0,limit)
    .map(r=>Object.fromEntries(Object.entries(r)
      .filter(([name])=>query.fields.includes(name))))};
}
api.url=x=>x;
const state=new Map();
const env={
 console,
 window:{kintone:{},location:{
    origin:'https://zimmermarble.kintone.com',
    pathname:'/k/6/',search:'?view=4321',hash:''
  },localStorage:{
    getItem(k){return state.get(k)||null;},
    setItem(k,v){state.set(k,v);}
  }},
 kintone:{api,events:{on(_types,fn){registrations.push(fn);}}},
 document:{getElementById(id){return nodes.get(id)||null;},
   addEventListener(){},removeEventListener(){}},
 URL:{createObjectURL(){return 'blob:mock';},revokeObjectURL(){}},
 XMLHttpRequest:class{open(m){assert.equal(m,'GET');}
  setRequestHeader(){}send(){}abort(){}}
};
vm.runInNewContext(source,env);
assert.equal(registrations.length,1);
const handler=registrations[0];
const event={viewName:'Visual Search',viewType:'custom',viewId:4321};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function dispatch(name,target,capture=false){
  const events=(listeners.get(name)||[]).filter(item=>item.capture===capture);
  assert.ok(events.length>0,'No '+name+' event listener');
  for(const item of events)item.handler({
    target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
  });
}
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
const count=()=>Number(html().match(/class="zmwm-visual-count">(\d+)/)?.[1]||0);
const galleryCount=()=>[...html().matchAll(/<article class="zmwm-visual-card/g)].length;
const listIds=()=>[...html().matchAll(/<tr class="zmwm-visual-table-row[^"]*">([\s\S]*?)<\/tr>/g)]
  .map(match=>Number(match[1].match(/class="zmwm-visual-table-id-link"[^>]*>(\d+)<\/a>/)?.[1]));
function size(length,width){
  dispatch('input',{id:'zmwm-visual-min-length',value:length});
  dispatch('input',{id:'zmwm-visual-min-width',value:width});
}
function search(value){dispatch('input',{id:'zmwm-visual-search',value});}
function sort(key){dispatch('click',{closest:selector=>
  selector==='[data-visual-action]'?{dataset:{visualAction:'sort',visualSort:key}}:null});}
async function revisit(){
  handler({viewName:'Gallery A',viewType:'custom'});
  listeners.clear();
  handler(event);
  await tick();
}
(async()=>{
  handler(event);
  await tick();
  assert.equal(count(),8);
  assert.equal(galleryCount(),8);
  assert.equal(requests.length,1);
  assert.match(app.innerHTML,/Size filters check one rectangle that fits both minimums/);

  const full=html();
  assert.match(full,/89 × 16 × 63 × 12 in · LHL/,'Original four measurements remain visible');
  assert.match(full,/89 × 16 × 63 × 12 in · RHL/,'Right-handed dimensions preserved');
  assert.equal((full.match(/LARGEST RECTANGLE · AUTO/g)||[]).length,4,
    'Two 89x16x63x12 shapes, one area-dominant long shape and a decimal shape');
  assert.equal((full.match(/63 × 28 in/g)||[]).length>=2,true,
    'Largest rectangle and its alternative appears for both handed Ls');
  assert.match(full,/LARGEST RECTANGLE · AUTO[\s\S]*?63 × 28 in[\s\S]*?Also fits: 89 × 16 in/);
  assert.match(full,/LARGEST RECTANGLE · AUTO[\s\S]*?120 × 20 in[\s\S]*?Also fits: 60 × 25 in/,
    'Largest is by area even if the other fit is wider');
  assert.match(full,/60\.5 × 28 in/,'Fractional dimensions add without floating artifacts');
  assert.match(full,/Review L measurements: Length 2 exceeds Length/,
    'Impossible secondary length is flagged rather than accepted');
  assert.match(full,/Enter valid Length 2 and Width 2 to calculate/,
    'Missing dimensions are not fabricated');

  // Example from the shop: 63x28 passes, even though primary width is only 16.
  size('60','27');
  assert.equal(count(),4);
  assert.equal(galleryCount(),4);
  assert.match(html(),/Alpha LHL/);
  assert.match(html(),/Beta RHL/);
  assert.match(html(),/Delta Wide/);
  assert.match(html(),/Theta Decimal/);
  assert.doesNotMatch(html(),/Eta Incomplete|Zeta Invalid/);

  // A long threshold and a wide threshold must fit ONE candidate together.
  size('85','27');
  assert.equal(count(),0,'Never combine the 89 length with the 28 width');
  size('60','28');
  assert.equal(count(),4,'The 28-inch width is inclusive');
  size('60','28.01');
  assert.equal(count(),1,'Fractional threshold excludes 28-inch wide Ls');
  assert.match(html(),/Delta Wide/);
  size('100','24');
  assert.equal(count(),0,'Do not combine 120-inch primary with 25-inch widened arm');

  // A valid expanded, narrower option must still pass when primary fails.
  size('55','24');
  assert.equal(count(),5,'Both areas of the L shape are searchable');
  assert.match(html(),/Epsilon LHL/);
  // Incomplete shapes keep their known primary rectangle for conservative matches.
  size('85','15');
  assert.match(html(),/Eta Incomplete/);
  assert.match(html(),/Zeta Invalid/);
  size('','27');
  assert.equal(count(),4,'Minimum width alone searches widened L areas');

  // Text search includes calculated rectangular dimensions (both options).
  size('','');
  search('63x28');
  assert.equal(count(),2);
  search('60.5×28');
  assert.equal(count(),1);
  assert.match(html(),/Theta Decimal/);
  search('');

  // List shows calculated size with alternate fit and supports area sorting.
  dispatch('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assert.equal((html().match(/<th scope="col"/g)||[]).length,17);
  assert.match(html(),/data-visual-sort="maxRect"/);
  assert.match(html(),/Sort by Max Rect area/);
  assert.match(html(),/class="zmwm-visual-table-max-rect-cell"/);
  assert.match(html(),/class="zmwm-visual-table-max-rect">63 × 28 in/);
  assert.match(html(),/Also 89 × 16/);
  assert.match(html(),/Incomplete L dims/);
  sort('maxRect');
  assert.deepEqual(listIds(),[8,1,2,3,4,5,7,6],
    'Sort by feasible max area; incomplete shapes last');
  sort('maxRect');
  assert.deepEqual(listIds(),[5,4,3,1,2,8,7,6],
    'Largest usable area first; incomplete shapes remain last');

  // Existing enlargement uses shared detail markup with the computed result.
  const photo={dataset:{visualId:'1'},isConnected:true,focus(){}};
  dispatch('click',{closest:s=>s.startsWith('.zmwm-visual-photo-action')?photo:null},true);
  assert.equal(popup.hidden,false);
  assert.match(parts.get('#zmwm-visual-lightbox-details').innerHTML,/63 × 28 in/);
  assert.match(parts.get('#zmwm-visual-lightbox-details').innerHTML,/Also fits: 89 × 16 in/);

  // If Kintone denies access to secondary measurements, do not guess or expose
  // a widened rectangle. The original 89x16 part is still filterable.
  denyExtraDimensions=true;
  await revisit();
  assert.match(html(),/Enter valid Length 2 and Width 2 to calculate/);
  assert.doesNotMatch(html(),/LARGEST RECTANGLE · AUTO/);
  size('60','27');
  assert.equal(count(),1,'Only normal rectangle 70x30 fits without L2/W2');
  assert.match(html(),/Delta Wide/);
  size('85','15');
  assert.match(html(),/Alpha LHL/,'Known primary dimensions still filter');
  denyExtraDimensions=false;

  assert.match(css,/\.zmwm-visual-max-rect-value/);
  assert.match(css,/\.zmwm-visual-max-rect-alternate/);
  assert.match(css,/\.zmwm-visual-table-max-rect-cell/);
  assert.match(css,/\.zmwm-visual-rect-filter-hint/);
  assert.equal(requests.some(x=>x.fields.includes('cost')),false);
  console.log('L max rectangle: LHL/RHL, area ranking, alternative fits, two-minimum filter, '+
    'decimal measurements, incomplete/invalid geometry, text search, list sorting, '+
    'photo details and Kintone field permissions passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});