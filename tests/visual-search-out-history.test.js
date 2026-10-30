// Historical Out lookup regression coverage for Inventory App 6 Visual Search.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);

const makeNode=()=>({
  innerHTML:'',textContent:'',value:'',checked:false,hidden:true,scrollLeft:0,
  classList:{flags:new Map(),toggle(name,val){this.flags.set(name,val);}},
  querySelector(){return null;},querySelectorAll(){return [];}
});
const nodes=new Map(),listenerMap=new Map(),events=[];
for(const id of [
  'zmwm-visual-results','zmwm-visual-feedback','zmwm-visual-inventory-scope',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
])nodes.set(id,makeNode());
const ui=makeNode();
ui.addEventListener=(name,callback,capture)=>{
  const list=listenerMap.get(name)||[];
  list.push({callback,capture:!!capture});
  listenerMap.set(name,list);
};
ui.querySelector=selector=>nodes.get(selector.slice(1))||null;
nodes.set('zmwm-visual-root',ui);
const app=makeNode();
app.querySelector=sel=>sel==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',app);
const popup=makeNode(),subs=new Map();
for(const key of [
  '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
  '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
  '#zmwm-visual-lightbox-inventory','#zmwm-visual-lightbox-details',
  '#zmwm-visual-lightbox-image','#zmwm-visual-lightbox-caption',
  '#zmwm-visual-lightbox-thumbnails','[data-visual-action="download-photo"]',
  '[data-visual-action="previous-photo"]','[data-visual-action="next-photo"]',
  '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
  '.zmwm-visual-lightbox-panel'
])subs.set(key,makeNode());
subs.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
popup.querySelector=sel=>subs.get(sel)||null;
nodes.set('zmwm-visual-lightbox',popup);

function piece(id,name,inventoryStatus,sale,material,job,note,pics=[]) {
  const data={
    $id:String(id),color:name,color_combined:name,zmv_num:'',
    inventory_status:inventoryStatus,sale_status:sale,
    type:'Stock Slab',material,rack:'Z-2A',
    length:String(id*10),width:'62',shape:'Rectangle',job,in_out_note:note,
    length_2:'',width_2:'',lot_num:inventoryStatus === 'Out' ? 'HIST-'+id : 'CURRENT-'+id,
    exact_picture:pics.map(key=>({fileKey:key,name:key+'.jpg',contentType:'image/jpeg'})),
    example_picture:[]
  };
  return Object.fromEntries(Object.entries(data).map(([key,value])=>[key,{value}]));
}
const pieces=[
  piece(1,'Arctic','In','Avl','Quartz','New Kitchen','',[]),
  piece(2,'Boreal','Out','SOLD','Marble','Old Bathroom','<legacy>', ['old-a','old-b']),
  piece(3,'Cedar','In','Hold','Granite','Active Job','Check <edge>',['new-c']),
  piece(4,'Delta','Out','Avl','Quartz','Old Kitchen','Historical <photo>',['old-d'])
];
const calls=[];
async function api(endpoint,method,query) {
  if (String(endpoint).includes('/records/acl/evaluate.json')) return {rights:[]};
  assert.equal(method,'GET','Historical photos must be strictly read-only');
  assert.equal(query.app,6);
  calls.push(query);
  assert.ok(query.fields.includes('inventory_status'),'Status must be included in Kintone field allowlist');
  const source=String(query.query);
  assert.ok(source.includes('inventory_status in ('),'Scope must be server-side');
  const both=source.includes('inventory_status in ("In","Out")');
  const onlyOut=source.includes('inventory_status in ("Out")');
  const onlyIn=source.includes('inventory_status in ("In")');
  assert.ok(both||onlyOut||onlyIn,'Unknown Kintone scope');
  const allowed=both?new Set(['In','Out']):onlyOut?new Set(['Out']):new Set(['In']);
  const after=Number(source.match(/\$id > (\d+)/)?.[1]||0);
  const limit=Number(source.match(/limit (\d+)/)?.[1]||500);
  return {records:pieces.filter(r=>allowed.has(r.inventory_status.value) &&
      Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value)).slice(0,limit)};
}
api.url=url=>url;
const prefs=new Map(),registrations=[];
const env={
  console,
  window:{kintone:{},localStorage:{
    getItem(key){return prefs.get(key)||null;},
    setItem(key,value){prefs.set(key,value);}
  }},
  kintone:{api,events:{on(types,fn){registrations.push(fn);}}},
  document:{getElementById(id){return nodes.get(id)||null;},
    addEventListener(){},removeEventListener(){}},
  URL:{createObjectURL(){return 'blob:stub';},revokeObjectURL(){}},
  XMLHttpRequest:class {
    open(method){assert.equal(method,'GET');}
    setRequestHeader(){}
    send(){}
    abort(){}
  }
};
vm.runInNewContext(source,env);
assert.equal(registrations.length,1);
const handler=registrations[0];
const event={viewName:'Visual Search',viewType:'custom'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
const count=()=>Number(html().match(/class="zmwm-visual-count">(\d+)/)?.[1]||0);
function dispatch(name,target,capture=false) {
  const list=(listenerMap.get(name)||[]).filter(item=>item.capture===capture);
  assert.ok(list.length,'Missing '+name+' listener');
  for(const item of list)item.callback({
    target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
  });
}
function selectScope(scope) {
  nodes.get('zmwm-visual-inventory-scope').value=scope;
  dispatch('change',{id:'zmwm-visual-inventory-scope',value:scope,dataset:{}});
}
function click(name,key) {
  const button={dataset:{visualAction:name,visualSort:key}};
  dispatch('click',{closest(selector){
    return selector==='[data-visual-action]'?button:null;
  }});
}
function listIds(){
  return [...html().matchAll(/<tr class="zmwm-visual-table-row[^"]*">([\s\S]*?)<\/tr>/g)]
    .map(match=>Number(match[1].match(/class="zmwm-visual-table-id-link"[^>]*>(\d+)<\/a>/)?.[1]));
}
(async()=>{
  handler(event);
  await tick();
  assert.match(app.innerHTML,/option value="in" selected>In only \(default\)/);
  assert.match(calls[0].query,/inventory_status in \("In"\)/);
  assert.doesNotMatch(calls[0].query,/"Out"/,'No Out fetched by default');
  assert.equal(count(),2,'Default should show In pieces only');
  assert.match(html(),/Arctic/);
  assert.match(html(),/Cedar/);
  assert.doesNotMatch(html(),/Boreal|Delta/);
  assert.match(nodes.get('zmwm-visual-feedback').textContent,/pieces in shop/);

  selectScope('all');
  await tick();
  assert.match(calls.at(-1).query,/inventory_status in \("In","Out"\)/);
  assert.equal(count(),4);
  assert.match(html(),/class="zmwm-visual-card is-sold is-out"/);
  assert.match(html(),/class="zmwm-visual-card is-out"/);
  assert.match(html(),
    /<article class="zmwm-visual-card is-sold is-out"><div class="zmwm-visual-stock-banner is-stock-slab">/,
    'An OUT stock slab retains both its new category header and OUT warning');
  assert.match(html(),/OUT — NOT CURRENTLY IN INVENTORY/);
  assert.match(html(),/class="zmwm-visual-out-overlay">OUT<\/span>/);
  assert.match(html(),/data-visual-photo="old-a"/);
  assert.match(html(),/data-visual-fallback="old-b"/);
  assert.match(html(),/&lt;legacy&gt;/);
  assert.match(nodes.get('zmwm-visual-feedback').textContent,/pieces \(In \+ Out\)/);

  // Sortable list: explicit In/Out column plus warning near color, while
  // existing sale-status display remains separate.
  dispatch('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assert.equal((html().match(/<th scope="col"/g)||[]).length,17);
  assert.match(html(),/data-visual-sort="inventory"/);
  assert.match(html(),/data-visual-sort="lot"/);
  assert.match(html(),/Lot #: HIST-2/);
  assert.match(html(),/OUT OF INVENTORY/);
  assert.match(html(),/class="zmwm-visual-inventory-badge is-out">OUT<\/span>/);
  assert.match(html(),/class="zmwm-visual-inventory-badge is-in">IN<\/span>/);
  assert.match(html(),/class="zmwm-visual-table-row is-sold is-out"/);
  assert.match(html(),/class="zmwm-visual-status sold">SOLD<\/span>/);
  click('sort','inventory');
  assert.deepEqual(listIds(),[1,3,2,4]);
  click('sort','inventory');
  assert.deepEqual(listIds(),[2,4,1,3]);

  // Clicking a historical photo must still open the existing viewer.
  const photo={dataset:{visualId:'2'},focus(){},isConnected:true};
  dispatch('click',{closest:s=>s.startsWith('.zmwm-visual-photo-action')?photo:null},
    true);
  assert.equal(popup.hidden,false);
  assert.equal(subs.get('#zmwm-visual-lightbox-title').textContent,'Boreal');
  assert.match(subs.get('#zmwm-visual-lightbox-meta').textContent,/OUT OF INVENTORY/);
  assert.match(subs.get('#zmwm-visual-lightbox-inventory').innerHTML,/OUT — NOT IN INVENTORY/);
  assert.match(subs.get('#zmwm-visual-lightbox-details').innerHTML,/OUT — NOT CURRENTLY IN INVENTORY/);
  assert.match(subs.get('#zmwm-visual-lightbox-details').innerHTML,/Lot #: HIST-2/);
  assert.equal(subs.get('.zmwm-visual-lightbox-panel').classList.flags.get('is-out'),true);
  click('close-photo');
  assert.equal(popup.hidden,true);

  // Out-only query can be filtered using the existing lot, name and job filters.
  selectScope('out');
  await tick();
  assert.match(calls.at(-1).query,/inventory_status in \("Out"\)/);
  assert.equal(count(),2);
  assert.deepEqual(listIds(),[2,4]);
  dispatch('input',{id:'zmwm-visual-search',value:'hist-2'});
  assert.equal(count(),1,'Out records remain searchable by historical lot');
  assert.deepEqual(listIds(),[2]);
  dispatch('input',{id:'zmwm-visual-search',value:''});
  dispatch('input',{id:'zmwm-visual-search',value:'Old Kitchen'});
  assert.equal(count(),1);
  assert.deepEqual(listIds(),[4]);
  dispatch('input',{id:'zmwm-visual-search',value:''});
  dispatch('change',{id:'zmwm-visual-sale',value:'SOLD',dataset:{}});
  assert.deepEqual(listIds(),[2]);

  // Reset restores the safe default, not the previous historical scope.
  click('reset');
  await tick();
  assert.match(calls.at(-1).query,/inventory_status in \("In"\)/);
  assert.equal(nodes.get('zmwm-visual-inventory-scope').value,'in');
  assert.deepEqual(listIds(),[1,3]);
  assert.doesNotMatch(html(),/OUT OF INVENTORY/);
  assert.equal(prefs.has('zmwm-visual-inventory-scope'),false);

  // Even if user exits while viewing history, next visit starts In only.
  selectScope('out');
  await tick();
  handler({viewName:'Gallery A',viewType:'custom'});
  handler(event);
  await tick();
  assert.match(calls.at(-1).query,/inventory_status in \("In"\)/);
  assert.deepEqual(listIds(),[1,3]);
  for(const banned of ['cost','purchase_price','vendor','sale_base_price'])
    assert.ok(!calls[0].fields.includes(banned),'Fetched restricted field '+banned);
  for(const name of ['.zmwm-visual-out-notice','.zmwm-visual-card.is-out',
    '.zmwm-visual-table-row.is-out','.zmwm-visual-lightbox-panel.is-out'])
    assert.ok(css.includes(name),'Missing conspicuous Out style '+name);
  console.log('Historical Out lookup: default In, all/out queries, sorting, filters, '+
    'photo popup, warning parity, reset and read-only access passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
