/*
 * Zimmer Marble Universal Warehouse IN - initial capture workflow.
 * APP 15 ONLY. Does not write Master Inventory App 6.
 * No production writes unless an administrator installs an IN config
 * with enabled:true and submissionsEnabled:true.
 *
 * IN and later putaway are separate auditable activities. This version
 * records IN only, with Put Away Now or Awaiting Putaway selections.
 * Pending putaway resolution will be a separate module/view.
 */
(function () {
  'use strict';
  const config = window.ZM_WAREHOUSE_IN_CONFIG || {};
  if (config.enabled !== true) return;
  if (!window.kintone || !kintone.events) return;
  const canSubmit = config.submissionsEnabled === true;
  const MASTER_APP = 6;
  const ENTRY_APP = 15;
  const RACK_APP = 7;
  const VIEW = 'Warehouse IN';
  const ROOT_ID = 'zm-warehouse-in-root';
  const PHOTO_MAX_BYTES = 500000;
  const SOURCE_CHOICES = Object.freeze([
    'New Remnant', 'New Slab', 'Unused Piece',
    'Field Return', 'Customer Drop-off', 'Other / Unknown'
  ]);
  const TYPE_CHOICES = Object.freeze([
    'Stock Slab','STOCK Rem','SO-Slab','Cosigned Slab','Stan-Rem'
  ]);
  const PUTAWAY = Object.freeze({later:'Put Away Later',now:'Put Away Now'});
  const TEMP_RACKS = Object.freeze({
    remnant:'Remnant Cart',other:'Pending Putaway'
  });
  const NEW_FIELDS = Object.freeze({
    warehouse_event_type:'DROP_DOWN',
    warehouse_in_source:'DROP_DOWN',
    type:'DROP_DOWN',
    warehouse_putaway_plan:'DROP_DOWN',
    warehouse_identification_status:'DROP_DOWN',
    warehouse_observed_color:'SINGLE_LINE_TEXT',
    warehouse_parent_reference:'SINGLE_LINE_TEXT',
    warehouse_in_description:'MULTI_LINE_TEXT'
  });
  const OPTIONAL_FIELDS = Object.freeze([
    'color','finish','old_job','new_job','shape',
    'length','width','material','type'
  ]);
  const MASTER_FIELDS = Object.freeze([
    '$id','color','color_combined','zmv_num','material','thickness',
    'finish','shape','length','width','job','rack','inventory_status','type'
  ]);
  const PROTECTED_FIELDS = Object.freeze([
    'inventory_verified','warehouse_disposition','peter_notification',
    'parent_slab_id','ZMID','current_placement','move_complete'
  ]);
  let root = null;
  let busy = false;
  let matchedMaster = null;
  let matchedParent = null;
  let requestId = '';
  let cachedSchema = null;
  let mobile = false;

  const str = x => x == null ? '' : String(x);
  const txt = x => str(x).trim();
  const val = (record, code) => record && record[code] &&
    record[code].value !== undefined ? record[code].value : '';
  const read = (record, code) => txt(val(record,code));
  const fail = (ok, message) => { if (!ok) throw new Error(message); };
  const esc = x => str(x).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const api = (path, method, data) =>
    kintone.api(kintone.api.url(path,true),method,data);
  const hasOption = (field, value) => Boolean(field && field.options &&
    Object.values(field.options).some(option => option.label === value));
  const sortedOptions = field => field && field.options ?
    Object.values(field.options).map(o=>o.label).filter(Boolean).sort() : [];
  const quote = x => '"' + txt(x).replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '"';

  function makeRequestId() {
    fail(window.crypto && typeof window.crypto.randomUUID === 'function',
      'Secure request ID unavailable. Use an updated Kintone mobile app.');
    return window.crypto.randomUUID();
  }
  function validateSchema(props) {
    fail(props && typeof props === 'object',
      'Cannot read Inventory Entry Sheet (App 15) field definitions.');
    const present = ['inventory_status','color','rack','thickness','finish',
      'material','shape','length','width','old_job','new_job',
      'master_record_id','warehouse_request_id','exact_picture',
      'warehouse_label_status','warehouse_label_note',
      'inventory_verified','warehouse_disposition','peter_notification'];
    for (const code of present) {
      fail(Boolean(props[code]),'App 15 is missing field "'+code+'".');
    }
    for (const code of OPTIONAL_FIELDS) {
      fail(props[code].required !== true,
        'For incomplete IN records, make App 15 field "'+code+'" optional. ' +
        'The existing OUT addon still validates this field.');
    }
    // Radio buttons cannot have an empty value. Preserve App 15's familiar
    // 3cm default for manual entries; IN explicitly sends Unknown for blanks.
    fail(props.thickness.type === 'RADIO_BUTTON' &&
      props.thickness.required === true &&
      props.thickness.defaultValue === '3cm',
      'App 15 Thickness must stay a radio button with 3cm default.');
    for (const option of ['3cm','2cm','12mm','Other','Unknown']) {
      fail(hasOption(props.thickness,option),
        'Add "'+option+'" to App 15 Thickness radio options.');
    }
    for (const [code,type] of Object.entries(NEW_FIELDS)) {
      fail(props[code] && props[code].type===type,
        'Create App 15 field "'+code+'" as '+type+'.');
    }
    for (const [code,type] of Object.entries({
      master_record_id:'NUMBER',warehouse_request_id:'SINGLE_LINE_TEXT',
      exact_picture:'FILE',warehouse_label_status:'DROP_DOWN',
      warehouse_label_note:'MULTI_LINE_TEXT',
      inventory_verified:'DROP_DOWN',warehouse_disposition:'DROP_DOWN',
      peter_notification:'USER_SELECT'
    })) {
      fail(props[code].type === type,
        'App 15 field "'+code+'" must be '+type+'.');
    }
    fail(props.warehouse_request_id.unique === true,
      'App 15 warehouse_request_id must prohibit duplicate values.');
    fail(hasOption(props.inventory_status,'In'),
      'App 15 inventory_status needs the In option.');
    fail(hasOption(props.warehouse_event_type,'IN') &&
      hasOption(props.warehouse_event_type,'PUTAWAY'),
      'App 15 warehouse_event_type needs IN and PUTAWAY options.');
    for (const choice of SOURCE_CHOICES) {
      fail(hasOption(props.warehouse_in_source,choice),
        'Add "'+choice+'" to App 15 warehouse_in_source.');
    }
    for (const choice of TYPE_CHOICES) {
      fail(hasOption(props.type,choice),
        'Add "'+choice+'" to App 15 Type (code: type).');
    }
    for (const choice of Object.values(PUTAWAY)) {
      fail(hasOption(props.warehouse_putaway_plan,choice),
        'Add "'+choice+'" to App 15 warehouse_putaway_plan.');
    }
    for (const choice of ['Needs Review','Identified']) {
      fail(hasOption(props.warehouse_identification_status,choice),
        'Add "'+choice+'" to App 15 warehouse_identification_status.');
    }
    for (const choice of ['Present','Missing']) {
      fail(hasOption(props.warehouse_label_status,choice),
        'Add "'+choice+'" to App 15 warehouse_label_status.');
    }
    fail(props.inventory_verified.required === false &&
      props.inventory_verified.defaultValue === 'No' &&
      hasOption(props.inventory_verified,'No') &&
      hasOption(props.inventory_verified,'Yes'),
      'Inventory Verified must stay optional with default No.');
    fail(props.warehouse_disposition.required === false &&
      props.warehouse_disposition.defaultValue === 'Active' &&
      hasOption(props.warehouse_disposition,'Active') &&
      hasOption(props.warehouse_disposition,'Voided'),
      'Warehouse Disposition must stay optional with default Active.');
    const recipient = props.peter_notification;
    fail(recipient.required === false &&
      Array.isArray(recipient.defaultValue) &&
      recipient.defaultValue.length === 1 &&
      recipient.defaultValue[0].type === 'USER' &&
      txt(recipient.defaultValue[0].code) &&
      recipient.defaultValue[0].code !== 'LOGINUSER()',
      'Peter Notification must remain an optional USER_SELECT field ' +
      'with the owner as the single USER default.');
    fail(props.warehouse_parent_reference.required !== true &&
      props.warehouse_observed_color.required !== true &&
      props.warehouse_in_description.required !== true,
      'All optional IN description/lineage fields must allow blanks.');
    return {properties:props};
  }
  async function schema(force = false) {
    if (force || !cachedSchema) {
      cachedSchema = validateSchema(
        (await api('/k/v1/app/form/fields.json','GET',{app:ENTRY_APP})).properties);
    }
    return cachedSchema;
  }
  async function fetchMaster(id) {
    fail(/^[1-9]\d*$/.test(txt(id)),
      'Enter a valid numeric Master record number.');
    const response = await api('/k/v1/records.json','GET',{
      app:MASTER_APP,fields:MASTER_FIELDS,
      query:'$id = '+id+' limit 1'
    });
    const found = response && response.records && response.records[0];
    fail(found,'Master #'+id+' was not found or is inaccessible.');
    return found;
  }
  async function validRack(rack) {
    const name = txt(rack);
    fail(name,'Select a valid warehouse location.');
    const response = await api('/k/v1/records.json','GET',{
      app:RACK_APP,fields:['$id','rack'],
      query:'rack = '+quote(name)+' limit 1'
    });
    fail(response && response.records && response.records.some(r =>
      read(r,'rack') === name),
    '"'+name+'" is not an available Rack App 7 location. ' +
    'Create it in Rack App 7 or choose an existing valid rack.');
    return name;
  }
  function normalizedSource(input) {
    fail(SOURCE_CHOICES.includes(txt(input.source)),
      'Select where the piece came from.');
    return txt(input.source);
  }
  function assignedRack(input) {
    const plan = txt(input.putawayPlan);
    fail(Object.values(PUTAWAY).includes(plan),
      'Choose Put Away Now or Put Away Later.');
    if (plan === PUTAWAY.now) {
      fail(txt(input.finalRack),'Enter the final rack for Put Away Now.');
      fail(txt(input.finalRack) !== TEMP_RACKS.remnant &&
        txt(input.finalRack) !== TEMP_RACKS.other,
        'Put Away Now needs a permanent rack, not a temporary location.');
      return txt(input.finalRack);
    }
    return ['STOCK Rem','Stan-Rem'].includes(txt(input.type)) ||
      txt(input.source)==='New Remnant'
      ? TEMP_RACKS.remnant : TEMP_RACKS.other;
  }
  function suggestRemnantType(parent) {
    const sourceType = read(parent,'type');
    return sourceType === 'Stock Slab' ? 'STOCK Rem' :
      sourceType === 'SO-Slab' ? 'Stan-Rem' : '';
  }
  function selectedOption(input, code, props) {
    const value = txt(input[code]);
    if (!value) return '';
    fail(hasOption(props[code],value),
      '"'+value+'" is not an App 15 option for '+code+
      '. Leave it blank and describe the piece in Other details.');
    return value;
  }
  function positiveNumber(input, code) {
    const raw = txt(input[code]);
    if (!raw) return '';
    fail(/^\d+(\.\d+)?$/.test(raw) &&
      Number.isFinite(Number(raw)) && Number(raw)>0,
      'Enter a positive '+code+' measurement or leave it blank.');
    return Number(raw);
  }
  function identification(input, masterId) {
    return masterId && txt(input.masterColor) &&
      txt(input.material) && txt(input.thickness) &&
      txt(input.finish) && txt(input.shape) &&
      txt(input.length) && txt(input.width) ?
      'Identified' : 'Needs Review';
  }
  function buildEntry(input, keys, verified, master = null, parent = null) {
    const props = verified.properties;
    fail(Array.isArray(keys) && keys.length >= 2,
      'Two distinct photos are required for every IN.');
    fail(txt(input.requestId),'Missing unique warehouse request ID.');
    fail(txt(input.requestId).length <= 128,
      'Warehouse request ID is too long.');
    const source = normalizedSource(input);
    const type = selectedOption(input,'type',props);
    const thickness = selectedOption(input,'thickness',props) || 'Unknown';
    fail(source!=='New Remnant' ||
      !['Stock Slab','SO-Slab','Cosigned Slab'].includes(type),
      'New Remnant Type must be STOCK Rem or Stan-Rem (or blank for review).');
    fail(source!=='New Slab' ||
      !['STOCK Rem','Stan-Rem'].includes(type),
      'New Slab must use a slab Type (or stay blank for review).');
    const rack = assignedRack(input);
    const masterId = read(master,'$id');
    const parentId = read(parent,'$id');
    fail(!txt(input.masterId) || masterId === txt(input.masterId),
      'Existing Master selection is unconfirmed. Look it up first.');
    fail(source!=='New Remnant' || !masterId,
      'New Remnant is a separate piece: use Parent Slab lookup, not Existing Piece Master.');
    fail(!txt(input.parentMasterId) ||
      (source==='New Remnant' && parentId===txt(input.parentMasterId)),
      'Parent slab lookup is unconfirmed. Find Parent or clear the parent number.');
    const missing = input.missingLabel === true;
    fail(!missing || txt(input.labelReason),
      'Explain why the identifying label is missing.');
    fail(txt(input.labelReason).length <= 2000,
      'Missing-label explanation is too long.');
    const desc = txt(input.description);
    fail(desc.length <= 5000,'Other details must be under 5000 characters.');
    fail(txt(input.observedColor).length <= 255,
      'Observed color must be 255 characters or fewer.');
    fail(txt(input.parentReference).length <= 255,
      'Parent slab reference must be 255 characters or fewer.');
    fail(txt(input.oldJob).length <= 255 &&
      txt(input.newJob).length <= 255,
      'Job names must be 255 characters or fewer.');

    const length = positiveNumber(input,'length');
    const width = positiveNumber(input,'width');
    const record = {
      inventory_status:{value:'In'},
      warehouse_event_type:{value:'IN'},
      warehouse_request_id:{value:txt(input.requestId)},
      warehouse_in_source:{value:source},
      thickness:{value:thickness},
      warehouse_putaway_plan:{value:txt(input.putawayPlan)},
      warehouse_identification_status:{
        value:identification({...input,length,width},masterId)
      },
      warehouse_label_status:{value:missing?'Missing':'Present'},
      warehouse_label_note:{value:missing?txt(input.labelReason):''},
      rack:{value:rack},
      exact_picture:{value:keys.map(fileKey=>({fileKey}))}
    };
    if (masterId) record.master_record_id={value:masterId};
    if (type) record.type={value:type};
    // Color is an App 5 lookup: do NOT write arbitrary observed color text to
    // its key. Keep unknown/free-text color in warehouse_observed_color.
    const colorSource = masterId ? master :
      source==='New Remnant' && parentId ? parent : null;
    if (read(colorSource,'color')) {
      record.color={value:read(colorSource,'color')};
    }
    if (txt(input.observedColor)) {
      record.warehouse_observed_color={value:txt(input.observedColor)};
    }
    const parentRef = txt(input.parentReference) ||
      (parentId ? 'Master #'+parentId : '');
    if (parentRef) record.warehouse_parent_reference={value:parentRef};
    if (desc) record.warehouse_in_description={value:desc};
    if (txt(input.oldJob)) record.old_job={value:txt(input.oldJob)};
    if (txt(input.newJob)) record.new_job={value:txt(input.newJob)};
    if (length!=='') record.length={value:length};
    if (width!=='') record.width={value:width};
    for (const code of ['material','finish','shape']) {
      const choice = selectedOption(input,code,props);
      if (choice) record[code]={value:choice};
    }
    for (const field of PROTECTED_FIELDS) {
      fail(!(field in record),'Crew cannot submit owner-only field '+field+'.');
    }
    return record;
  }

  // Native OUT-style photo filename, shared convention for IN and future
  // putaway images. Never use arbitrary freeform names without sanitizing.
  function safePart(value, max=90) {
    const raw=str(value);
    const normalized=typeof raw.normalize==='function'?
      raw.normalize('NFKC'):raw;
    return normalized.replace(/[<>:"/\\|?*\x00-\x1F]/g,'-')
      .replace(/\s+/g,' ').replace(/^[. ]+|[. ]+$/g,'')
      .slice(0,max).replace(/[. ]+$/g,'') || 'Unknown';
  }
  function photoFilename(input,master,prefix,num,file) {
    const kind=prefix==='FULL_PIECE'?'Full Piece':
      prefix==='IDENTIFYING_LABEL'?'Label':
      prefix==='ALTERNATIVE_ID'?'Alternative ID':
      'Additional '+(num||1);
    const type=str(file&&file.type).toLowerCase();
    const match=str(file&&file.name).match(/\.([a-z0-9]{2,5})$/i);
    const map={'image/jpeg':'jpg','image/png':'png','image/webp':'webp',
      'image/heic':'heic','image/heif':'heif','image/gif':'gif'};
    const ext=map[type]||(match?match[1].toLowerCase():'jpg');
    const color=safePart(read(master,'color_combined') ||
      [read(master,'color'),read(master,'zmv_num')]
        .filter(Boolean).join(' ') || input.observedColor);
    const dims=safePart(input.length||read(master,'length')||'Unknown',24)+
      ' x '+safePart(input.width||read(master,'width')||'Unknown',24)+' in';
    const id=read(master,'$id') ||
      'Unmatched '+safePart(txt(input.requestId).slice(0,8),16);
    return color+' - '+dims+' - Record '+safePart(id,40)+
      ' - IN - '+kind+'.'+ext;
  }
  function distinctFiles(a,b) {
    return Boolean(a&&b&&!(a===b||(a.name===b.name&&
      a.size===b.size&&a.lastModified===b.lastModified)));
  }
  function photoTooLarge(prefix) {
    return 'Cannot reduce '+prefix+' to 500 KB on this device. '+
      'Retake a closer photo or choose the mobile-optimized image. '+
      'Nothing was submitted.';
  }
  function profile(prefix) {
    return prefix==='IDENTIFYING_LABEL'||prefix==='ALTERNATIVE_ID'?
      {maxEdge:2560,minEdge:1200}:{maxEdge:2048,minEdge:900};
  }
  async function optimizePhoto(file,prefix) {
    fail(file&&/^image\//i.test(str(file.type)),
      'Select an image for '+prefix+'.');
    fail(Number(file.size)>0,'The selected photo has no data.');
    if (file.size<=PHOTO_MAX_BYTES) return file;
    const error=photoTooLarge(prefix);
    if (typeof Image==='undefined'||typeof document==='undefined'||
      typeof document.createElement!=='function'||
      typeof URL==='undefined'||typeof URL.createObjectURL!=='function'||
      typeof URL.revokeObjectURL!=='function') throw new Error(error);
    let url='',canvas=null;
    try {
      url=URL.createObjectURL(file);
      const image=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error('Cannot decode photo.'));
        img.src=url;
      });
      const w=Number(image.naturalWidth||image.width);
      const h=Number(image.naturalHeight||image.height);
      fail(w>0&&h>0,'Invalid photo dimensions.');
      canvas=document.createElement('canvas');
      fail(canvas&&typeof canvas.getContext==='function'&&
        typeof canvas.toBlob==='function','Mobile photo resize unavailable.');
      const settings=profile(prefix);
      let edge=Math.min(settings.maxEdge,Math.max(w,h));
      const minEdge=Math.min(settings.minEdge,edge);
      for (let attempt=0;attempt<5;attempt++){
        const scale=edge/Math.max(w,h);
        canvas.width=Math.max(1,Math.round(w*scale));
        canvas.height=Math.max(1,Math.round(h*scale));
        const ctx=canvas.getContext('2d');
        fail(ctx,'Could not draw photo.');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const encode=q=>new Promise(resolve=>
          canvas.toBlob(resolve,'image/jpeg',q));
        const asFile=blob=>typeof File==='function'?
          new File([blob],txt(file.name).replace(/\.[^.]+$/,'')+'_500kb.jpg',{
            type:'image/jpeg',lastModified:Number(file.lastModified)||Date.now()
          }):blob;
        let blob=await encode(0.76);
        fail(blob&&blob.type==='image/jpeg'&&blob.size,
          'JPEG encoding is unavailable.');
        if(blob.size<=PHOTO_MAX_BYTES)return asFile(blob);
        if(blob.size<=680000||edge<=minEdge){
          const smaller=await encode(0.62);
          if(smaller&&smaller.type==='image/jpeg'&&smaller.size){
            if(smaller.size<=PHOTO_MAX_BYTES)return asFile(smaller);
            blob=smaller;
          }
          if(edge<=minEdge){
            const last=await encode(0.49);
            if(last&&last.type==='image/jpeg'&&
              last.size>0&&last.size<=PHOTO_MAX_BYTES)return asFile(last);
            break;
          }
        }
        if(edge<=minEdge)break;
        const factor=Math.max(0.5,Math.min(0.87,
          Math.sqrt(465000/blob.size)*0.96));
        edge=Math.max(minEdge,Math.floor(edge*factor));
      }
      throw new Error(error);
    }catch(_){throw new Error(error);}
    finally {
      if(canvas){canvas.width=0;canvas.height=0;}
      if(url)URL.revokeObjectURL(url);
    }
  }
  async function upload(file,filename) {
    fail(file&&/^image\//i.test(str(file.type))&&
      file.size>0&&file.size<=PHOTO_MAX_BYTES,
      'All uploaded images must be 500 KB or less.');
    const token=kintone.getRequestToken();
    fail(token,'Kintone session expired. Sign in again.');
    const data=new FormData();
    data.append('__REQUEST_TOKEN__',token);
    data.append('file',file,filename);
    const result=await fetch(kintone.api.url('/k/v1/file.json',true),{
      method:'POST',credentials:'same-origin',
      headers:{'X-Requested-With':'XMLHttpRequest'},body:data
    });
    const json=await result.json().catch(()=>({}));
    fail(result.ok&&json.fileKey,
      'Photo upload failed ('+result.status+'). IN was not recorded.');
    return json.fileKey;
  }
  async function findRequest(id) {
    const result=await api('/k/v1/records.json','GET',{
      app:ENTRY_APP,fields:['$id','warehouse_request_id'],
      query:'warehouse_request_id = '+quote(id)+' limit 1'
    });
    return result&&result.records&&result.records[0]?
      read(result.records[0],'$id'):'';
  }
  async function submit(input,photos,progress) {
    fail(canSubmit,
      'Preview only: owner has not enabled IN submissions.');
    fail(txt(input.requestId),'Missing warehouse request ID.');
    fail(distinctFiles(photos.full,photos.label),
      'Take two different photos: full piece and label/alternative ID.');
    const prior=await findRequest(input.requestId);
    if(prior)return {id:prior,existing:true};
    // Never trust stale form-schema/defaults from when the view opened.
    const verified=await schema(true);
    let master=null,parent=null;
    if(txt(input.masterId)){
      master=await fetchMaster(input.masterId);
      fail(txt(input.masterColor)===read(master,'color'),
        'Master Color changed while recording IN. Lookup again.');
    }
    if(txt(input.parentMasterId)){
      parent=await fetchMaster(input.parentMasterId);
      fail(txt(input.parentColor)===read(parent,'color'),
        'Parent slab Color changed while recording IN. Find Parent again.');
    }
    const recordPreview=buildEntry(input,['test1','test2'],
      verified,master,parent);
    await validRack(recordPreview.rack.value);
    const photosToUpload=[
      {file:photos.full,prefix:'FULL_PIECE'},
      {file:photos.label,prefix:input.missingLabel?
        'ALTERNATIVE_ID':'IDENTIFYING_LABEL'}
    ];
    (photos.extra||[]).forEach((file,i)=>photosToUpload.push({
      file,prefix:'ADDITIONAL',number:i+1
    }));
    // Compress ALL selected photos first. Any failure leaves Kintone
    // with no uploaded photos and no new movement record.
    let originalBytes=0,uploadedBytes=0;
    const ready=[];
    for(let i=0;i<photosToUpload.length;i++){
      const item=photosToUpload[i];
      originalBytes+=Number(item.file&&item.file.size||0);
      if(progress)progress('Preparing photo '+(i+1)+' of '+
        photosToUpload.length+' (500 KB maximum each)…');
      const optimized=await optimizePhoto(item.file,item.prefix);
      fail(optimized.size<=PHOTO_MAX_BYTES,
        'Photo is larger than 500 KB. No files were uploaded.');
      uploadedBytes+=optimized.size;
      ready.push({...item,file:optimized});
    }
    const keys=[];
    for(let i=0;i<ready.length;i++){
      const item=ready[i];
      if(progress)progress('Uploading photo '+(i+1)+' of '+ready.length+'…');
      const filename=photoFilename(input,master,item.prefix,
        item.number,item.file);
      keys.push(await upload(item.file,filename));
    }
    const record=buildEntry(input,keys,verified,master,parent);
    if(progress)progress('Recording IN in Entry Sheet…');
    try{
      const created=await api('/k/v1/record.json','POST',{
        app:ENTRY_APP,record
      });
      fail(created&&created.id,'Kintone did not provide a new Entry ID.');
      return {id:str(created.id),existing:false,
        originalBytes,uploadedBytes,
        needsReview:record.warehouse_identification_status.value==='Needs Review'};
    }catch(error){
      try{
        const found=await findRequest(input.requestId);
        if(found)return {id:found,existing:true};
      }catch(_){}
      throw new Error('IN submission outcome is uncertain. Do NOT resubmit '+
        'until the owner searches App 15 for request '+
        input.requestId+'. Kintone: '+txt(error&&error.message));
    }
  }

  function optionHtml(list,placeholder) {
    return '<option value="">'+esc(placeholder||'Unknown / leave blank')+
      '</option>'+list.map(x=>'<option value="'+esc(x)+'">'+esc(x)+
      '</option>').join('');
  }
  function paintOptions(form,verified){
    const props=verified.properties;
    for(const code of ['type','thickness','material','finish','shape']){
      const control=form.elements[code];
      const previous=control.value;
      control.innerHTML=optionHtml(sortedOptions(props[code]),
        code==='thickness'?'Unknown (not confirmed)':undefined);
      if(sortedOptions(props[code]).includes(previous)){
        control.value=previous;
      }
    }
  }
  function readInput(form){
    const names=['source','type','putawayPlan','finalRack','masterId',
      'masterColor','parentMasterId','parentColor','observedColor',
      'parentReference','oldJob','newJob',
      'length','width','thickness','material','finish','shape','description',
      'labelReason'];
    const input={requestId};
    for(const name of names)input[name]=form.elements[name].value;
    input.missingLabel=form.elements.missingLabel.checked;
    return input;
  }
  function sourceLocation(form){
    const source=form.elements.source.value;
    const type=txt(form.elements.type.value);
    const isNewRemnant=source==='New Remnant';
    form.querySelector('[data-in-parent-group]').hidden=!isNewRemnant;
    form.querySelector('[data-in-existing-piece]').hidden=isNewRemnant;
    const temporary=isNewRemnant||['STOCK Rem','Stan-Rem'].includes(type)?
      TEMP_RACKS.remnant:TEMP_RACKS.other;
    const now=form.elements.putawayPlan.value===PUTAWAY.now;
    form.querySelector('[data-in-final-rack]').hidden=!now;
    form.elements.finalRack.required=now;
    form.querySelector('[data-in-temporary]').textContent=now?
      'Final rack required; this IN will be marked Put Away Now.':
      'Temporary location: '+temporary+' (Awaiting Putaway)';
  }
  function showError(message) {
    if(!root)return;
    const target=root.querySelector('[data-in-error]');
    if(target){target.textContent=message||'';target.hidden=!message;}
  }
  function showStatus(message){
    if(!root)return;
    const target=root.querySelector('[data-in-status]');
    if(target)target.textContent=message||'';
  }
  function makeForm(){
    return '<div class="zmin-shell">'+
      '<header><h2>Warehouse IN</h2>'+
      '<p>Record any incoming slab, remnant, return or unidentified piece. '+
      'Two photos required; unknown details can stay blank.</p></header>'+
      '<div class="zmin-error" data-in-error hidden role="alert"></div>'+
      '<p class="zmin-status" data-in-status aria-live="polite"></p>'+
      '<form data-in-form>'+
      '<section><h3>1. Where did it come from?</h3>'+
      '<label>Source<select name="source" required>'+
      optionHtml(SOURCE_CHOICES,'Choose source')+'</select></label>'+
      '<label>Inventory Type (if known)<select name="type">'+
      optionHtml([])+'</select></label>'+
      '<label>Originating job (if known)<input name="oldJob" maxlength="255"></label>'+
      '<label>New / receiving job (optional)<input name="newJob" maxlength="255"></label>'+
      '</section>'+
      '<section><h3>2. Identify the piece (optional)</h3>'+
      '<div data-in-parent-group hidden>'+
      '<p class="zmin-help">Find the PARENT slab for a new remnant. We will copy its '+
      'color, material, thickness, finish and job, but NEVER link the new '+
      'remnant to that parent as the same piece.</p>'+
      '<div class="zmin-match"><label>Parent slab Master record #'+
      '<input name="parentMasterId" inputmode="numeric" pattern="[0-9]*" '+
      'placeholder="Leave blank if unknown"></label>'+
      '<button type="button" data-in-parent-lookup>Find Parent</button></div>'+
      '<input type="hidden" name="parentColor">'+
      '<p class="zmin-match-summary" data-in-parent-summary>No parent linked — Needs Review</p>'+
      '<label>Parent slab reference (optional)'+
      '<input name="parentReference" maxlength="255" placeholder="Slab label or other identifier"></label>'+
      '</div>'+
      '<div data-in-existing-piece>'+
      '<p class="zmin-help">If this EXACT piece already has a Master record, '+
      'enter its number. Otherwise leave it unmatched.</p>'+
      '<div class="zmin-match"><label>Existing piece Master record #'+
      '<input name="masterId" inputmode="numeric" pattern="[0-9]*" placeholder="Leave blank if new or unknown"></label>'+
      '<button type="button" data-in-lookup>Find Master</button></div>'+
      '<input type="hidden" name="masterColor">'+
      '<p class="zmin-match-summary" data-in-master>Unmatched — Needs Review</p>'+
      '</div>'+
      '<label>Observed color / marking (optional)'+
      '<input name="observedColor" maxlength="255" placeholder="What does the label or piece say?"></label>'+
      '<div class="zmin-two">'+
      '<label>Length (in)<input name="length" inputmode="decimal" placeholder="Unknown is fine"></label>'+
      '<label>Width (in)<input name="width" inputmode="decimal" placeholder="Unknown is fine"></label>'+
      '<label>Thickness<select name="thickness">'+optionHtml([])+'</select></label>'+
      '<label>Material<select name="material">'+optionHtml([])+'</select></label>'+
      '<label>Finish<select name="finish">'+optionHtml([])+'</select></label>'+
      '<label>Shape<select name="shape">'+optionHtml([])+'</select></label></div>'+
      '<label>Other details / identifying marks'+
      '<textarea name="description" rows="3" maxlength="5000"></textarea></label></section>'+
      '<section><h3>3. Photos</h3>'+
      '<label>Full-piece photo (required)<input name="fullPhoto" type="file" accept="image/*" capture="environment" required></label>'+
      '<label><span data-in-label-title>Identifying label photo (required)</span>'+
      '<input name="labelPhoto" type="file" accept="image/*" capture="environment" required></label>'+
      '<label class="zmin-check"><input name="missingLabel" type="checkbox">No identifying label</label>'+
      '<label data-in-label-reason hidden>Why is the label missing?'+
      '<textarea name="labelReason" rows="2" maxlength="2000"></textarea></label>'+
      '<label>More photos (optional)<input name="extraPhotos" type="file" accept="image/*" multiple></label>'+
      '<p class="zmin-help">Every photo is automatically compressed to 500 KB or less. '+
      'Use close-ups for small lettering. Filenames include the IN movement and photo type.</p></section>'+
      '<section><h3>4. Where is it going?</h3>'+
      '<label>Putaway<select name="putawayPlan">'+
      '<option value="'+PUTAWAY.later+'">'+PUTAWAY.later+'</option>'+
      '<option value="'+PUTAWAY.now+'">'+PUTAWAY.now+'</option></select></label>'+
      '<p class="zmin-help" data-in-temporary>Temporary location: Pending Putaway</p>'+
      '<label data-in-final-rack hidden>Final rack (must exist in Rack App 7)'+
      '<input name="finalRack" maxlength="255" placeholder="e.g. Z-5A"></label></section>'+
      '<footer><button type="submit" data-in-submit '+
      (canSubmit?'':'disabled')+'>'+
      (canSubmit?'Submit IN':'Preview only — submission disabled')+
      '</button></footer></form></div>';
  }
  async function lookup(form){
    const id=txt(form.elements.masterId.value);
    matchedMaster=null;
    form.elements.masterColor.value='';
    if(!id){
      form.querySelector('[data-in-master]').textContent=
        'Unmatched — Needs Review. Master can be assigned later.';
      showStatus('Unmatched intake: enter whatever you know.');
      return;
    }
    showStatus('Looking up Master #'+id+'…');
    try{
      const master=await fetchMaster(id);
      // Do not use parent slab as a match for a newly created remnant.
      if(form.elements.masterId.value!==id)return;
      matchedMaster=master;
      form.elements.masterColor.value=read(master,'color');
      form.querySelector('[data-in-master]').textContent=
        'Matched Master #'+id+' · '+(
          read(master,'color_combined')||read(master,'color')||'Color unknown')+
        ' · '+(read(master,'rack')||'Rack unknown');
      for(const [name,field] of [
        ['length','length'],['width','width'],
        ['thickness','thickness'],['finish','finish'],
        ['material','material'],['shape','shape'],
        ['type','type'],['oldJob','job']]){
        const v=read(master,field);
        if(v)form.elements[name].value=v;
      }
      if(!txt(form.elements.observedColor.value)){
        form.elements.observedColor.value=
          read(master,'color_combined')||read(master,'color');
      }
      showStatus('Master linked. Details are editable for this IN entry.');
    }catch(error){
      showError(txt(error.message));
      showStatus('Master lookup failed; confirm the ID or clear it for unmatched IN.');
    }
  }
  async function lookupParent(form){
    const id=txt(form.elements.parentMasterId.value);
    matchedParent=null;
    form.elements.parentColor.value='';
    if(!id){
      form.querySelector('[data-in-parent-summary]').textContent=
        'No parent linked — new remnant will need review.';
      showStatus('Parent unknown. You can still record this remnant.');
      return;
    }
    if(form.elements.source.value!=='New Remnant'){
      showError('Parent lookup is only for New Remnant.');
      return;
    }
    showStatus('Looking up parent slab #'+id+'…');
    try {
      const parent=await fetchMaster(id);
      if(!form.isConnected||form.elements.parentMasterId.value!==id||
        form.elements.source.value!=='New Remnant')return;
      matchedParent=parent;
      form.elements.parentColor.value=read(parent,'color');
      form.querySelector('[data-in-parent-summary]').textContent=
        'Parent slab #'+id+' · '+
        (read(parent,'color_combined')||read(parent,'color')||'Unknown color')+
        ' · '+(read(parent,'type')||'Type unknown');
      for(const [name,field] of [
        ['material','material'],['thickness','thickness'],
        ['finish','finish'],['oldJob','job']]){
        const value=read(parent,field);
        if(value)form.elements[name].value=value;
      }
      // Deliberately NOT copying parent dimensions or shape.
      // A new remnant gets its own physical dimensions.
      if(!txt(form.elements.observedColor.value)){
        form.elements.observedColor.value=
          read(parent,'color_combined')||read(parent,'color');
      }
      if(!txt(form.elements.parentReference.value))
        form.elements.parentReference.value='Master #'+id;
      const suggestion=suggestRemnantType(parent);
      if(suggestion && form.elements.type.dataset.inManual!=='1'){
        form.elements.type.value=suggestion;
      }
      sourceLocation(form);
      showStatus(suggestion ?
        'Inherited parent details. Suggested '+suggestion+
        '; Type is editable if material is no longer stock.' :
        'Inherited available parent details. Choose the remnant Type manually.');
    }catch(error){
      showError(txt(error.message));
      showStatus('Parent lookup failed. Correct the number, or clear it.');
    }
  }

  function bind(form){
    form.elements.source.addEventListener('change',()=>{
      const newRemnant=form.elements.source.value==='New Remnant';
      if(newRemnant){
        matchedMaster=null;
        form.elements.masterId.value='';
        form.elements.masterColor.value='';
        form.querySelector('[data-in-master]').textContent='Unmatched — Needs Review';
      }else{
        matchedParent=null;
        form.elements.parentMasterId.value='';
        form.elements.parentColor.value='';
        form.querySelector('[data-in-parent-summary]').textContent='No parent linked';
      }
      if(newRemnant &&
        ['Stock Slab','SO-Slab','Cosigned Slab'].includes(form.elements.type.value))
        form.elements.type.value='';
      if(form.elements.source.value==='New Slab' &&
        ['STOCK Rem','Stan-Rem'].includes(form.elements.type.value))
        form.elements.type.value='';
      sourceLocation(form);
    });
    form.elements.type.addEventListener('change',()=>{
      form.elements.type.dataset.inManual='1';
      sourceLocation(form);
    });
    form.elements.putawayPlan.addEventListener('change',()=>sourceLocation(form));
    form.elements.masterId.addEventListener('input',()=>{
      matchedMaster=null;
      form.elements.masterColor.value='';
      form.querySelector('[data-in-master]').textContent=
        'Master record number not yet confirmed. Tap Find Master.';
    });
    form.querySelector('[data-in-lookup]').addEventListener('click',()=>{
      showError('');
      lookup(form);
    });
    form.elements.parentMasterId.addEventListener('input',()=>{
      matchedParent=null;
      form.elements.parentColor.value='';
      form.querySelector('[data-in-parent-summary]').textContent=
        'Parent slab number not confirmed. Tap Find Parent.';
    });
    form.querySelector('[data-in-parent-lookup]').addEventListener('click',()=>{
      showError('');
      lookupParent(form);
    });
    form.elements.missingLabel.addEventListener('change',()=>{
      const missing=form.elements.missingLabel.checked;
      form.querySelector('[data-in-label-reason]').hidden=!missing;
      form.elements.labelReason.required=missing;
      form.querySelector('[data-in-label-title]').textContent=missing?
        'Alternative identifying photo (required)':
        'Identifying label photo (required)';
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy)return;
      showError('');
      const input=readInput(form);
      const photos={
        full:form.elements.fullPhoto.files[0],
        label:form.elements.labelPhoto.files[0],
        extra:Array.from(form.elements.extraPhotos.files||[])
      };
      if(input.masterId&&(!matchedMaster||
        read(matchedMaster,'$id')!==input.masterId)){
        showError('Tap Find Master to confirm the linked piece, '+
          'or clear the record number for unmatched IN.');
        return;
      }
      try{
        // A fresh schema and rack existence check run again in submit().
        buildEntry(input,['check1','check2'],await schema(),
          matchedMaster);
        fail(distinctFiles(photos.full,photos.label),
          'Take two different required photos.');
      }catch(error){showError(txt(error.message));return;}
      busy=true;
      const button=form.querySelector('[data-in-submit]');
      button.disabled=true;
      try{
        const result=await submit(input,photos,showStatus);
        const needsReview=result.needsReview?'Needs Review':'Identified';
        root.querySelector('.zmin-shell').innerHTML=
          '<div class="zmin-success"><h2>IN recorded</h2>'+
          '<p>Entry #'+esc(result.id)+
          ' saved in App 15. Master Inventory was not changed.</p>'+
          '<p>Identification: '+esc(needsReview)+'.</p>'+
          '<p>Photo storage: '+esc(result.originalBytes?
            Math.round(result.originalBytes/1000)+' KB':'Already recorded')+
          ' original → '+esc(result.uploadedBytes?
            Math.round(result.uploadedBytes/1000)+' KB':'Previously uploaded')+
          ' uploaded.</p>'+
          '<a href="'+(mobile?'/k/m/15/show?record=':
            '/k/15/show#record=')+encodeURIComponent(result.id)+
          '" target="_blank" rel="noopener noreferrer">Open IN record</a>'+
          '<button type="button" data-in-again>Record another IN</button>'+
          '</div>';
        root.querySelector('[data-in-again]').addEventListener('click',()=>{
          busy=false;requestId=makeRequestId();render();
        });
      }catch(error){
        showError(txt(error.message));
        if(/submission outcome is uncertain/i.test(txt(error.message))){
          showStatus('Contact owner before attempting another IN.');
          button.dataset.inAmbiguous='1';
        }else showStatus('No IN record was confirmed. Review the error.');
      }finally{
        busy=false;
        if(button.isConnected&&button.dataset.inAmbiguous!=='1'){
          button.disabled=false;
        }
      }
    });
  }
  function render(){
    if(!root)return;
    matchedMaster=null;
    matchedParent=null;
    root.innerHTML=makeForm();
    const form=root.querySelector('[data-in-form]');
    bind(form);
    sourceLocation(form);
    showStatus(canSubmit?
      'Photos and known information are required only where indicated.':
      'Preview only. App 15 writes and photo uploads are disabled.');
    schema().then(current=>{
      if(form.isConnected){paintOptions(form,current);}
    }).catch(error=>{
      showError('App 15 setup required: '+txt(error.message));
    });
  }
  function onShow(event){
    if(Number(event.appId)!==ENTRY_APP||event.viewType!=='custom'||
      event.viewName!==VIEW){root=null;return event;}
    root=document.getElementById(ROOT_ID);
    mobile=event.type==='mobile.app.record.index.show';
    if(!root)return event;
    requestId=makeRequestId();
    render();
    return event;
  }
  kintone.events.on(['app.record.index.show',
    'mobile.app.record.index.show'],onShow);
  // Exposed for isolated Kintone mock tests. No public write tokens.
  window.ZM_WAREHOUSE_IN_V1=Object.freeze({
    validateSchema,buildEntry,assignedRack,photoFilename,optimizePhoto,
    suggestRemnantType,
    distinctFiles,submit,fetchMaster,validRack,findRequest
  });
})();
