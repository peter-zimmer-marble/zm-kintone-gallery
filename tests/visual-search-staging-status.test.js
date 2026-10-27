// Permission-gated staging_status editor regression for Inventory App 6.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(source);
function node(){
 return {innerHTML:'',textContent:'',value:'',checked:false,hidden:true,
   classList:{flags:new Map(),toggle(name,value){this.flags.set(name,value);}},
   querySelector(){return null;},querySelectorAll(){return [];}};
}
const nodes=new Map(),listeners=new Map(),events=[];
for(const id of [
 'zmwm-visual-results','zmwm-visual-feedback','zmwm-visual-basket',
 'zmwm-visual-group-banner','zmwm-visual-inventory-scope',
 'zmwm-visual-material-options','zmwm-visual-type-options',
 'zmwm-visual-material-summary','zmwm-visual-type-summary',
 'zmwm-visual-material-filter','zmwm-visual-type-filter',
 'zmwm-visual-search','zmwm-visual-sale','zmwm-visual-min-length',
 'zmwm-visual-min-width','zmwm-visual-photos-only',
 'zmwm-visual-lightbox-staging'
])nodes.set(id,node());
const hosts=new Map();
function hostFor(id){
 if(!hosts.has(id)){
   const parts=new Map();
   for(const part of ['value','actions','feedback'])parts.set(part,node());
   hosts.set(id,{dataset:{visualStagingRecord:id},
     classList:{flags:new Map(),toggle(key,on){this.flags.set(key,on);}},
     parts,querySelector(selector){
       if(selector==='[data-visual-stage-value]')return parts.get('value');
       if(selector==='[data-visual-stage-actions]')return parts.get('actions');
       if(selector==='[data-visual-stage-feedback]')return parts.get('feedback');
       return null;
     }});
 }
 return hosts.get(id);
}
const ui=node();
ui.addEventListener=(event,cb,capture)=>{
 const list=listeners.get(event)||[];list.push({cb,capture:!!capture});
 listeners.set(event,list);
};
ui.querySelector=selector=>nodes.get(selector.slice(1))||null;
ui.querySelectorAll=selector=>{
 if(selector!=='[data-visual-staging-record]')return [];
 const html=nodes.get('zmwm-visual-results').innerHTML;
 const ids=[...html.matchAll(/data-visual-staging-record="([0-9]+)"/g)]
   .map(m=>m[1]);
 return [...new Set(ids)].map(hostFor);
};
nodes.set('zmwm-visual-root',ui);
const app=node();
app.querySelector=selector=>selector==='#zmwm-visual-root'?ui:null;
nodes.set('zm-visual-search-root',app);
const popup=node(),sub=new Map();
for(const selector of [
 '#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
 '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
 '#zmwm-visual-lightbox-inventory','#zmwm-visual-lightbox-details',
 '#zmwm-visual-lightbox-staging','#zmwm-visual-lightbox-image',
 '#zmwm-visual-lightbox-caption','#zmwm-visual-lightbox-thumbnails',
 '[data-visual-action="download-photo"]','[data-visual-action="previous-photo"]',
 '[data-visual-action="next-photo"]',
 '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
 '.zmwm-visual-lightbox-panel'
])sub.set(selector,node());
sub.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
popup.querySelector=selector=>sub.get(selector)||null;
nodes.set('zmwm-visual-lightbox',popup);
function piece(id,name,status){
 const record={
   $id:String(id),$revision:'1',color:name,color_combined:name,zmv_num:'',
   type:'STOCK Rem',material:'Quartz',inventory_status:'In',
   sale_status:'Avl',rack:'Z-1A',lot_num:'LOT-'+id,
   length:'50',width:'32',shape:'Rectangle',
   staging_status:status,job:'Test Kitchen',
   in_out_note:'Do not change',length_2:'',width_2:'',
   exact_picture:[],example_picture:[]
 };
 return Object.fromEntries(Object.entries(record).map(([k,v])=>[k,{value:v}]));
}
let records=[
 piece(1,'Read Only Remnant','RTS'),
 piece(2,'Editable Remnant','RTS'),
 piece(3,'Record Not Editable','View Staging'),
 piece(4,'No Staging Set',''),
 piece(5,'Additional Option','Ready for Shop')
];
const calls=[],writes=[],aclCalls=[];
const canEdit=new Set(['2','3','4']);
let canViewStage=true, formFailure=false, forcePutError=false;
let formCalls=0;
function cloneRecord(record,fields){
 return Object.fromEntries(Object.entries(record)
   .filter(([k])=>!fields || fields.includes(k))
   .map(([k,v])=>[k,{...v}]));
}
async function api(url,method,request){
 const path=String(url);
 assert.equal(request.app,6);
 if(path.includes('/records/acl/evaluate.json')){
   assert.equal(method,'GET');
   assert.ok(request.ids.length<=100,'Kintone ACL batch max 100');
   aclCalls.push(request);
   return {rights:request.ids.map(value=>{
     const id=String(value);
     return {id,record:{viewable:true,editable:id!=='3'},
       fields:{staging_status:{
         viewable:canViewStage,
         editable:canEdit.has(id)
       }}};
   })};
 }
 if(path.includes('/app/form/fields.json')){
   assert.equal(method,'GET');
   formCalls++;
   if(formFailure)throw Error('Form options not accessible');
   return {properties:{staging_status:{
     type:'DROP_DOWN',required:false,
     options:{RTS:{label:'RTS',index:'0'},
       'View Staging':{label:'View Staging',index:'1'},
       'Ready for Shop':{label:'Ready for Shop',index:'2'}}
   }}};
 }
 if(path.includes('/record.json') && method==='PUT'){
   assert.equal(request.id,'2','Only explicitly authorized row may be written');
   assert.deepEqual(Object.keys(request.record),['staging_status'],
     'Never update unrelated fields');
   assert.equal(request.revision,
     records.find(r=>r.$id.value===request.id).$revision.value);
   if(forcePutError)throw Error('Revision conflict: another user changed this record');
   const found=records.find(r=>r.$id.value===request.id);
   found.staging_status.value=request.record.staging_status.value;
   found.$revision.value='2';
   writes.push(request);
   return {revision:'2'};
 }
 assert.equal(method,'GET','No implicit inventory writes');
 assert.ok(path.includes('/records.json'),'Only records GET allowed');
 calls.push(request);
 const specific=request.query.match(/\$id = "([0-9]+)"/);
 const stageDenied=request.fields.includes('staging_status') && !canViewStage;
 if(stageDenied)throw Error('Staging field not viewable');
 const allowed=records.filter(r=>specific ? r.$id.value===specific[1] : true);
 return {records:allowed.map(r=>cloneRecord(r,request.fields))};
}
api.url=x=>x;
const location={origin:'https://zimmermarble.kintone.com',pathname:'/k/6/',
 search:'?view=4321',hash:''},stored=new Map();
const env={
 console,
 window:{kintone:{},location,localStorage:{
   getItem(k){return stored.get(k)||null;},
   setItem(k,v){stored.set(k,v);}
 }},
 kintone:{api,getLoginUser(){return {code:'admin-test'};},
   events:{on(_types,handler){events.push(handler);}}},
 document:{getElementById(id){return nodes.get(id)||null;},
   addEventListener(){},removeEventListener(){}},
 URL:{revokeObjectURL(){},createObjectURL(){return 'blob:test';}},
 XMLHttpRequest:class{open(m){assert.equal(m,'GET');}
   setRequestHeader(){}send(){}abort(){}}
};
vm.runInNewContext(source,env);
assert.equal(events.length,1);
const handler=events[0],event={viewName:'Visual Search',viewType:'custom',viewId:4321};
const tick=()=>new Promise(r=>setImmediate(r));
const flush=async()=>{await tick();await tick();await tick();};
function send(type,target,capture=false){
 const callbacks=(listeners.get(type)||[]).filter(x=>x.capture===capture);
 assert.ok(callbacks.length,'Missing '+type+' handler');
 for(const item of callbacks)item.cb({
   target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}
 });
}
function action(name,id){
 const target={dataset:{visualAction:name,visualStageId:String(id)}};
 send('click',{closest:sel=>sel==='[data-visual-action]'?target:null});
}
const html=()=>nodes.get('zmwm-visual-results').innerHTML;
const controls=id=>hostFor(String(id)).parts.get('actions').innerHTML;
const badge=id=>hostFor(String(id)).parts.get('value').innerHTML;
const clickable=id=>hostFor(String(id)).parts.get('value').classList.flags.get('is-clickable');
const stageClass=(id,name)=>hostFor(String(id)).classList.flags.get(name);
const feedback=id=>hostFor(String(id)).parts.get('feedback').textContent;
async function reopen(){
 handler({viewName:'Gallery A',viewType:'custom'});
 listeners.clear();hosts.clear();
 handler(event);await flush();
}
(async()=>{
  handler(event);await flush();
  assert.match(calls[0].query,/inventory_status in \("In"\)/);
  assert.ok(calls[0].fields.includes('staging_status'));
  assert.ok(aclCalls.length>0,'Must check current signed-in user with Kintone ACL API');
  assert.match(html(),/STAGING/);
  assert.match(html(),/RTS/);
  assert.match(html(),/Not staged/);
  // Colors are determined by the existing staging field, never sale status.
  assert.match(html(),/class="zmwm-visual-staging is-rts" data-visual-staging-record="1"/);
  assert.match(html(),/class="zmwm-visual-staging is-rts" data-visual-staging-record="2"/);
  assert.match(html(),/class="zmwm-visual-staging is-view-staging" data-visual-staging-record="3"/);
  assert.match(html(),/class="zmwm-visual-staging is-unset" data-visual-staging-record="4"/);
  assert.match(html(),/class="zmwm-visual-staging is-other" data-visual-staging-record="5"/);
  assert.match(html(),/<\/a><div class="zmwm-visual-staging is-rts"/,
    'Gallery staging widget must be outside the record link');
  assert.match(badge(2),/<select class="zmwm-visual-stage-pill-select"/);
  assert.match(badge(2),/data-visual-stage-choice="2"/);
  assert.match(badge(4),/data-visual-stage-choice="4"/);
  assert.match(badge(2),/value="RTS" selected>RTS<\/option>/);
  assert.match(badge(2),/Ready for Shop/,'Form choices are inside the pill');
  assert.equal(clickable(2),true);
  assert.equal(clickable(4),true);
  assert.equal(controls(2),'','No secondary dropdown or actions before change');
  assert.equal(controls(4),'','No secondary dropdown or actions before change');
  assert.equal(controls(1),'','Read-only field exposes no editor');
  assert.equal(controls(3),'','Non-editable record exposes no editor');
  assert.doesNotMatch(badge(1),/<select/,
    'Read-only status must be non-clickable');
  assert.doesNotMatch(badge(3),/<select/,
    'Non-editable record status must be non-clickable');
  assert.equal(clickable(1),false);
  assert.equal(clickable(3),false);
  assert.doesNotMatch(source,/data-visual-action="edit-staging"/,
    'No intermediate edit button may remain');
  assert.doesNotMatch(source,/class="zmwm-visual-stage-change"/,
    'Old Change button must be removed');
  assert.equal(formCalls,1,'Form settings loaded only after ACL edit permission');
  assert.equal(writes.length,0);

  // The existing list view has a separately sortable staging column.
  send('change',{id:'zmwm-visual-list-view',checked:true,dataset:{}});
  assert.equal((html().match(/<th scope="col"/g)||[]).length,16);
  assert.match(html(),/data-visual-sort="staging"/);
  assert.match(html(),/class="zmwm-visual-table-stage"/);
  assert.match(html(),/data-visual-staging-record="3"/);
  assert.match(html(),/class="zmwm-visual-staging is-view-staging"/,
    'List layout uses the same blue staging badge');

  // Forged changes and Save on a read-only record must not write anything.
  send('change',{dataset:{visualStageChoice:'1'},value:'View Staging'});
  action('save-staging',1);
  assert.equal(writes.length,0);
  assert.equal(controls(1),'');
  assert.doesNotMatch(badge(1),/<select/);

  // The badge IS the native dropdown. Only an actual selection change reveals
  // Save and Cancel; selection by itself cannot write to inventory.
  send('change',{dataset:{visualStageChoice:'2'},value:'View Staging'});
  assert.match(badge(2),/data-visual-stage-choice="2"/);
  assert.match(badge(2),/value="View Staging" selected/);
  assert.match(controls(2),/Unsaved/);
  assert.match(controls(2),/data-visual-action="save-staging"/);
  assert.match(controls(2),/data-visual-action="cancel-staging"/);
  assert.doesNotMatch(controls(2),/<select/,
    'No second dropdown must appear beside the status pill');
  assert.equal(stageClass(2,'is-view-staging'),true);
  assert.equal(stageClass(2,'is-pending'),true);
  assert.equal(writes.length,0);
  action('cancel-staging',2);
  assert.equal(controls(2),'','Cancel returns to the original pill');
  assert.match(badge(2),/value="RTS" selected/);
  assert.equal(stageClass(2,'is-rts'),true);
  assert.equal(stageClass(2,'is-pending'),false);
  assert.equal(writes.length,0);
  send('change',{dataset:{visualStageChoice:'2'},value:'RTS'});
  assert.equal(controls(2),'','Selecting current status requires no Save');
  assert.equal(writes.length,0);

  // Explicit Save re-evaluates ACL then reads a fresh revision and updates
  // exactly the staging_status field. No inventory notes or photos are sent.
  send('change',{dataset:{visualStageChoice:'2'},value:'View Staging'});
  assert.equal(writes.length,0,'Selection must not autosave');
  action('save-staging',2);await flush();
  assert.equal(writes.length,1);
  assert.equal(writes[0].record.staging_status.value,'View Staging');
  assert.equal(records[1].staging_status.value,'View Staging');
  assert.equal(records[1].in_out_note.value,'Do not change');
  assert.match(html(),/Saved: View Staging/);
  assert.match(html(),/class="zmwm-visual-staging is-view-staging" data-visual-staging-record="2"/,
    'The saved value must immediately switch from amber to blue');
  assert.ok(aclCalls.length>=2,'Rights checked again immediately before saving');
  assert.ok(calls.at(-1).fields.includes('$revision'));
  assert.match(html(),/View Staging/);

  // Concurrent revision conflict after the final read must fail cleanly.
  forcePutError=true;
  send('change',{dataset:{visualStageChoice:'2'},value:'RTS'});
  action('save-staging',2);await flush();
  assert.equal(writes.length,1,'Failed PUT must not be reported as saved');
  assert.equal(records[1].staging_status.value,'View Staging');
  assert.match(html(),/Revision conflict/);
  forcePutError=false;

  // Cancel and unchanged selections never issue writes.
  send('change',{dataset:{visualStageChoice:'4'},value:'RTS'});
  action('cancel-staging',4);
  assert.equal(writes.length,1);

  // A revoked permission before Save must prevent PUT and hide editor.
  canEdit.delete('4');
  send('change',{dataset:{visualStageChoice:'4'},value:'RTS'});
  action('save-staging',4);await flush();
  assert.equal(writes.length,1);
  assert.doesNotMatch(html(),/data-visual-stage-id="4"/,
    'Revoked permission must remove control after DOM re-render');
  assert.match(html(),/no longer permits editing/);

  // Load an editor with a staging value that changed after list fetch.
  canEdit.add('4');
  await reopen();
  send('change',{dataset:{visualStageChoice:'4'},value:'RTS'});
  records[3].staging_status.value='View Staging';
  action('save-staging',4);await flush();
  assert.equal(writes.length,1,'Do not overwrite newer staging value');
  assert.match(html(),/changed since this page loaded/);

  // Field denied entirely: list still loads, but no staging field or ACL editor.
  canViewStage=false;
  const before=aclCalls.length;
  await reopen();
  assert.equal(aclCalls.length,before,'No ACL probes when field cannot be read');
  assert.doesNotMatch(html(),/data-visual-staging-record/);
  assert.equal(writes.length,1);
  canViewStage=true;

  // Form choices inaccessible: rights do not imply it is safe to guess options.
  formFailure=true;
  await reopen();
  assert.equal(controls(2),'');
  assert.doesNotMatch(badge(2),/<select/,
    'Cannot edit when form choices are not readable');
  assert.equal(writes.length,1);
  formFailure=false;
  assert.ok(css.includes('.zmwm-visual-table-stage'));
  assert.ok(css.includes('.zmwm-visual-stage-editor'));
  for (const tone of ['is-rts','is-view-staging','is-unset','is-other']) {
    assert.match(css,new RegExp('\\.zmwm-visual-staging\\.'+tone+'\\s*\\{'),
      'Each staging tone needs a dedicated CSS palette: '+tone);
  }
  assert.match(css,/\.zmwm-visual-table-stage \.zmwm-visual-staging/,
    'List must retain color styling');
  assert.match(css,/#zmwm-visual-lightbox-staging \.zmwm-visual-staging/,
    'Enlarged photo must retain color styling');
  assert.match(css,/\.zmwm-visual-card\.is-out > \.zmwm-visual-staging/,
    'Out inventory retains its warning while status is colored');
  assert.match(css,/\.zmwm-visual-stage-pill-button/,
    'The colored status pill must be styled as the button');
  assert.match(css,/\.zmwm-visual-stage-pill-button:focus-visible/,
    'The button must support keyboard focus');
  assert.doesNotMatch(css,/\.zmwm-visual-stage-change/,
    'The old Change button styling must be removed');
  console.log('Staging status: display, record/field ACL, gallery/list, '+
    'dynamic choices, guarded single-field revisioned PUT, revoked rights, '+
    'stale values, denied fields and failed metadata passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});