// Browser-local, per-Kintone-user saved inventory group regression tests.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);

function makeNode(){
  return {innerHTML:'',textContent:'',value:'',checked:false,hidden:true,
    classList:{flags:new Map(),toggle(k,value){this.flags.set(k,value);}},
    querySelector(){return null;},querySelectorAll(){return [];}};
}
const nodes=new Map(),listeners=new Map(),registered=[],windowHandlers=new Map();
for(const id of [
  'zmwm-visual-results','zmwm-visual-feedback','zmwm-visual-basket',
  'zmwm-visual-group-banner','zmwm-visual-group-link','zmwm-visual-inventory-scope',
  'zmwm-visual-material-options','zmwm-visual-type-options',
  'zmwm-visual-material-summary','zmwm-visual-type-summary',
  'zmwm-visual-material-filter','zmwm-visual-type-filter',
  'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
  'zmwm-visual-min-width','zmwm-visual-photos-only'
])nodes.set(id,makeNode());
const ui=makeNode();
ui.addEventListener=(type,fn,capture)=>{
  const arr=listeners.get(type)||[];arr.push({fn,capture:!!capture});
  listeners.set(type,arr);
};
ui.querySelector=selector=>nodes.get(selector.slice(1))||null;
nodes.set('zmwm-visual-root',ui);
const app=makeNode();
app.querySelector=sel=>sel==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',app);
const popup=makeNode(),subs=new Map();
for(const selector of [
  '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
  '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
  '#zmwm-visual-lightbox-inventory','#zmwm-visual-lightbox-details',
  '#zmwm-visual-lightbox-image','#zmwm-visual-lightbox-caption',
  '#zmwm-visual-lightbox-thumbnails','[data-visual-action="download-photo"]',
  '[data-visual-action="previous-photo"]','[data-visual-action="next-photo"]',
  '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
  '.zmwm-visual-lightbox-panel'
])subs.set(selector,makeNode());
subs.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
popup.querySelector=selector=>subs.get(selector)||null;
nodes.set('zmwm-visual-lightbox',popup);

function record(id,color,type,status){
  const values={
    $id:String(id),color,color_combined:color,zmv_num:'',type,
    inventory_status:status,sale_status:'Avl',material:'Quartz',
    rack:'Z-1A',lot_num:'LOT-'+id,job:'Job #'+id,
    in_out_note:'Fixture note',length:'60',width:'30',shape:'Rectangle',
    length_2:'',width_2:'',exact_picture:[],example_picture:[]
  };
  return Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{value:v}]));
}
const records=[
  record(11,'Calacatta Remnant A','STOCK Rem','In'),
  record(12,'Calacatta Remnant B','STOCK Rem','In'),
  record(21,'Bianco Slab','Stock Slab','In'),
  record(22,'Historic Slab','SO-Slab','Out')
];
const getCalls=[],store=new Map(),clipboard=[],confirmationPrompts=[];
let loginUser='operator-1',storageDisabled=false,confirmNext=true;
async function api(url,method,data){
  assert.equal(method,'GET','Saving/deleting a group cannot write Kintone records');
  assert.equal(data.app,6);
  getCalls.push(data);
  let filtered=records;
  const query=String(data.query);
  const specific=query.match(/\$id in \(([^)]+)\)/);
  if(specific){
    const ids=[...specific[1].matchAll(/"(\d+)"/g)].map(x=>Number(x[1]));
    filtered=filtered.filter(r=>ids.includes(Number(r.$id.value)));
  } else if(query.includes('inventory_status in ("In")'))
    filtered=filtered.filter(r=>r.inventory_status.value==='In');
  else if(query.includes('inventory_status in ("Out")'))
    filtered=filtered.filter(r=>r.inventory_status.value==='Out');
  const after=Number(query.match(/\$id > (\d+)/)?.[1]||0);
  return {records:filtered.filter(r=>Number(r.$id.value)>after)
    .sort((a,b)=>Number(a.$id.value)-Number(b.$id.value))};
}
api.url=x=>x;
const location={
  origin:'https://zimmermarble.kintone.com',pathname:'/k/6/',
  search:'?view=4321',hash:''
};
const context={
  console,
  kintone:{
    api,getLoginUser(){return {code:loginUser};},
    events:{on(names,callback){registered.push(callback);}}
  },
  window:{
    kintone:{},location,
    navigator:{clipboard:{writeText(value){clipboard.push(value);return Promise.resolve();}}},
    confirm(prompt){confirmationPrompts.push(prompt);return confirmNext;},
    localStorage:{
      getItem(key){if(storageDisabled)throw Error('Storage denied');return store.get(key)||null;},
      setItem(key,value){if(storageDisabled)throw Error('Quota denied');store.set(key,value);}
    },
    addEventListener(name,fn){
      const all=windowHandlers.get(name)||[];all.push(fn);
      windowHandlers.set(name,all);
    },
    removeEventListener(name,fn){
      windowHandlers.set(name,(windowHandlers.get(name)||[]).filter(x=>x!==fn));
    },
    history:{replaceState(_a,_b,value){
      assert.equal(value,'/k/6/?view=4321');location.hash='';
    }}
  },
  document:{
    getElementById(id){return nodes.get(id)||null;},
    querySelector(){return null;},
    addEventListener(){},removeEventListener(){}
  },
  URL:{revokeObjectURL(){},createObjectURL(){return 'blob:test';}},
  XMLHttpRequest:class{open(method){assert.equal(method,'GET');}
    setRequestHeader(){}send(){}abort(){}}
};
vm.runInNewContext(source,context);
assert.equal(registered.length,1);
const handler=registered[0];
const event={viewName:'Visual Search',viewType:'custom',viewId:4321};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const basket=()=>nodes.get('zmwm-visual-basket').innerHTML;
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
function dispatch(type,target,capture=false){
  const arr=(listeners.get(type)||[]).filter(x=>x.capture===capture);
  assert.ok(arr.length,'Expected '+type+' handler');
  for(const entry of arr)entry.fn({
    target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
  });
}
function select(id,checked=true){
  dispatch('change',{dataset:{visualSelectId:String(id)},checked});
}
function action(name,id){
  const button={dataset:{visualAction:name,visualSavedId:id||''}};
  dispatch('click',{closest(sel){
    return sel==='[data-visual-action]'?button:null;
  }});
}
function setName(value){dispatch('input',{id:'zmwm-visual-group-name',value});}
function scope(value){
  dispatch('change',{id:'zmwm-visual-inventory-scope',value,dataset:{}});
}
function stored(){
  const key='zmwm-visual-search-saved-groups-v1:'+encodeURIComponent(loginUser);
  return {key,groups:JSON.parse(store.get(key)||'[]')};
}
async function reopen(){
  handler({viewName:'Gallery A',viewType:'custom'});
  handler(event);
  await tick();
}
(async()=>{
  handler(event);await tick();
  assert.match(basket(),/My saved groups/);
  assert.match(basket(),/No saved groups yet/);
  assert.match(basket(),/Stored only in this browser/);
  assert.equal(getCalls.length,1);
  select(11);select(12);
  assert.match(basket(),/Save group/);

  // Saving requires a name. Do not claim success without durable browser write.
  action('save-group');
  assert.match(basket(),/Enter a group name before saving/);
  assert.equal(stored().groups.length,0);

  setName('Kitchen options');
  action('save-group');
  assert.equal(stored().groups.length,1);
  assert.deepEqual(stored().groups[0].pieceIds,['11','12']);
  assert.equal(stored().groups[0].name,'Kitchen options');
  assert.deepEqual(Object.keys(stored().groups[0]).sort(),
    ['createdAt','id','name','pieceIds','updatedAt']);
  assert.match(basket(),/Group saved in this browser/);
  assert.match(basket(),/1 saved/);
  assert.match(basket(),/Kitchen options/);
  assert.match(basket(),/2 pieces · Saved/);
  assert.match(basket(),/data-visual-action="copy-saved-group"/);
  assert.match(basket(),/data-visual-action="delete-saved-group"/);
  assert.match(basket(),/class="zmwm-visual-saved-open"/);
  assert.match(basket(),/#zmgroup=11.12/);
  assert.ok(!store.get(stored().key).includes('Fixture note'),'No record data persisted');

  const original=stored().groups[0];
  action('save-group');
  assert.equal(stored().groups.length,1,'Exact duplicate does not create another group');
  assert.match(basket(),/already saved/);

  // Rename and save a second named group, including historical Out record.
  scope('all');await tick();select(22);
  setName('Kitchen <Options> B');
  action('save-group');
  assert.equal(stored().groups.length,2);
  assert.match(basket(),/Kitchen &lt;Options&gt; B/);
  assert.doesNotMatch(basket(),/<Options>/,'Saved names must be escaped');
  assert.match(basket(),/2 saved/);

  const newGroup=stored().groups.find(x=>x.name==='Kitchen <Options> B');
  const oldGroup=stored().groups.find(x=>x.name==='Kitchen options');
  assert.deepEqual(newGroup.pieceIds,['11','12','22']);
  assert.equal(oldGroup.id,original.id);
  assert.deepEqual(oldGroup.pieceIds,['11','12']);

  // Saved groups are shown after closing/reopening the Kintone custom view.
  await reopen();
  assert.match(basket(),/2 saved/);
  assert.match(basket(),/Kitchen options/);
  assert.match(basket(),/Kitchen &lt;Options&gt; B/);
  assert.match(basket(),/0 pieces selected/);

  // A saved group can be shared or reopened with the existing ID-based URL.
  action('copy-saved-group',newGroup.id);await tick();
  assert.match(clipboard.at(-1),/view=4321#zmgroup=11.12.22/);
  assert.match(clipboard.at(-1),/&zmname=Kitchen%20%3COptions%3E%20B/);
  assert.match(basket(),/Saved group link copied/);
  location.hash=clipboard.at(-1).slice(clipboard.at(-1).indexOf('#'));
  await reopen();
  assert.match(getCalls.at(-1).query,/\$id in \("11","12","22"\)/);
  assert.doesNotMatch(getCalls.at(-1).query,/inventory_status in/);
  assert.match(html(),/class="zmwm-visual-table-row is-out"/);
  assert.match(html(),/data-visual-select-id="22" checked/);
  assert.match(basket(),/3 pieces selected/);
  location.hash='';

  // Same-name resave is explicit replacement with a confirmation and same ID.
  select(21);
  setName('Kitchen options');
  confirmNext=false;
  const priorPrompts=confirmationPrompts.length;
  action('save-group');
  assert.equal(confirmationPrompts.length,priorPrompts+1);
  assert.match(confirmationPrompts.at(-1),/Replace saved group "Kitchen options"/);
  assert.deepEqual(stored().groups.find(x=>x.id===oldGroup.id).pieceIds,['11','12']);
  confirmNext=true;
  action('save-group');
  assert.deepEqual(stored().groups.find(x=>x.id===oldGroup.id).pieceIds,
    ['11','12','22','21']);
  assert.match(basket(),/Saved group updated/);
  assert.equal(stored().groups.length,2);

  // Delete demands confirmation and removes saved entry only, not records.
  confirmNext=false;
  action('delete-saved-group',newGroup.id);
  assert.equal(stored().groups.length,2);
  confirmNext=true;
  action('delete-saved-group',newGroup.id);
  assert.equal(stored().groups.length,1);
  assert.match(basket(),/deleted from your saved groups/);
  assert.doesNotMatch(basket(),/Kitchen &lt;Options&gt; B/);
  assert.match(basket(),/Previously shared links continue to work/);
  assert.match(basket(),/4 pieces selected/,'Basket selection unaffected by deletion');

  // An already-shared link is still a set of record IDs, not tied to storage.
  location.hash='#zmgroup=11.12.22&zmname=Old%20shared%20link';
  await reopen();
  assert.match(getCalls.at(-1).query,/\$id in \("11","12","22"\)/);
  assert.match(basket(),/3 pieces selected/);
  assert.match(basket(),/1 saved/);
  location.hash='';

  // Saved group keys are separated for different Kintone accounts.
  loginUser='operator-2';
  await reopen();
  assert.equal(stored().groups.length,0);
  assert.match(basket(),/No saved groups yet/);
  assert.doesNotMatch(basket(),/Kitchen options/);
  loginUser='operator-1';
  await reopen();
  assert.match(basket(),/Kitchen options/);
  assert.match(basket(),/1 saved/);

  // Cross-tab change is reflected without reloading inventory.
  const key=stored().key;
  const storedGroup=stored().groups[0];
  store.set(key,JSON.stringify([{
    ...storedGroup,name:'Renamed from another tab'
  }]));
  for(const handler of windowHandlers.get('storage')||[])
    handler({key});
  assert.match(basket(),/Renamed from another tab/);
  assert.doesNotMatch(basket(),/>Kitchen options</);
  assert.match(basket(),/1 saved/);

  // Fail closed on damaged local storage and do not overwrite it.
  store.set(key,'THIS IS NOT JSON');
  await reopen();
  assert.match(basket(),/Saved groups could not be read/);
  select(11);setName('Should Not Replace');
  action('save-group');
  assert.equal(store.get(key),'THIS IS NOT JSON');

  // A browser with storage blocked must never falsely say "Group saved".
  loginUser='operator-3';storageDisabled=true;
  await reopen();
  assert.match(basket(),/Saved groups could not be read/);
  select(11);setName('Cannot Store');
  action('save-group');
  assert.doesNotMatch(basket(),/Group saved in this browser/);
  assert.match(basket(),/could not be read/);
  storageDisabled=false;

  for(const cssClass of ['.zmwm-visual-saved-groups',
    '.zmwm-visual-saved-list','.zmwm-visual-saved-delete'])
    assert.ok(css.includes(cssClass),'Missing saved group style '+cssClass);
  assert.ok(getCalls.every(x=>x.app===6),'No other app APIs used');
  console.log('Saved Groups: name validation, per-user browser storage, reopen, '+
    'sharing, Out items, replace/confirm, delete/confirm, old links, external tabs, '+
    'HTML escaping, and failed storage passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});