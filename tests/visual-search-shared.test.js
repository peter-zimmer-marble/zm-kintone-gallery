// Dependency-free regression tests for legacy Visual Search in Warehouse Map - TEST.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('gallery-a-v0.5.js','utf8');
new vm.Script(source, {filename:'gallery-a-v0.5.js'});

const nodes = new Map();
function makeNode() {
  return {innerHTML:'',textContent:'',value:'',checked:false,hidden:false,
    classList:{toggle(){}},querySelectorAll(){return [];}};
}
for (const id of [
  'zmwm-visual-results','zmwm-visual-feedback',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
]) nodes.set(id,makeNode());
const listeners = {};
const ui = {
  addEventListener(name,callback) { (listeners[name] ||= []).push(callback); },
  querySelector(selector) { return nodes.get(selector.slice(1)) || null; },
  querySelectorAll() { return []; }
};
nodes.set('zmwm-visual-root',ui);
const customView = {
  innerHTML:'',
  querySelector(selector) {return selector === '#zmwm-visual-root' ? ui : null;}
};
nodes.set('zm-warehouse-map-root',customView);
const registered=[];
const requests=[];
let records=[];
let restrictedNote=false;
let restrictedMaterial=false;
let restrictedDimensions=false;

function record(id,color,material,type,job,sale,note) {
  const input = {
    $id:String(id),color,color_combined:color,zmv_num:'',material,type,job,
    sale_status:sale,in_out_note:note,rack:'Z-5A',length:'120',width:'60',
    shape:'Rectangle',length_2:'',width_2:'',exact_picture:[],example_picture:[]
  };
  return Object.fromEntries(Object.entries(input).map(([key,value])=>[key,{value}]));
}
const fixture=[
  record(11,'Arctic Frost','Quartz','Stock Slab','Davis Basement Bar','Avl',
    'Keep upright & protect <edges>.'),
  record(12,'Marble Falls','Quartz','SO-Slab','Herman Kitchen','SOLD',
    'Reserved for <installer>.'),
  record(13,'Black Pearl','Granite','STOCK Rem','Jones Vanity','Hold',''),
  record(14,'White Veil','Marble','Stan-Rem','Davis Guest Bath','Avl',
    '<img src=x onerror=evil()>'),
  record(15,'Blue River','Granite','Cosigned Slab','A&B','Avl','')
];
records=fixture;
async function api(url,method,data) {
  assert.equal(method,'GET','Visual Search must never write Kintone records');
  assert.equal(data.app,6);
  requests.push(data);
  assert.match(data.query,/inventory_status in \("In"\)/);
  if (restrictedNote && data.fields.includes('in_out_note'))
    throw new Error('Notes field restricted');
  if (restrictedMaterial && data.fields.includes('material'))
    throw new Error('Material field restricted');
  if (restrictedDimensions && data.fields.includes('length_2'))
    throw new Error('Dimensions restricted');
  const after=Number(data.query.match(/\$id > (\d+)/)?.[1] || 0);
  const limit=Number(data.query.match(/limit (\d+)/)?.[1] || 500);
  return {records:records.filter(r=>Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value)).slice(0,limit)};
}
api.url = path => path;
const env={
  console,kintone:{events:{on(types,cb){registered.push({types,cb});}},api},
  window:{kintone:{}},
  document:{
    addEventListener(){},removeEventListener(){},
    getElementById(id){return nodes.get(id)||null;}
  },
  URL:{revokeObjectURL(){}},
  XMLHttpRequest:function UnexpectedPhotoRequest(){throw Error('No fixture photos');}
};
vm.runInNewContext(source,env,{filename:'gallery-a-v0.5.js'});
assert.equal(registered.length,1);
const handler=registered[0].cb;
assert.deepEqual(Array.from(registered[0].types),
  ['app.record.index.show','mobile.app.record.index.show']);
const other={viewName:'Unrelated List',viewType:'list'};
assert.equal(handler(other),other);
assert.equal(requests.length,0,'Visual Search must not run on unrelated views');

function dispatch(name,target) {
  const handlers=listeners[name]||[];
  assert.ok(handlers.length,'Expected '+name+' handler');
  handlers.forEach(h=>h({target}));
}
const resultHTML=()=>nodes.get('zmwm-visual-results').innerHTML;
const count=()=>Number(resultHTML().match(/class="zmwm-visual-count">(\d+)/)?.[1]||0);
const awaitRender=()=>new Promise(resolve=>setImmediate(resolve));
const shownCards=()=>((resultHTML().match(/<article class="zmwm-visual-card/g)||[]).length);
const event={viewName:'Visual Search',viewType:'custom',type:'app.record.index.show'};

(async()=>{
  assert.equal(handler(event),event);
  await awaitRender();
  assert.equal(requests.length,1,'All permitted fields should load in one request');
  const fields=requests[0].fields;
  for(const needed of ['job','type','material','in_out_note','sale_status',
    'exact_picture','example_picture']) {
    assert.ok(fields.includes(needed),'Missing requested field '+needed);
  }
  for(const privateField of ['cost','purchase_price','purchase_notes',
    'vendor','po_num','sale_base_price']) {
    assert.ok(!fields.includes(privateField),'Unexpected private field '+privateField);
  }
  assert.match(resultHTML(),/Keep upright &amp; protect &lt;edges&gt;\./);
  assert.match(resultHTML(),/&lt;img src=x onerror=evil\(\)&gt;/);
  assert.ok(!resultHTML().includes('<img src=x onerror=evil()>'),
    'Inventory notes must not inject HTML');
  assert.match(resultHTML(),/class="zmwm-visual-card is-sold"/);
  assert.match(resultHTML(),/class="zmwm-visual-card is-hold"/);
  assert.match(resultHTML(),/>SOLD<\/span>/);
  assert.match(resultHTML(),/>ON HOLD<\/span>/);
  assert.match(resultHTML(),/SOLD TO \/ JOB/);
  assert.match(resultHTML(),/ON HOLD FOR \/ JOB/);
  assert.match(resultHTML(),/class="zmwm-visual-piece-type(?: type-stock-slab)?"\>Stock Slab/);
  assert.match(resultHTML(),/class="zmwm-visual-material">Quartz/);
  assert.match(resultHTML(),
    /class="zmwm-visual-material">Quartz<\/span><span class="zmwm-visual-rack">Rack: Z-5A<\/span>/);
  for (const cls of ['type-stock-slab','type-so-slab','type-consigned-slab','type-stock-rem','type-standard-rem'])
    assert.ok(resultHTML().includes('zmwm-visual-piece-type ' + cls), 'Missing colored type ' + cls);
  assert.equal(count(),5);
  assert.equal(shownCards(),5);
  assert.match(nodes.get('zmwm-visual-material-options').innerHTML,/Quartz/);
  for(const type of ['STOCK Rem','Stan-Rem','Cosigned Slab','Stock Slab','SO-Slab'])
    assert.ok(nodes.get('zmwm-visual-type-options').innerHTML.includes(type),
      'Full Kintone piece type should appear: '+type);

  // Search must find names from Kintone's Job field, even without color overlap.
  dispatch('input',{id:'zmwm-visual-search',value:'Herman kitchen'});
  assert.equal(count(),1);
  assert.match(resultHTML(),/Marble Falls/);
  dispatch('input',{id:'zmwm-visual-search',value:''});
  assert.equal(count(),5);

  // OR within the same multi-filter, AND across material and piece type.
  dispatch('change',{dataset:{visualFilter:'material'},checked:true,value:'Quartz'});
  assert.equal(count(),2);
  dispatch('change',{dataset:{visualFilter:'material'},checked:true,value:'Granite'});
  assert.equal(count(),4);
  dispatch('change',{dataset:{visualFilter:'type'},checked:true,value:'Stock Slab'});
  assert.equal(count(),1);
  dispatch('change',{dataset:{visualFilter:'type'},checked:true,value:'SO-Slab'});
  assert.equal(count(),2);
  assert.equal(nodes.get('zmwm-visual-material-summary').textContent,'2 selected');
  assert.equal(nodes.get('zmwm-visual-type-summary').textContent,'2 selected');
  dispatch('change',{dataset:{visualFilter:'material'},checked:false,value:'Quartz'});
  assert.equal(count(),0,'Unchecking one material must not clear another');
  // Reset retains no stale multi-select checkbox values.
  const reset={dataset:{visualAction:'reset'}};
  dispatch('click',{closest(selector){return selector==='[data-visual-action]'?reset:null;}});
  assert.equal(count(),5);
  assert.equal(nodes.get('zmwm-visual-material-summary').textContent,'All materials');
  assert.equal(nodes.get('zmwm-visual-type-summary').textContent,'All piece types');
  assert.ok(!nodes.get('zmwm-visual-material-options').innerHTML.includes(' checked'));

  // Field-level permissions: a restricted note must not hide inventory or
  // suppress the independently readable material choices.
  restrictedNote=true;
  const beforeNotes=requests.length;
  handler(event);
  await awaitRender();
  assert.ok(requests.length-beforeNotes >= 4,'Optional-field fallback should probe access');
  assert.equal(count(),5);
  assert.doesNotMatch(resultHTML(),/IN \/ OUT NOTES/);
  assert.match(nodes.get('zmwm-visual-feedback').textContent,/In\/Out Notes unavailable/);
  assert.match(nodes.get('zmwm-visual-material-options').innerHTML,/Quartz/);
  assert.ok(!requests[requests.length-1].fields.includes('in_out_note'));
  restrictedNote=false;

  restrictedMaterial=true;
  handler(event);
  await awaitRender();
  assert.equal(count(),5);
  assert.match(nodes.get('zmwm-visual-material-options').innerHTML,/Material field unavailable/);
  assert.match(nodes.get('zmwm-visual-feedback').textContent,/Material filter unavailable/);
  assert.match(resultHTML(),/IN \/ OUT NOTES/);
  assert.ok(!requests[requests.length-1].fields.includes('material'));
  restrictedMaterial=false;

  // Keyset pagination must still cover over 500 inventory pieces.
  records=Array.from({length:501},(_,i)=>
    record(i+1,'Piece '+(i+1),'Quartz','Stock Slab','Job '+(i+1),'Avl',''));
  const beforePagination=requests.length;
  handler(event);
  await awaitRender();
  assert.equal(requests.length-beforePagination,2);
  assert.equal(count(),501);
  assert.equal(shownCards(),32,'Keep current Show More pagination behavior');
  assert.match(resultHTML(),/Show more pieces/);
  assert.equal(handler(other),other,'Leaving Visual Search must keep other views working');

  console.log('Warehouse Map Visual Search: search, multiselect OR/AND, status, notes escaping, ' +
    'permissions fallbacks, pagination, view isolation and read-only fields passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
