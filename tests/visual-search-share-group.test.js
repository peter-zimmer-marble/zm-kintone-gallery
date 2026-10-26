// Read-only shareable selection basket regression test for Kintone Visual Search.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);
function makeNode(){
  return {innerHTML:'',textContent:'',value:'',checked:false,hidden:true,
    classList:{flags:new Map(),toggle(k,v){this.flags.set(k,v);}},
    querySelector(){return null;},querySelectorAll(){return [];}};
}
const nodes=new Map(),listeners=new Map(),registrations=[];
for(const id of [
  'zmwm-visual-results','zmwm-visual-feedback','zmwm-visual-inventory-scope',
  'zmwm-visual-group-banner','zmwm-visual-basket','zmwm-visual-group-link',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
])nodes.set(id,makeNode());
const ui=makeNode();
ui.addEventListener=(type,fn,capture)=>{
  const items=listeners.get(type)||[];items.push({fn,capture:!!capture});
  listeners.set(type,items);
};
ui.querySelector=selector=>nodes.get(selector.slice(1))||null;
nodes.set('zmwm-visual-root',ui);
const app=makeNode();
app.querySelector=sel=>sel==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',app);
const modal=makeNode(),sub=new Map();
for(const selector of [
  '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
  '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
  '#zmwm-visual-lightbox-inventory','#zmwm-visual-lightbox-details',
  '#zmwm-visual-lightbox-image','#zmwm-visual-lightbox-caption',
  '#zmwm-visual-lightbox-thumbnails','[data-visual-action="download-photo"]',
  '[data-visual-action="previous-photo"]','[data-visual-action="next-photo"]',
  '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
  '.zmwm-visual-lightbox-panel'
])sub.set(selector,makeNode());
sub.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
modal.querySelector=sel=>sub.get(sel)||null;
nodes.set('zmwm-visual-lightbox',modal);
function makeRecord(id,name,type,status,photo){
  const values={
    $id:String(id),color:name,color_combined:name,zmv_num:'',
    type,inventory_status:status,sale_status:'Avl',material:'Quartz',
    rack:'Z-5A',lot_num:'LOT-'+id,job:'Kitchen',in_out_note:'Review sample '+id,
    length:'50',width:'32',shape:'Rectangle',length_2:'',width_2:'',
    exact_picture:photo?[{fileKey:'photo-'+id,name:'photo-'+id+'.jpg',
      contentType:'image/jpeg'}]:[],example_picture:[]
  };
  return Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{value:v}]));
}
const allRecords=[
  ...[1,2,3,4].map(id=>makeRecord(id,'Remnant Option '+id,'STOCK Rem','In',true)),
  ...[5,6,7].map(id=>makeRecord(id,'Slab Option '+id,'Stock Slab','In',true)),
  makeRecord(8,'Historical Slab 8','SO-Slab','Out',true)
];
let denySeven=false;
const calls=[],clipboardValues=[];
async function api(url,method,request){
  assert.equal(method,'GET','No Kintone write requests allowed');
  assert.equal(request.app,6);
  assert.ok(request.fields.includes('inventory_status'));
  assert.ok(!request.fields.includes('cost'));
  calls.push(request);
  const query=String(request.query);
  let result;
  const idMatch=query.match(/\$id in \(([^)]+)\)/);
  if(idMatch) {
    const ids=[...idMatch[1].matchAll(/"([0-9]+)"/g)].map(m=>Number(m[1]));
    assert.equal(ids.length,idMatch[1].split(',').length,'Only safe numeric ids used in query');
    result=allRecords.filter(r=>ids.includes(Number(r.$id.value)) &&
      !(denySeven && r.$id.value==='7'));
  } else {
    const statuses=query.includes('"In","Out"')?['In','Out']:
      query.includes('("Out")')?['Out']:['In'];
    assert.match(query,/inventory_status in \(/);
    result=allRecords.filter(r=>statuses.includes(r.inventory_status.value));
  }
  const after=Number(query.match(/\$id > ([0-9]+)/)?.[1]||0);
  const limit=Number(query.match(/limit ([0-9]+)/)?.[1]||500);
  return {records:result.filter(r=>Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value)).slice(0,limit)};
}
api.url=x=>x;
const location={
  origin:'https://zimmermarble.kintone.com',
  pathname:'/k/6/',search:'?view=4321',hash:''
};
const preferences=new Map();
const env={
  console,
  kintone:{api,events:{on(type,fn){registrations.push(fn);}}},
  window:{
    kintone:{},location,
    history:{replaceState(_x,_y,value){
      assert.equal(value,'/k/6/?view=4321');
      location.hash='';
    }},
    navigator:{clipboard:{writeText(value){
      clipboardValues.push(value);return Promise.resolve();
    }}},
    localStorage:{getItem(k){return preferences.get(k)||null;},
      setItem(k,v){preferences.set(k,v);}}
  },
  document:{
    getElementById(id){return nodes.get(id)||null;},
    querySelector(){return null;},
    addEventListener(){},removeEventListener(){}
  },
  URL:{revokeObjectURL(){},createObjectURL(){return 'blob:stub';}},
  XMLHttpRequest:class {
    open(m){assert.equal(m,'GET');}
    setRequestHeader(){}
    send(){}
    abort(){}
  }
};
vm.runInNewContext(source,env);
assert.equal(registrations.length,1);
const handler=registrations[0];
const event={viewName:'Visual Search',viewType:'custom',viewId:4321};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
const basket=()=>nodes.get('zmwm-visual-basket').innerHTML;
const banner=()=>nodes.get('zmwm-visual-group-banner').innerHTML;
function send(type,target,capture=false){
  const matches=(listeners.get(type)||[]).filter(x=>x.capture===capture);
  assert.ok(matches.length,'Expected '+type+' listener');
  for(const listener of matches)listener.fn({
    target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
  });
}
function action(name,id){
  const button={dataset:{visualAction:name,visualId:id||''}};
  send('click',{closest(sel){
    return sel==='[data-visual-action]'?button:null;
  }});
}
function select(id,checked=true){
  send('change',{dataset:{visualSelectId:String(id)},checked});
}
function search(value){send('input',{id:'zmwm-visual-search',value});}
function setScope(value){
  send('change',{id:'zmwm-visual-inventory-scope',value,dataset:{}});
}
function recordIds(html){
  return [...html.matchAll(/<tr class="zmwm-visual-table-row[^"]*">([\s\S]*?)<\/tr>/g)]
    .map(m=>Number(m[1].match(/class="zmwm-visual-table-id-link"[^>]*>(\d+)<\/a>/)?.[1]));
}
(async()=>{
  handler(event);await tick();
  assert.match(calls[0].query,/inventory_status in \("In"\)/);
  assert.equal(recordIds(html()).length,0,'Default gallery is preserved');
  assert.match(basket(),/0 pieces selected/);

  send('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assert.equal((html().match(/<th scope="col"/g)||[]).length,15);
  assert.match(html(),/class="zmwm-visual-table-select-header"/);
  assert.match(html(),/data-visual-select-id="1"/);
  assert.equal(recordIds(html()).length,7);

  search('Remnant');
  assert.equal(recordIds(html()).length,4);
  for(const id of [1,2,3,4])select(id);
  assert.match(basket(),/4 pieces selected/);
  assert.match(basket(),/Remnant Option 1/);

  search('Slab');
  assert.equal(recordIds(html()).length,3);
  for(const id of [5,6,7])select(id);
  assert.match(basket(),/7 pieces selected/);
  assert.match(basket(),/Remnant Option 1/);
  assert.match(basket(),/Slab Option 7/);
  assert.match(basket(),/view=4321#zmgroup=1.2.3.4.5.6.7/);
  assert.match(basket(),/Recipients must sign in to Kintone/);

  send('input',{id:'zmwm-visual-group-name',
    value:'Kitchen options / Johnson'});
  assert.match(nodes.get('zmwm-visual-group-link').value,
    /&zmname=Kitchen%20options%20%2F%20Johnson$/);
  action('copy-group');
  await tick();
  assert.equal(clipboardValues.length,1);
  assert.match(clipboardValues[0],/https:\/\/zimmermarble.kintone.com\/k\/6\/\?view=4321/);
  assert.match(clipboardValues[0],/#zmgroup=1.2.3.4.5.6.7/);
  assert.match(basket(),/Link copied/);

  // Allow an additional historical Out piece from a separate scope.
  search('');
  setScope('all');await tick();
  assert.equal(recordIds(html()).length,8);
  assert.match(basket(),/7 pieces selected/);
  select(8);
  assert.match(basket(),/8 pieces selected/);
  assert.match(basket(),/Historical Slab 8/);
  action('copy-group');await tick();
  const link=clipboardValues.at(-1);
  assert.match(link,/#zmgroup=1.2.3.4.5.6.7.8/);
  assert.match(link,/&zmname=Kitchen%20options/);

  // The recipient opens the URL in a fresh signed-in Kintone session.
  // The requested records are retrieved by ID, regardless of In/Out status.
  location.hash=link.slice(link.indexOf('#'));
  denySeven=true; // Simulate a record deleted or not readable by recipient.
  handler({viewName:'Gallery A',viewType:'custom'});
  handler(event);
  await tick();
  assert.match(calls.at(-1).query,/\$id in \("1","2","3","4","5","6","7","8"\)/);
  assert.doesNotMatch(calls.at(-1).query,/inventory_status in/);
  assert.deepEqual(recordIds(html()),[8,1,2,3,4,5,6]);
  assert.match(banner(),/Kitchen options \/ Johnson/);
  assert.match(banner(),/1 piece is missing or not accessible/);
  assert.match(basket(),/8 pieces selected/);
  assert.match(basket(),/Record #7 \(unavailable\)/);
  assert.match(html(),/class="zmwm-visual-table-row is-out"/);
  assert.match(html(),/data-visual-photo="photo-8"/);
  assert.equal(ui.classList.flags.get('is-shared-group'),true);

  // The original photo viewer and Kintone record links remain intact.
  const photo={dataset:{visualId:'8'},isConnected:true,focus(){}};
  send('click',{closest:s=>s.startsWith('.zmwm-visual-photo-action')?photo:null},true);
  assert.equal(modal.hidden,false);
  assert.equal(sub.get('#zmwm-visual-lightbox-title').textContent,'Historical Slab 8');
  assert.match(sub.get('#zmwm-visual-lightbox-meta').textContent,/OUT OF INVENTORY/);
  action('close-photo');

  // Link recipients can remove items and generate a modified link.
  action('remove-group','2');
  assert.match(basket(),/7 pieces selected/);
  assert.doesNotMatch(basket(),/#zmgroup=1.2.3.4.5.6.7.8/);
  assert.match(basket(),/#zmgroup=1.3.4.5.6.7.8/);

  action('leave-group');await tick();
  assert.equal(ui.classList.flags.get('is-shared-group'),false);
  assert.equal(location.hash,'');
  assert.match(calls.at(-1).query,/inventory_status in \("In"\)/);
  assert.equal(recordIds(html()).length,7);
  assert.doesNotMatch(banner(),/Shared inventory group/);
  assert.match(basket(),/7 pieces selected/,'Basket survives leaving shared group');

  // Clearing a basket must not remove inventory records.
  action('clear-group');
  assert.match(basket(),/0 pieces selected/);
  assert.equal(recordIds(html()).length,7);

  // Bad URL input must never reach a Kintone query.
  location.hash='#zmgroup=1.2%22bad';
  handler({viewName:'Gallery A',viewType:'custom'});
  handler(event);await tick();
  assert.match(banner(),/invalid or too many record IDs/);
  assert.match(calls.at(-1).query,/inventory_status in \("In"\)/);
  assert.equal(recordIds(html()).length,7);

  for(const token of ['.zmwm-visual-basket','.zmwm-visual-group-chip',
    '.zmwm-visual-table-select-cell','.zmwm-visual-shared-banner'])
    assert.ok(css.includes(token),'Missing group UI styles: '+token);
  console.log('Group sharing: across searches/statuses, copy link, named group, '+
    'exact-ID GET, missing records, photo viewer, return, clear, invalid links passed.');
})().catch(err=>{console.error(err);process.exitCode=1;});