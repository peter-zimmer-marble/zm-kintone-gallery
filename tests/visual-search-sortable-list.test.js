// Regression tests for the Kintone App 6 Visual Search sortable table.
// No dependencies, network, browser automation, or inventory write operations.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('zm-visual-search-v2.js','utf8');
const css = fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);
function el() {
  return {innerHTML:'',textContent:'',value:'',hidden:true,checked:false,
    classList:{toggle(){}},querySelectorAll(){return [];},querySelector(){return null;}};
}
const nodes = new Map(), listeners = new Map(), registrations=[];
for(const id of [
  'zmwm-visual-results','zmwm-visual-feedback',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
]) nodes.set(id,el());
const ui = el();
ui.addEventListener = (name,cb,capture) => {
  const all = listeners.get(name)||[];
  all.push({cb,capture:!!capture});
  listeners.set(name,all);
};
ui.querySelector = selector => nodes.get(selector.slice(1))||null;
nodes.set('zmwm-visual-root',ui);
const root = el();
root.querySelector = s => s==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',root);
const modal=el(),subs=new Map();
for(const key of [
  '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
  '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-details',
  '#zmwm-visual-lightbox-status','#zmwm-visual-lightbox-image',
  '#zmwm-visual-lightbox-caption','#zmwm-visual-lightbox-thumbnails',
  '[data-visual-action="download-photo"]','[data-visual-action="previous-photo"]',
  '[data-visual-action="next-photo"]',
  '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
  '.zmwm-visual-lightbox-panel'
]) subs.set(key,el());
subs.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
modal.querySelector=q=>subs.get(q)||null;
nodes.set('zmwm-visual-lightbox',modal);
function piece(id,color,length,width,rack,material,type,sale,job,note,shape,photos,extras={}) {
  const data = {
    $id:String(id),color_combined:color,color,zmv_num:'',
    length,width,rack,material,type,sale_status:sale,job,in_out_note:note,shape,
    length_2:extras.length_2||'',width_2:extras.width_2||'',lot_num:'',
    exact_picture:photos.map((key,i)=>({fileKey:key,name:key+'.jpg',contentType:'image/jpeg'})),
    example_picture:[]
  };
  return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{value:v}]));
}
let records=[
  piece(13,'Charlie',31,8,'Z-10A','Granite','STOCK Rem','Hold','Jones Vanity',
    'Requires support','Rectangle',['photo-c']),
  piece(2,'Bravo',120,80,'Z-2B','Quartz','Stock Slab','SOLD','A & B',
    '<script>alert(1)</script>','Left Hand L',['photo-b1','photo-b2'],
    {length_2:'45',width_2:'14'}),
  piece(9,'Echo','',11,'Z-9A','Marble','Stan-Rem','Avl','','','Rectangle',[]),
  piece(7,'Alpha',9,9,'Z-4A','Quartz','SO-Slab','Avl','Davis Bar',
    'Fragile edge','Rectangle',[]),
  piece(5,'Delta',13,60,'Z-1A','Quartz','Cosigned Slab','Hold','Davis Bath',
    'Use the back entrance','Right Hand L',[])
];
// Lot values cover natural numeric order, ties and missing values.
for(const [id,lot] of [[13,'LOT-10'],[2,'LOT-2'],[7,'LOT-1'],[5,'LOT-2']]) {
  const record=records.find(r=>Number(r.$id.value)===id);
  record.lot_num.value=lot;
}
const calls=[];let getCount=0;
async function api(url,method,query) {
  if (String(url).includes('/records/acl/evaluate.json')) return {rights:[]};
  assert.equal(method,'GET','The inventory view must remain read-only');
  assert.equal(query.app,6);
  assert.match(query.query,/inventory_status in \("In"\)/);
  calls.push(query);
  const after=Number(query.query.match(/\$id > (\d+)/)?.[1]||0);
  const limit=Number(query.query.match(/limit (\d+)/)?.[1]||500);
  return {records:records.filter(r=>Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value)).slice(0,limit)};
}
api.url=x=>x;
const preferences = new Map();
const sandbox={
  console,
  window:{kintone:{},localStorage:{
    getItem(k){return preferences.get(k)||null;},
    setItem(k,v){preferences.set(k,v);}
  }},
  kintone:{events:{on(types,cb){registrations.push(cb);}},api},
  URL:{revokeObjectURL(){}},XMLHttpRequest:class {
    open(method){assert.equal(method,'GET');}
    setRequestHeader(){}
    send(){}
    abort(){}
  },
  document:{getElementById(id){return nodes.get(id)||null;},
    addEventListener(){},removeEventListener(){}}
};
vm.runInNewContext(source,sandbox);
assert.equal(registrations.length,1);
const handler=registrations[0];
const event={viewName:'Visual Search',viewType:'custom',type:'app.record.index.show'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function send(name,target,capture=false) {
  const handlers=(listeners.get(name)||[]).filter(item=>item.capture===capture);
  assert.ok(handlers.length>0, 'Handler for '+name);
  for(const h of handlers)h.cb({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
}
function action(name,key) {
  const target={dataset:{visualAction:name,visualSort:key}};
  send('click',{closest(selector){
    return selector==='[data-visual-action]'?target:null;
  }});
}
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
const rowIds=()=>[...html().matchAll(/<tr class="zmwm-visual-table-row[^"]*">([\s\S]*?)<\/tr>/g)]
  .map(m=>Number(m[1].match(/class="zmwm-visual-table-id-link"[^>]*>(\d+)<\/a>/)?.[1]));
function assertOrder(ids,msg) { assert.deepEqual(rowIds(),ids,msg); }
(async()=>{
  handler(event);await tick();
  assert.equal(calls.length,1);
  assert.match(html(),/class="zmwm-visual-grid"/,'Default gallery remains unchanged');
  assert.equal((html().match(/<article class="zmwm-visual-card/g)||[]).length,5);

  // Checkbox turns existing card list into a semantic, horizontally scrollable table.
  send('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assert.match(html(),/class="zmwm-visual-table-scroll"/);
  assert.match(html(),/<table class="zmwm-visual-table">/);
  assert.equal((html().match(/<th scope="col"/g)||[]).length,17);
  assert.match(html(),/aria-sort="ascending"/);
  assertOrder([7,2,13,5,9],'Default list sort: Color ascending');
  for(const heading of ['Photos','Color','In / Out','Piece Type','Material','Rack','Lot #','Length (in)',
    'Width (in)','Shape / Extra','Status','Job','In / Out Notes','Record #'])
    assert.ok(html().includes('Sort by '+heading),'Sortable header: '+heading);
  assert.match(html(),/data-visual-id="2" data-visual-photo="photo-b1"/);
  assert.match(html(),/class="zmwm-visual-photo-count-short">2 photos/);
  assert.match(html(),/data-visual-fallback="photo-b2"/);
  assert.match(html(),/href="\/k\/6\/show#record=2"/);
  assert.match(html(),/L2: 45 in · W2: 14 in/);
  assert.match(html(),/SOLD TO \/ JOB/);
  assert.match(html(),/ON HOLD FOR \/ JOB/);
  assert.match(html(),/IN \/ OUT NOTES/);
  assert.match(html(),/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html(),/<script>alert\(1\)<\/script>/);
  assert.match(html(),/A &amp; B/);
  assert.match(html(),/type-stock-slab/);
  assert.match(html(),/type-standard-rem/);
  assert.match(html(),/class="zmwm-visual-lot">Lot #: LOT-2<\/span>/);
  assert.match(html(),/class="zmwm-visual-status sold">SOLD<\/span>/);
  assert.match(html(),/class="zmwm-visual-status hold">ON HOLD<\/span>/);

  // Numeric lengths, both directions; empty measurements stay at the end.
  action('sort','length');
  assertOrder([7,5,13,2,9],'Numeric length ascending, not lexical');
  assert.match(html(),/data-visual-sort="length"[^>]* aria-label="Sort by Length \(in\), descending"/);
  action('sort','length');
  assertOrder([2,13,5,7,9],'Numeric length descending with missing last');
  action('sort','width');
  assertOrder([13,7,9,5,2],'Width ascending');
  action('sort','id');
  assertOrder([2,5,7,9,13],'Record # numeric');
  action('sort','rack');
  assertOrder([5,2,7,9,13],'Natural rack sorting Z-2 before Z-10');
  action('sort','lot');
  assertOrder([7,2,5,13,9],'Lot numbers sorted naturally; blanks last');
  action('sort','lot');
  assertOrder([13,2,5,7,9],'Lot descending with blanks last');
  action('sort','photo');
  assertOrder([7,5,9,13,2],'Photo count ascending; stable ties');
  action('sort','photo');
  assertOrder([2,13,7,5,9],'Photo count descending, stable ties by color');
  action('sort','status');
  assertOrder([7,9,13,5,2],'Statuses: Available, Hold, Sold');
  action('sort','notes');
  assert.equal(rowIds().at(-1),9,'Empty notes last');
  action('sort','job');
  assert.equal(rowIds().at(-1),9,'Empty jobs last');

  // Search by lot works with the same search field as color, job or rack.
  send('input',{id:'zmwm-visual-search',value:'lot-10'});
  assertOrder([13],'Lot number is searchable');
  send('input',{id:'zmwm-visual-search',value:''});
  assert.equal(rowIds().length,5);
  // Filter and sort work together and still preserve gallery/list preference.
  send('change',{dataset:{visualFilter:'material'},checked:true,value:'Quartz'});
  assert.deepEqual(rowIds().sort((a,b)=>a-b),[2,5,7]);
  send('change',{id:'zmwm-visual-photos-only',dataset:{},checked:true});
  assertOrder([2],'Filters apply before sorting');
  send('change',{id:'zmwm-visual-photos-only',dataset:{},checked:false});
  action('reset');
  assert.equal(rowIds().length,5);
  send('change',{id:'zmwm-visual-list-view',checked:false,dataset:{}});
  assert.match(html(),/class="zmwm-visual-grid"/);
  assert.doesNotMatch(html(),/<table class="zmwm-visual-table">/);
  send('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assertOrder([2,7,5,13,9],'Sort selection is retained after switching modes');
  assert.equal(preferences.get('zmwm-visual-search-list-view'),'true');

  // Enlarged viewer is still activated by the separate photo button.
  const photo={dataset:{visualId:'2'},isConnected:true,focus(){}};
  send('click',{closest:s=>s.startsWith('.zmwm-visual-photo-action')?photo:null},
    true);
  assert.equal(modal.hidden,false);
  assert.equal(subs.get('#zmwm-visual-lightbox-title').textContent,'Bravo');
  assert.match(subs.get('#zmwm-visual-lightbox-details').innerHTML,
    /Lot #: LOT-2/);
  assert.match(subs.get('#zmwm-visual-lightbox-details').innerHTML,
    /LHL/);

  // Only layout preference persists; sorting resets to Color on a fresh visit.
  handler({viewName:'Gallery A',viewType:'custom'});
  handler(event);await tick();
  assert.match(html(),/<table class="zmwm-visual-table">/);
  assertOrder([7,2,13,5,9],'Color ascending after reopening view');

  // Sorting the entire result set before pagination (not only visible rows).
  records=Array.from({length:36},(_,i)=>piece(i+1,'Piece '+(i+1),
    i+1,60,'Z-2A','Quartz','Stock Slab','Avl','','','Rectangle',[]));
  handler(event);await tick();
  action('sort','length');
  action('sort','length');
  assert.equal(rowIds().length,32,'Only the first page is initially shown');
  assert.equal(rowIds()[0],36,'Sort includes pieces beyond first page');
  assert.equal(rowIds().at(-1),5);
  action('more');
  assert.equal(rowIds().length,36);
  assert.equal(rowIds().at(-1),1);
  assert.equal(calls.at(-1).fields.includes('cost'),false);
  assert.match(css,/\.zmwm-visual-table-scroll/);
  assert.match(css,/\.zmwm-visual-table-sort/);
  console.log('Sortable list view: 14 columns, lot searching/sorting, numeric and text sorting, statuses, photos, '+
    'escaping, filters, pagination, preference, modal and gallery parity passed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
