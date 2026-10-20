// Dependency-free mock contract tests. NO real Kintone reads or writes.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('zm-warehouse-in-v1.js','utf8');
new vm.Script(js,{filename:'zm-warehouse-in-v1.js'});
const preview=fs.readFileSync('zm-warehouse-in-preview-config-v1.js','utf8');
new vm.Script(preview);
const defaults={window:{}};
vm.runInNewContext(preview,defaults);
assert.deepEqual(Object.keys(defaults.window.ZM_WAREHOUSE_IN_CONFIG),
  ['enabled','submissionsEnabled']);
assert.equal(defaults.window.ZM_WAREHOUSE_IN_CONFIG.enabled,true);
assert.equal(defaults.window.ZM_WAREHOUSE_IN_CONFIG.submissionsEnabled,false);
assert.equal(Object.isFrozen(defaults.window.ZM_WAREHOUSE_IN_CONFIG),true);

const options = (...labels)=>Object.fromEntries(labels.map((label,i)=>[
  'opt'+i,{label}
]));
const SOURCES = ['New Remnant','New Slab','Unused Piece',
  'Field Return','Customer Drop-off','Other / Unknown'];
const props={};
for(const code of ['color','thickness','finish','old_job','new_job',
  'shape','length','width','material','rack']) {
  props[code]={type:'SINGLE_LINE_TEXT',required:false};
}
props.color.lookup={relatedApp:{app:5},relatedKeyField:'color_name'};
props.rack.lookup={relatedApp:{app:7},relatedKeyField:'rack'};
props.inventory_status={type:'RADIO_BUTTON',required:true,
  options:options('In','Out')};
props.thickness={type:'RADIO_BUTTON',required:true,defaultValue:'3cm',
  options:options('3cm','2cm','12mm','Other','Unknown')};
props.material={type:'DROP_DOWN',required:false,
  options:options('Quartz','Granite','Quartzite','Dolomite')};
props.finish={type:'DROP_DOWN',required:false,
  options:options('Polished','Honed','Brushed')};
props.shape={type:'DROP_DOWN',required:false,
  options:options('Rectangle','Left Hand L','Right Hand L')};
props.length={type:'NUMBER',required:false};
props.width={type:'NUMBER',required:false};
props.master_record_id={type:'NUMBER',required:false};
props.warehouse_request_id={type:'SINGLE_LINE_TEXT',unique:true};
props.exact_picture={type:'FILE'};
props.warehouse_label_status={type:'DROP_DOWN',
  options:options('Present','Missing')};
props.warehouse_label_note={type:'MULTI_LINE_TEXT'};
props.inventory_verified={type:'DROP_DOWN',required:false,
  defaultValue:'No',options:options('No','Yes')};
props.warehouse_disposition={type:'DROP_DOWN',required:false,
  defaultValue:'Active',options:options('Active','Voided')};
props.peter_notification={type:'USER_SELECT',required:false,
  defaultValue:[{type:'USER',code:'peter-owner'}]};
props.warehouse_event_type={type:'DROP_DOWN',
  options:options('IN','PUTAWAY')};
props.warehouse_in_source={type:'DROP_DOWN',options:options(...SOURCES)};
props.type={type:'DROP_DOWN',required:false,
  options:options('Stock Slab','STOCK Rem','SO-Slab','Cosigned Slab','Stan-Rem')};
props.warehouse_putaway_plan={type:'DROP_DOWN',
  options:options('Put Away Later','Put Away Now')};
props.warehouse_identification_status={type:'DROP_DOWN',
  options:options('Needs Review','Identified')};
props.warehouse_observed_color={type:'SINGLE_LINE_TEXT',required:false};
props.warehouse_parent_reference={type:'SINGLE_LINE_TEXT',required:false};
props.warehouse_in_description={type:'MULTI_LINE_TEXT',required:false};

function masterFixture(extra={}){
  const values={
    '$id':'8765',color:'Blue Dunes',color_combined:'Blue Dunes V99',
    zmv_num:'V99',material:'Quartz',thickness:'3cm',finish:'Polished',
    shape:'Rectangle',length:'120',width:'60',job:'Test Job',
    rack:'Z-5A',inventory_status:'In',type:'Stock Slab',...extra
  };
  return Object.fromEntries(Object.entries(values).map(([key,value])=>
    [key,{value}]));
}
let currentMaster=masterFixture();
const records=[];
const apiCalls=[];
const fileUploads=[];
let nextId=6101;
let postMode='success';
let rackMode='normal';
let readingEnabled=true;
const racks=['Remnant Cart','Pending Putaway','Z-5A','Robot-3A'];
async function api(path,method,data){
  apiCalls.push({path,method,data});
  if(!readingEnabled&&method==='GET')throw new Error('Permission denied');
  if(path.endsWith('app/form/fields.json')){
    assert.equal(data.app,15);
    return {properties:props};
  }
  if(method==='GET'&&data.app===6){
    assert.ok(!data.fields.includes('purchase_price'));
    assert.ok(!data.fields.includes('vendor'));
    return {records:[currentMaster]};
  }
  if(method==='GET'&&data.app===7){
    const rackMatch=data.query.match(/rack = "([^"]+)"/);
    const rack=rackMatch&&rackMatch[1];
    return {records:rackMode==='normal'&&racks.includes(rack)?
      [{'rack':{value:rack},'$id':{value:'777'}}]:[]};
  }
  if(method==='GET'&&data.app===15){
    assert.match(data.query,/warehouse_request_id = /);
    const request=data.query.match(/warehouse_request_id = "([^"]+)"/);
    return {records:records.filter(x=>
      x.warehouse_request_id.value===request[1])};
  }
  if(method==='POST'&&data.app===15){
    assert.equal(data.record.inventory_status.value,'In');
    assert.equal(data.record.warehouse_event_type.value,'IN');
    assert.ok(Array.isArray(data.record.exact_picture.value));
    for(const code of ['inventory_verified','warehouse_disposition',
      'peter_notification','parent_slab_id','ZMID','current_placement',
      'move_complete']){
      assert.ok(!(code in data.record),'No crew POST to owner field '+code);
    }
    if(postMode==='reject')throw new Error('Network timeout');
    const id=String(nextId++);
    records.push({...data.record,'$id':{value:id},
      inventory_verified:{value:props.inventory_verified.defaultValue},
      warehouse_disposition:{value:props.warehouse_disposition.defaultValue},
      peter_notification:{value:props.peter_notification.defaultValue}});
    if(postMode==='ambiguous')throw new Error('Lost POST response');
    return {id};
  }
  throw new Error('Unexpected Kintone API call '+method+' '+path);
}
api.url=x=>x;
class FormDataMock{
  constructor(){this.items=[];}
  append(...args){this.items.push(args);}
}
async function fakeFetch(path,opt){
  assert.equal(path,'/k/v1/file.json');
  assert.equal(opt.method,'POST');
  assert.equal(opt.credentials,'same-origin');
  assert.equal(opt.headers['X-Requested-With'],'XMLHttpRequest');
  const token=opt.body.items.find(x=>x[0]==='__REQUEST_TOKEN__');
  assert.equal(token[1],'csrf-okay');
  const file=opt.body.items.find(x=>x[0]==='file');
  assert.ok(file[1].size>0&&file[1].size<=500000);
  assert.match(file[2],/ - IN - (Full Piece|Label|Alternative ID|Additional \d+)\.[a-z0-9]+$/);
  fileUploads.push({name:file[2],size:file[1].size});
  return {ok:true,status:200,async json(){
    return {fileKey:'upload-'+fileUploads.length};
  }};
}
const handlers=[];
const kintone={
  api,
  events:{on(names,cb){handlers.push({names,cb});}},
  getRequestToken(){return 'csrf-okay';}
};
const env={
  window:{kintone,ZM_WAREHOUSE_IN_CONFIG:{
    enabled:true,submissionsEnabled:true
  },crypto:{randomUUID(){return 'uuid-movement-IN-1';}}},
  kintone,
  fetch:fakeFetch,
  FormData:FormDataMock,
  document:{getElementById(){return null;}}
};
vm.runInNewContext(js,env);
const tool=env.window.ZM_WAREHOUSE_IN_V1;
assert.ok(tool);
assert.equal(handlers.length,1);
assert.deepEqual(Array.from(handlers[0].names),
  ['app.record.index.show','mobile.app.record.index.show']);

const unmatched={
  requestId:'IN-unmatched-1',source:'Other / Unknown',
  type:'',putawayPlan:'Put Away Later',
  masterId:'',masterColor:'',parentMasterId:'',parentColor:'',
  observedColor:'Mysterious gray with red mark',
  parentReference:'',oldJob:'',newJob:'',length:'',width:'',
  thickness:'',material:'',finish:'',shape:'',
  missingLabel:false,labelReason:'',description:'Customer did not know the type.'
};
function smallPhoto(name){
  return {name,type:'image/jpeg',size:220000,lastModified:42};
}
const full=smallPhoto('full.jpg');
const label=smallPhoto('label.jpg');
const extra=smallPhoto('extra.jpg');

(async()=>{
  const schema=tool.validateSchema(props);
  assert.ok(schema.properties);
  // Truly unidentified pieces can be recorded with only source, photos
  // and a known temporary rack. Never fake color, dimensions or jobs.
  const unknown=tool.buildEntry(unmatched,['first','second'],schema);
  assert.equal(unknown.inventory_status.value,'In');
  assert.equal(unknown.warehouse_event_type.value,'IN');
  assert.equal(unknown.warehouse_in_source.value,'Other / Unknown');
  assert.equal(unknown.warehouse_putaway_plan.value,'Put Away Later');
  assert.equal(unknown.warehouse_identification_status.value,'Needs Review');
  assert.equal(unknown.warehouse_observed_color.value,
    'Mysterious gray with red mark');
  assert.equal(unknown.rack.value,'Pending Putaway');
  assert.ok(!('color' in unknown),'Unknown color must not fake App 5 lookup.');
  assert.equal(unknown.thickness.value,'Unknown',
    'IN must never silently inherit the radio default 3cm for an unknown piece');
  assert.equal(props.thickness.defaultValue,'3cm',
    'Keep 3cm for ordinary manual App 15 records');
  for(const code of ['master_record_id','finish','material',
    'shape','length','width','old_job','new_job']){
    assert.ok(!(code in unknown),'Unknown '+code+' should stay blank.');
  }
  const remnant=tool.buildEntry({...unmatched,
    source:'New Remnant',type:'STOCK Rem',
    parentReference:'Parent Slab 12222'
  },['first','second'],schema);
  assert.equal(remnant.rack.value,'Remnant Cart');
  assert.equal(remnant.warehouse_parent_reference.value,'Parent Slab 12222');
  const newSlab=tool.buildEntry({...unmatched,
    source:'New Slab',type:'Stock Slab'
  },['first','second'],schema);
  assert.equal(newSlab.warehouse_in_source.value,'New Slab');
  assert.equal(newSlab.rack.value,'Pending Putaway');
  const fieldReturn=tool.buildEntry({...unmatched,
    source:'Field Return',type:'Stan-Rem'
  },['first','second'],schema);
  assert.equal(fieldReturn.rack.value,'Remnant Cart',
    'Field Return may be a remnant, determined by its piece type');
  const unused=tool.buildEntry({...unmatched,
    source:'Unused Piece',type:''
  },['first','second'],schema);
  assert.equal(unused.rack.value,'Pending Putaway');
  assert.throws(()=>tool.buildEntry({...unmatched,
    source:'New Remnant',type:'Stock Slab'
  },['first','second'],schema),/New Remnant Type must be/);
  assert.throws(()=>tool.buildEntry({...unmatched,
    source:'New Slab',type:'Stan-Rem'
  },['first','second'],schema),/New Slab must use a slab Type/);
  assert.ok(!('parent_slab_id' in remnant));
  assert.equal(remnant.type.value,'STOCK Rem');
  assert.ok(!('master_record_id' in remnant),
    'New remnant has no child Master yet; never link parent as child');
  assert.equal(tool.suggestRemnantType(currentMaster),'STOCK Rem');
  assert.equal(tool.suggestRemnantType(masterFixture({type:'SO-Slab'})),
    'Stan-Rem');
  assert.equal(tool.suggestRemnantType(masterFixture({type:'Cosigned Slab'})),
    '', 'Unspecified parent types require a manual choice');
  const fromParent=tool.buildEntry({...unmatched,
    requestId:'IN-new-rem-parent',
    source:'New Remnant',type:'STOCK Rem',
    parentMasterId:'8765',parentColor:'Blue Dunes',
    observedColor:'Blue Dunes V99',
    oldJob:'Test Job',material:'Quartz',thickness:'3cm',finish:'Polished',
    length:'29',width:'18'
  },['first','second'],schema,null,currentMaster);
  assert.equal(fromParent.color.value,'Blue Dunes',
    'New remnant copies an actual existing Color lookup');
  assert.equal(fromParent.warehouse_parent_reference.value,'Master #8765');
  assert.equal(fromParent.old_job.value,'Test Job');
  assert.equal(fromParent.material.value,'Quartz');
  assert.equal(fromParent.thickness.value,'3cm',
    'The identified parent supplies actual thickness');
  assert.equal(fromParent.type.value,'STOCK Rem');
  assert.equal(fromParent.length.value,29);
  assert.equal(fromParent.width.value,18);
  assert.ok(!('shape' in fromParent),
    'Parent slab shape is not assumed to be new remnant shape');
  assert.ok(!('master_record_id' in fromParent),
    'Parent slab ID must NOT populate new remnant master_record_id');
  const discontinued=tool.buildEntry({...unmatched,
    source:'New Remnant',type:'Stan-Rem',
    parentMasterId:'8765',parentColor:'Blue Dunes',
    length:'30',width:'25'
  },['first','second'],schema,null,currentMaster);
  assert.equal(discontinued.type.value,'Stan-Rem',
    'Allow manual override for no-longer-stock stone');
  assert.equal(discontinued.thickness.value,'Unknown',
    'Unconfirmed remnant thickness must never become 3cm by default');
  for(const value of ['12mm','Other','2cm','3cm']){
    const alternate=tool.buildEntry({...unmatched,
      thickness:value
    },['first','second'],schema);
    assert.equal(alternate.thickness.value,value,
      'IN must preserve a crew-chosen thickness '+value);
  }
  assert.throws(()=>tool.buildEntry({...unmatched,
    source:'New Remnant',type:'STOCK Rem',
    parentMasterId:'8765',parentColor:'Blue Dunes'
  },['first','second'],schema),/Parent slab lookup is unconfirmed/);
  assert.throws(()=>tool.buildEntry({...unmatched,
    source:'New Remnant',type:'STOCK Rem',
    masterId:'8765',masterColor:'Blue Dunes'
  },['first','second'],schema,currentMaster),/New Remnant is a separate piece/);
  const now=tool.buildEntry({...unmatched,putawayPlan:'Put Away Now',
    finalRack:'Z-5A',source:'Customer Drop-off',type:'Stock Slab'
  },['first','second'],schema);
  assert.equal(now.rack.value,'Z-5A');
  assert.equal(now.warehouse_putaway_plan.value,'Put Away Now');
  assert.throws(()=>tool.buildEntry({...unmatched,
    putawayPlan:'Put Away Now'},['first','second'],schema),/final rack/i);
  assert.throws(()=>tool.buildEntry({...unmatched,
    putawayPlan:'Put Away Now',finalRack:'Pending Putaway'
  },['first','second'],schema),/permanent rack/);
  assert.throws(()=>tool.buildEntry({...unmatched,
    length:'-20'},['first','second'],schema),/positive length/);
  assert.throws(()=>tool.buildEntry({...unmatched,
    material:'Fake Quartz'},['first','second'],schema),/not an App 15 option/);
  assert.throws(()=>tool.buildEntry({...unmatched,
    missingLabel:true},['first','second'],schema),/Explain why/);
  const alt=tool.buildEntry({...unmatched,
    missingLabel:true,labelReason:'No sticker; photographed etched edge'
  },['first','second'],schema);
  assert.equal(alt.warehouse_label_status.value,'Missing');
  assert.equal(alt.warehouse_label_note.value,
    'No sticker; photographed etched edge');

  const known={...unmatched,source:'Unused Piece',
    type:'Stock Slab',masterId:'8765',masterColor:'Blue Dunes',
    material:'Quartz',thickness:'3cm',finish:'Polished',
    shape:'Rectangle',length:'120',width:'60',oldJob:'Test Job',
    putawayPlan:'Put Away Now',finalRack:'Z-5A'};
  const existing=tool.buildEntry(known,['first','second'],
    schema,currentMaster);
  assert.equal(existing.master_record_id.value,'8765');
  assert.equal(existing.color.value,'Blue Dunes');
  assert.equal(existing.type.value,'Stock Slab');
  assert.equal(existing.warehouse_identification_status.value,'Identified');
  assert.equal(existing.rack.value,'Z-5A');
  assert.throws(()=>tool.buildEntry({...known,masterId:'8766'},
    ['first','second'],schema,currentMaster),/unconfirmed/);

  assert.ok(!js.includes('warehouse_piece_kind'),
    'Do not require an extra generic warehouse piece-kind field');
  const oldThicknessDefault=props.thickness.defaultValue;
  props.thickness.defaultValue='Unknown';
  assert.throws(()=>tool.validateSchema(props),/3cm default/);
  props.thickness.defaultValue=oldThicknessDefault;
  const oldThicknessOptions=props.thickness.options;
  props.thickness.options=options('2cm','3cm');
  assert.throws(()=>tool.validateSchema(props),/Add "12mm"/);
  props.thickness.options=oldThicknessOptions;
  const oldTypeRequired=props.type.required;
  props.type.required=true;
  assert.throws(()=>tool.validateSchema(props),
    /make App 15 field "type" optional/);
  props.type.required=oldTypeRequired;
  const original=props.color.required;
  props.color.required=true;
  assert.throws(()=>tool.validateSchema(props),/make App 15 field "color" optional/);
  props.color.required=original;
  const oldDefault=props.peter_notification.defaultValue;
  props.peter_notification.defaultValue=[];
  assert.throws(()=>tool.validateSchema(props),/Peter Notification/);
  props.peter_notification.defaultValue=oldDefault;
  assert.equal(await tool.validRack('Remnant Cart'),'Remnant Cart');
  rackMode='missing';
  await assert.rejects(tool.validRack('Remnant Cart'),/not an available/);
  rackMode='normal';

  assert.equal(tool.photoFilename(unmatched,null,'FULL_PIECE',0,full),
    'Mysterious gray with red mark - Unknown x Unknown in - '+
    'Record Unmatched IN-unmat - IN - Full Piece.jpg');
  assert.equal(tool.photoFilename(known,currentMaster,'IDENTIFYING_LABEL',0,label),
    'Blue Dunes V99 - 120 x 60 in - Record 8765 - IN - Label.jpg');
  assert.match(tool.photoFilename(known,currentMaster,'ADDITIONAL',2,extra),
    / - IN - Additional 2\.jpg$/);
  assert.equal(tool.distinctFiles(full,label),true,
    'Different image names must be treated as distinct evidence');
  assert.equal(tool.distinctFiles(full,{...full}),false,
    'A copy with the same name, size and date is not distinct');
  assert.equal(tool.distinctFiles(full,{...label,lastModified:43}),true);
  // Required two images must be distinct by actual fingerprint.
  const distinctLabel={...label,lastModified:43};
  const beforePosts=apiCalls.filter(c=>c.method==='POST').length;
  const uploadCount=fileUploads.length;
  const successful=await tool.submit(unmatched,
    {full,label:distinctLabel,extra:[extra]},()=>{});
  assert.equal(successful.id,'6101');
  assert.equal(successful.needsReview,true);
  assert.equal(successful.existing,false);
  assert.equal(fileUploads.length,uploadCount+3);
  assert.equal(records.length,1);
  assert.equal(records[0].peter_notification.value[0].code,'peter-owner');
  assert.equal(records[0].inventory_verified.value,'No');
  assert.equal(records[0].warehouse_disposition.value,'Active');
  assert.equal(apiCalls.filter(c=>c.method==='POST').length,beforePosts+1);
  const repeated=await tool.submit(unmatched,
    {full,label:distinctLabel,extra:[]});
  assert.equal(repeated.existing,true);
  assert.equal(records.length,1);
  assert.equal(fileUploads.length,uploadCount+3);

  const matched=await tool.submit({...known,requestId:'IN-match-1'},
    {full,label:distinctLabel});
  assert.equal(matched.id,'6102');
  assert.equal(matched.needsReview,false);
  assert.equal(records[1].master_record_id.value,'8765');

  // The file names may be descriptive but they must never affect Master.
  assert.ok(!apiCalls.some(c=>c.method==='POST'&&c.data.app===6));

  // Hard-fail oversized files if decoding is unavailable, BEFORE Kintone
  // uploads even if earlier files passed.
  const oversized={name:'large.heic',type:'image/heic',
    size:9000000,lastModified:51};
  const uploadsBeforeFail=fileUploads.length;
  const postsBeforeFail=records.length;
  await assert.rejects(tool.submit({...unmatched,
    requestId:'IN-big-label-1'},{
    full,label:oversized
  }),/500 KB/);
  assert.equal(fileUploads.length,uploadsBeforeFail);
  assert.equal(records.length,postsBeforeFail);
  await assert.rejects(tool.submit({...unmatched,
    requestId:'IN-big-extra-1'},{
    full,label:distinctLabel,extra:[oversized]
  }),/500 KB/);
  assert.equal(fileUploads.length,uploadsBeforeFail);
  assert.equal(records.length,postsBeforeFail);

  // Reject missing temp location before upload.
  rackMode='missing';
  await assert.rejects(tool.submit({...unmatched,
    requestId:'IN-rack-fail-1'},{
    full,label:distinctLabel
  }),/not an available/);
  rackMode='normal';
  assert.equal(fileUploads.length,uploadsBeforeFail);

  // A network timeout can mean the Add Record actually succeeded:
  // lookup the unique request key rather than posting a duplicate.
  postMode='ambiguous';
  const uncertain=await tool.submit({...unmatched,
    requestId:'IN-lost-response'},{
    full,label:distinctLabel
  });
  assert.equal(uncertain.existing,true);
  assert.equal(uncertain.id,'6103');
  assert.equal(records.length,3);
  postMode='reject';
  await assert.rejects(tool.submit({...unmatched,
    requestId:'IN-unknown-response'},{
    full,label:distinctLabel
  }),/Do NOT resubmit/);
  assert.equal(records.length,3);

  // Large mobile camera shots should be adaptively resized in few passes;
  // converted JPEG still retains the <=500,000-byte hard cap.
  let encodes=0,decodes=0,revocations=0;
  let multiplier=1;
  const canvas={
    width:0,height:0,
    getContext(){
      return {set fillStyle(v){},
        fillRect(){},drawImage(){}};
    },
    toBlob(cb,type,quality){
      encodes++;
      assert.equal(type,'image/jpeg');
      const pixels=this.width*this.height;
      cb({size:Math.round(900000*pixels/(2048*1536)*
        quality*multiplier),type:'image/jpeg'});
    }
  };
  class FakeImage {
    constructor(){
      this.naturalWidth=4032;
      this.naturalHeight=3024;
    }
    set src(v){decodes++;if(v&&this.onload)this.onload();}
  }
  class FakeFile {
    constructor(blobs,name,opts){
      this.name=name;
      this.type=opts.type;
      this.lastModified=opts.lastModified;
      this.size=blobs.reduce((n,b)=>n+b.size,0);
    }
  }
  const resizeEnv={
    window:{kintone,ZM_WAREHOUSE_IN_CONFIG:{
      enabled:true,submissionsEnabled:false
    }},
    kintone,Image:FakeImage,File:FakeFile,
    URL:{
      createObjectURL(){return 'blob:mock';},
      revokeObjectURL(url){
        assert.equal(url,'blob:mock');revocations++;
      }
    },
    document:{createElement(name){
      assert.equal(name,'canvas');return canvas;
    },getElementById(){return null;}}
  };
  vm.runInNewContext(js,resizeEnv);
  const photo=resizeEnv.window.ZM_WAREHOUSE_IN_V1.optimizePhoto;
  const large={name:'iPhone.HEIC',size:9200000,
    type:'image/heic',lastModified:125};
  const startEncodes=encodes;
  const shrink=await photo(large,'FULL_PIECE');
  assert.ok(shrink.size>0&&shrink.size<=500000);
  assert.equal(shrink.type,'image/jpeg');
  assert.equal(shrink.name,'iPhone_500kb.jpg');
  assert.ok(encodes-startEncodes<=3);
  const labelStart=encodes;
  const labelShrink=await photo(large,'IDENTIFYING_LABEL');
  assert.ok(labelShrink.size<=500000);
  assert.ok(encodes-labelStart<=4);
  assert.equal(await photo(full,'FULL_PIECE'),full,
    'Already-small photos should skip JPEG work');
  assert.equal(decodes,2,'Do not decode small photos');
  multiplier=100;
  await assert.rejects(photo(large,'IDENTIFYING_LABEL'),/500 KB/);
  assert.equal(revocations,3,'All blob URLs should be released');

  // Preview config still allows a visible form but blocks all writes.
  const noWriteCalls=[];
  const kintonePreview={
    events:{on(){}},
    api(){noWriteCalls.push(1);throw Error('No preview reads needed');}
  };
  const envPreview={
    window:{kintone:kintonePreview,
      ZM_WAREHOUSE_IN_CONFIG:defaults.window.ZM_WAREHOUSE_IN_CONFIG},
    kintone:kintonePreview,document:{getElementById(){return null;}}
  };
  vm.runInNewContext(js,envPreview);
  await assert.rejects(envPreview.window.ZM_WAREHOUSE_IN_V1.submit(
    unmatched,{full,label:distinctLabel}),/Preview only/);
  assert.equal(noWriteCalls.length,0);

  console.log('Warehouse Universal IN mocked tests PASSED: '+
    'unmatched capture, source and parent lineage, identified Master, '+
    'putaway-now/later, protected field defaults, 500 KB no-partial-upload, '+
    'filenames, idempotency and preview disabled.');
})().catch(error=>{console.error(error);process.exitCode=1;});
