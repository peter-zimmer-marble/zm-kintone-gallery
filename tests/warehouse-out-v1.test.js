// Dependency-free mocked contract tests for opt-in Warehouse OUT draft.
// Never call a real Kintone site, send actual uploads, or touch App 6.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('zm-warehouse-out-v1.js', 'utf8');
new vm.Script(script, { filename: 'zm-warehouse-out-v1.js' });

// Separate explicitly enabled production test config. This is not the
// previous employee/record-limited preview mode.
const liveConfigSource = fs.readFileSync(
  'zm-warehouse-out-live-config-v1.js', 'utf8');
new vm.Script(liveConfigSource, {
  filename: 'zm-warehouse-out-live-config-v1.js'
});
const liveConfigContext = {window:{}};
vm.runInNewContext(liveConfigSource,liveConfigContext);
const liveConfig = liveConfigContext.window.ZM_WAREHOUSE_OUT_CONFIG;
assert.equal(liveConfig.mode,'live');
assert.equal(liveConfig.submissionsEnabled,true);
assert.equal(liveConfig.enabled,true);
assert.equal(Object.isFrozen(liveConfig),true);

// The publishable preview configuration is deliberately frozen with
// writes disabled for employee zmproduction, Master #8160 only.
const previewConfigSource = fs.readFileSync(
  'zm-warehouse-out-pilot-preview-v1.js', 'utf8');
new vm.Script(previewConfigSource, {
  filename: 'zm-warehouse-out-pilot-preview-v1.js'
});
const previewConfigEnv = { window: {} };
vm.runInNewContext(previewConfigSource, previewConfigEnv);
const previewConfig = previewConfigEnv.window.ZM_WAREHOUSE_OUT_CONFIG;
assert.equal(previewConfig.enabled, true);
assert.equal(previewConfig.ownerValidatedPermissions, true);
assert.equal(previewConfig.pilotMasterRecordId, '8160');
assert.equal(previewConfig.pilotUserCode, 'zmproduction');
assert.equal(previewConfig.pilotSubmitEnabled, false,
  'Published pilot preview must never permit OUT submission');
assert.equal(Object.isFrozen(previewConfig), true,
  'Published preview config must be immutable in the page session');


function createProperties() {
  const base = Object.fromEntries([
    'color', 'thickness', 'inventory_status', 'finish', 'new_job',
    'peter_notification', 'rack', 'shape', 'length', 'old_job',
    'material', 'width'
  ].map(code => [code, { type: 'SINGLE_LINE_TEXT' }]));
  base.thickness = { type: 'RADIO_BUTTON', options: {
    c2: { label: '2cm' }, c3: { label: '3cm' }
  } };
  base.finish = { type: 'DROP_DOWN', options: {
    polished: { label: 'Polished' }, honed: { label: 'Honed' }
  } };
  base.material = { type: 'DROP_DOWN', options: {
    quartz: { label: 'Quartz' }, granite: { label: 'Granite' }
  } };
  base.shape = { type: 'DROP_DOWN', options: {
    rectangle: { label: 'Rectangle' }, left: { label: 'Left Hand L' }
  } };
  base.inventory_status = { type: 'RADIO_BUTTON', options: {
    in: { label: 'In' }, out: { label: 'Out' }
  } };
  base.peter_notification = { type: 'USER_SELECT', required: false,
    defaultValue: [{ code: 'peter-validated', type: 'USER' }] };
  base.inventory_verified = { type: 'DROP_DOWN', required: false,
    defaultValue: 'No', options: {
      no: { label: 'No' }, yes: { label: 'Yes' }
    } };
  base.master_record_id = { type: 'NUMBER' };
  base.warehouse_request_id = {
    type: 'SINGLE_LINE_TEXT', unique: true
  };
  base.warehouse_disposition = {
    type: 'DROP_DOWN', required: false, defaultValue: 'Active', options: {
      active: { label: 'Active' }, voided: { label: 'Voided' }
    }
  };
  base.warehouse_label_status = {
    type: 'DROP_DOWN', options: {
      present: { label: 'Present' }, missing: { label: 'Missing' }
    }
  };
  base.warehouse_label_note = { type: 'MULTI_LINE_TEXT' };
  base.exact_picture = { type: 'FILE' };
  for (const field of ['color_combined', 'zmv_num', 'length_2',
    'width_2', 'in_out_note']) {
    base[field] = { type: 'SINGLE_LINE_TEXT' };
  }
  return base;
}
function makeMaster(data = {}) {
  const raw = {
    '$id': '123', color: 'Blue Dunes', color_combined: 'Blue Dunes V1',
    stock_id: 'ZM-XYZ', thickness: '3cm', finish: 'Polished',
    shape: 'Rectangle', length: '122', width: '62', rack: 'Z-5A',
    job: 'Johnson Kitchen', material: 'Quartz', inventory_status: 'In',
    staging_status: 'RTS', type: 'Stock Slab', ...data
  };
  return Object.fromEntries(
    Object.entries(raw).map(([k, value]) => [k, { value }])
  );
}
const properties = createProperties();
const calls = [];
const notifications = [];
let apiPostMode = 'success';
let pendingEntries = [];
let entryRecords = [];
let nextId = 5001;
let uploadCount = 0;
let apiReadEnabled = true;
let currentMaster = makeMaster();
const previousCalls = () => calls.length;
const eventHandlers = [];
async function api(url, method, data) {
  calls.push({ url, method, data });
  if (!apiReadEnabled && method === 'GET') {
    throw new Error('Could not check Kintone permissions');
  }
  if (url.endsWith('/app/form/fields.json')) {
    assert.equal(method, 'GET');
    assert.equal(data.app, 15);
    return { properties };
  }
  if (method === 'GET' && data.app === 6) {
    assert.ok(!data.fields.includes('purchase_price'));
    assert.ok(!data.fields.includes('vendor'));
    return { records: [currentMaster] };
  }
  if (method === 'GET' && data.app === 15) {
    assert.ok(data.fields, 'Explicit allowlist required');
    if (data.query.includes('warehouse_request_id = ')) {
      const req = data.query.match(/warehouse_request_id = "([^"]+)"/);
      const record = entryRecords.find(
        x => x.warehouse_request_id.value === req[1]
      );
      return { records: record ? [record] : [] };
    }
    assert.match(data.query, /warehouse_disposition in \("Active"\)/);
    assert.match(data.query, /inventory_verified in \("No"\)/);
    assert.match(data.query, /inventory_status in \("Out"\)/);
    return { records: pendingEntries };
  }
  if (method === 'POST' && data.app === 15) {
    assert.ok(data.record, 'Expect a single new movement record');
    assert.ok(!data.record.move_complete);
    assert.ok(!data.record.purchase_price);
    assert.ok(!data.record.vendor);
    assert.equal(data.record.master_record_id.value, '123');
    assert.equal(data.record.inventory_status.value, 'Out');
    // Real crew user has no Edit permission to these protected fields.
    // Any attempt to include even the expected defaults must fail.
    for (const restricted of ['inventory_verified',
      'warehouse_disposition', 'peter_notification',
      'parent_slab_id', 'ZMID', 'current_placement']) {
      assert.ok(!(restricted in data.record),
        'Crew API POST must omit owner-only field: ' + restricted);
    }
    if (apiPostMode === 'reject') throw new Error('Server timeout');
    const id = String(nextId++);
    const recipient = properties.peter_notification.defaultValue[0].code;
    entryRecords.push({
      ...data.record,
      inventory_verified: { value: properties.inventory_verified.defaultValue },
      warehouse_disposition: { value: properties.warehouse_disposition.defaultValue },
      peter_notification: { value: [{ code: recipient }] },
      $id: { value: id }
    });
    // Simulate Kintone notification to the configured default recipient.
    notifications.push({ id, recipient });
    if (apiPostMode === 'ambiguous') throw new Error('Lost confirmation');
    return { id };
  }
  throw new Error('Unexpected Kintone endpoint/method ' + method + ' ' + url);
}
api.url = p => p;

class MockFormData {
  items = [];
  append(...args) { this.items.push(args); }
}
async function fakeFetch(url, options) {
  assert.equal(url, '/k/v1/file.json');
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'same-origin');
  assert.equal(options.headers['X-Requested-With'], 'XMLHttpRequest');
  assert.ok(!options.headers['Content-Type'],
    'Browser must set multipart content type and boundary');
  assert.ok(options.body.items.some(item =>
    item[0] === '__REQUEST_TOKEN__' && item[1] === 'test-csrf-token'));
  const image = options.body.items.find(item => item[0] === 'file');
  assert.ok(image, 'Kintone file field required');
  assert.match(image[2],
    /^(FULL_PIECE|IDENTIFYING_LABEL|ALTERNATIVE_ID|ADDITIONAL)_/);
  const fileKey = 'verified-file-key-' + (++uploadCount);
  return { ok: true, status: 200, async json() { return { fileKey }; } };
}
const config = {
  enabled: true, ownerValidatedPermissions: true,
  pilotMasterRecordId: '123', pilotUserCode: 'crew-test-user',
  pilotSubmitEnabled: true
};
const env = {
  window: {
    ZM_WAREHOUSE_OUT_CONFIG: config,
    crypto: { randomUUID() { return 'uuid-valid-draft'; } }
  },
  kintone: {
    events: { on(names, callback) { eventHandlers.push([names, callback]); } },
    api,
    getLoginUser() { return {code:'crew-test-user'}; },
    getRequestToken() { return 'test-csrf-token'; }
  },
  document: { getElementById() { return null; } },
  MutationObserver: class {
    observe() {}
    disconnect() {}
  },
  FormData: MockFormData,
  fetch: fakeFetch,
  console
};
vm.runInNewContext(script, env, { filename: 'zm-warehouse-out-v1.js' });
assert.equal(eventHandlers.length, 1, 'Draft must register only when opt-in enabled');
const mod = env.window.ZM_WAREHOUSE_OUT_DRAFT;
assert.ok(mod, 'Draft test API should be exposed in enabled mode');

(async () => {
  const data = mod.validateSchema(properties);
  assert.equal(data.properties, properties);
  // Submission permission is fixed when the module initializes. Test the
  // preview-only runtime separately below rather than toggling the config
  // after loading this write-enabled pilot instance.
  const beforeWrongPilot = previousCalls();
  const beforeWrongUploads = uploadCount;
  const wrongMaster = makeMaster({ '$id': '999' });
  await assert.rejects(mod.submit(wrongMaster, {
    requestId:'wrong-master', previousMode:'none', newJob:'Another Job',
    missingLabel:false, notes:''
  }, {full:{name:'full.jpg',size:1,lastModified:1,type:'image/jpeg'},
      label:{name:'label.jpg',size:1,lastModified:2,type:'image/jpeg'}}),
    /only for Master #123/);
  assert.equal(previousCalls(), beforeWrongPilot,
    'Pilot record guard must reject before any network call');
  assert.equal(uploadCount, beforeWrongUploads,
    'Pilot record guard must reject before any photo upload');
  assert.throws(() => mod.buildEntry(wrongMaster, {
    previousMode:'none', newJob:'Another Job'
  }, ['a','b'], {properties}, 'wrong-master'), /only for Master #123/);
  assert.equal(data.peterUserCode, undefined,
    'Do not give crew submissions access to the owner user code.');

  const noUnique = { ...properties, warehouse_request_id: {
    type: 'SINGLE_LINE_TEXT', unique: false
  }};
  assert.throws(() => mod.validateSchema(noUnique), /prohibit duplicate values/);
  const noVoid = { ...properties, warehouse_disposition: {
    type: 'DROP_DOWN', required:false, defaultValue:'Active',
    options: { active: { label: 'Active' } }
  }};
  assert.throws(() => mod.validateSchema(noVoid), /Voided/);
  const noLabel = { ...properties, warehouse_label_note: undefined };
  assert.throws(() => mod.validateSchema(noLabel), /warehouse_label_note/);
  const defaultsNotPeter = { ...properties, peter_notification: {
    type: 'USER_SELECT', required:false,
    defaultValue: [{type:'FUNCTION',code:'LOGINUSER()'}]
  }};
  assert.throws(() => mod.validateSchema(defaultsNotPeter),
    /Peter Notification must default to one specific USER/);
  assert.throws(() => mod.validateSchema({
    ...properties, peter_notification: {
      ...properties.peter_notification, required:true }
  }), /Uncheck Required on Peter Notification/);
  assert.throws(() => mod.validateSchema({
    ...properties, peter_notification: {
      ...properties.peter_notification, defaultValue: [] }
  }), /Peter Notification must default/);
  assert.throws(() => mod.validateSchema({
    ...properties, inventory_verified: {
      ...properties.inventory_verified, defaultValue: 'Yes' }
  }), /Inventory Verified to optional with default No/);
  assert.throws(() => mod.validateSchema({
    ...properties, inventory_verified: {
      ...properties.inventory_verified, required:true }
  }), /Inventory Verified to optional with default No/);
  assert.throws(() => mod.validateSchema({
    ...properties, warehouse_disposition: {
      ...properties.warehouse_disposition, defaultValue: 'Voided' }
  }), /Warehouse Disposition to optional with default Active/);
  assert.throws(() => mod.validateSchema({
    ...properties, warehouse_disposition: {
      ...properties.warehouse_disposition, required:true }
  }), /Warehouse Disposition to optional with default Active/);

  const full = { name: 'full.jpg', size: 1000,
    lastModified: 1, type: 'image/jpeg' };
  const label = { name: 'label.jpg', size: 400,
    lastModified: 2, type: 'image/jpeg' };
  const extra = { name: 'edge.jpg', size: 800,
    lastModified: 3, type: 'image/jpeg' };
  assert.equal(mod.distinctFiles(full, label), true);
  assert.equal(mod.distinctFiles(full, full), false);

  const base = {
    requestId: 'request-001', previousMode: 'none',
    newJob: 'Johnson Kitchen', previousJob: '',
    missingLabel: false, labelReason: '', notes: 'Take carefully'
  };
  const schema = mod.validateSchema(properties);
  const entry = mod.buildEntry(makeMaster({
      parent_slab_id:'PARENT-123'
    }), base,
    ['file-one', 'file-two'], schema, 'request-001');
  assert.equal(entry.old_job.value, 'N/A');
  assert.equal(entry.new_job.value, 'Johnson Kitchen');
  assert.equal(entry.inventory_status.value, 'Out');
  assert.equal(entry.master_record_id.value, '123');
  for (const protectedField of ['inventory_verified',
    'warehouse_disposition', 'peter_notification',
    'parent_slab_id', 'ZMID', 'current_placement']) {
    assert.ok(!(protectedField in entry),
      'Do not submit owner-only field: ' + protectedField);
  }
  assert.equal(entry.warehouse_label_status.value, 'Present');
  assert.equal(entry.exact_picture.value.length, 2);
  assert.equal(entry.in_out_note.value, 'Take carefully');
  assert.equal(entry.warehouse_request_id.value, 'request-001');
  // Optional lookup/computed/secondary metadata remains linked through
  // master_record_id instead of being guessed as API-editable.
  for (const code of ['color_combined', 'zmv_num',
    'length_2', 'width_2', 'parent_slab_id']) {
    assert.ok(!(code in entry), 'Never write optional possibly mapped field: '+code);
  }
  for(const bad of ['purchase_price', 'vendor', 'entry_id',
    'move_complete', 'example_picture', 'notes']) {
    assert.ok(!(bad in entry), 'Must not write existing field: ' + bad);
  }
  assert.throws(() => mod.buildEntry(makeMaster(),
    {...base, previousMode:''}, ['a','b'],schema,'request-1'), /Choose whether/);
  assert.throws(() => mod.buildEntry(makeMaster(),
    {...base, newJob:''}, ['a','b'],schema,'request-1'), /job receiving/);
  assert.throws(() => mod.buildEntry(makeMaster(),
    {...base, notes:'x'.repeat(256)}, ['a','b'],schema,'request-1'), /255/);

  const unknown = mod.buildEntry(makeMaster(),
    {...base, previousMode:'unknown', missingLabel:true,
      labelReason:'Sticker missing, alternate photo is of the corner'},
    ['file-one','file-two'],schema,'request-002');
  assert.equal(unknown.old_job.value, 'UNKNOWN - REVIEW');
  assert.equal(unknown.warehouse_label_status.value, 'Missing');
  assert.match(unknown.warehouse_label_note.value, /Sticker missing/);
  assert.throws(() => mod.buildEntry(makeMaster(),
    {...base, missingLabel:true}, ['file-one','file-two'],schema,'request-2'),
    /Explain why/);
  assert.throws(() => mod.buildEntry(makeMaster({material:'Dolomite'}),
    base,['a','b'],schema,'request-2'), /not an allowed App 15 option/);
  assert.throws(() => mod.buildEntry(makeMaster({finish:'Matte'}),
    base,['a','b'],schema,'request-2'), /not an allowed App 15 option/);
  assert.throws(() => mod.buildEntry(makeMaster({rack:''}),
    base,['a','b'],schema,'request-2'), /has no rack/);
  assert.throws(() => mod.buildEntry(makeMaster({inventory_status:'Out'}),
    base,['a','b'],schema,'request-2'), /no longer marked In/);

  // Legacy blank verification and verified/voided entries must not block.
  pendingEntries = [{
    master_record_id:{value:'123'}, inventory_status:{value:'Out'},
    inventory_verified:{value:'No'}, warehouse_disposition:{value:'Active'}
  },{
    master_record_id:{value:'55'}, inventory_status:{value:'Out'},
    inventory_verified:{value:'Yes'}, warehouse_disposition:{value:'Active'}
  },{
    master_record_id:{value:'57'}, inventory_status:{value:'Out'},
    inventory_verified:{value:'No'}, warehouse_disposition:{value:'Voided'}
  },{
    master_record_id:{value:'89'}, inventory_status:{value:'Out'},
    inventory_verified:{value:''}, warehouse_disposition:{value:''}
  }];
  const pending = await mod.pendingForIds([123,55,57,89]);
  assert.equal(pending.has('123'), true);
  assert.equal(pending.has('55'), false);
  assert.equal(pending.has('57'), false);
  assert.equal(pending.has('89'), false);
  pendingEntries = [];

  // One OUT entry, with exactly two required uploads plus optional photo.
  assert.equal(await mod.findSubmittedRequest('request-001'), '');
  const before = previousCalls();
  const done = await mod.submit(makeMaster(), base,
    { full, label, extra:[extra] }, () => {});
  assert.equal(done.id, '5001');
  assert.equal(done.existing, false);
  assert.equal(uploadCount, 3);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].recipient, 'peter-validated');
  assert.equal(entryRecords.length, 1);
  assert.equal(entryRecords[0].inventory_verified.value, 'No');
  assert.equal(entryRecords[0].warehouse_disposition.value, 'Active');
  assert.equal(entryRecords[0].peter_notification.value[0].code,
    'peter-validated');
  const posts = calls.slice(before).filter(x => x.method==='POST');
  assert.equal(posts.length, 1, 'Exactly one API record POST allowed');
  assert.equal(posts[0].data.app, 15);
  assert.deepEqual(Array.from(posts[0].data.record.exact_picture.value)
    .map(v=>v.fileKey),
    ['verified-file-key-1','verified-file-key-2','verified-file-key-3']);
  const repeated = await mod.submit(makeMaster(), base,
    { full, label, extra:[] });
  assert.equal(repeated.existing, true);
  assert.equal(entryRecords.length, 1, 'Request ID should deduplicate a retry');
  assert.equal(uploadCount, 3, 'Duplicate request never uploads again');

  // Genuine new request for pending master fails before uploading a photo.
  pendingEntries = [{
    master_record_id:{value:'123'}, inventory_status:{value:'Out'},
    inventory_verified:{value:'No'}, warehouse_disposition:{value:'Active'}
  }];
  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-other'},
    {full,label,extra:[]}), /unverified OUT/);
  assert.equal(uploadCount, 3);
  pendingEntries = [];

  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-blank',previousMode:''},
    {full,label}), /Choose whether/);
  assert.equal(uploadCount, 3);
  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-same'}, {full,label:full}), /two different photos/);
  assert.equal(uploadCount, 3);

  // Network POST succeeded but confirmation was lost: find idempotency key.
  apiPostMode = 'ambiguous';
  const ambiguous = await mod.submit(makeMaster(),
    {...base, requestId:'request-ambiguous'}, {full,label});
  assert.equal(ambiguous.existing, true);
  assert.equal(ambiguous.id, '5002');
  assert.equal(entryRecords.length, 2);
  assert.equal(notifications.length, 2);

  // Network POST definitely has no retrievable success; never automatically
  // perform another POST and warn the user against a blind resubmission.
  apiPostMode = 'reject';
  const beforeRejected = calls.filter(x => x.method==='POST').length;
  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-failed'}, {full,label}),
    /Do NOT submit again/);
  assert.equal(calls.filter(x => x.method==='POST').length,
    beforeRejected+1, 'Do not retry POST after ambiguous result');

  // If Master changed while the crew was taking photos, prevent submitting
  // stale rack/condition/job data. Re-read happens before photo uploads.
  currentMaster = makeMaster({ rack: 'Z-9A' });
  const uploadsBeforeStale = uploadCount;
  await assert.rejects(mod.submit(makeMaster(),
    {...base,requestId:'request-stale'}, {full,label}),
    /Master data changed/);
  assert.equal(uploadCount, uploadsBeforeStale);
  currentMaster = makeMaster();

  // Defaults may change after the view loaded. The final preflight must
  // fetch the current schema and stop before photo upload or record POST.
  const uploadsBeforeDefaultDrift = uploadCount;
  const postsBeforeDefaultDrift = calls.filter(x => x.method==='POST').length;
  properties.inventory_verified.defaultValue = 'Yes';
  await assert.rejects(mod.submit(makeMaster(),
    {...base,requestId:'request-bad-verification-default'}, {full,label}),
    /Inventory Verified to optional with default No/);
  properties.inventory_verified.defaultValue = 'No';
  properties.warehouse_disposition.defaultValue = 'Voided';
  await assert.rejects(mod.submit(makeMaster(),
    {...base,requestId:'request-bad-disposition-default'}, {full,label}),
    /Warehouse Disposition to optional with default Active/);
  properties.warehouse_disposition.defaultValue = 'Active';
  properties.peter_notification.defaultValue = [];
  await assert.rejects(mod.submit(makeMaster(),
    {...base,requestId:'request-no-owner-default'}, {full,label}),
    /Peter Notification must default to one specific USER/);
  properties.peter_notification.defaultValue = [
    {code:'peter-validated',type:'USER'}
  ];
  assert.equal(uploadCount, uploadsBeforeDefaultDrift,
    'Unsafe default change must not trigger any photos being uploaded');
  assert.equal(calls.filter(x => x.method==='POST').length, postsBeforeDefaultDrift,
    'Unsafe default change must not create an OUT record');

  // If unable to check pending state, no uploads or submissions happen.
  apiReadEnabled = false;
  const uploadsBefore = uploadCount;
  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-denied'}, {full,label}),
    /Kintone permissions/);
  assert.equal(uploadCount, uploadsBefore);
  apiReadEnabled = true;

  // The real frozen pilot config can load the modal with the verified
  // ZMP login, but may not issue ANY network request, upload, or OUT POST.
  const previewHandlers = [];
  const previewEnv = {
    window: previewConfigEnv.window,
    kintone: {
      getLoginUser() { return { code: 'zmproduction' }; },
      events: { on(names) { previewHandlers.push(names); } },
      api() { throw new Error('PREVIEW MUST NEVER CALL KINTONE API'); }
    }
  };
  vm.runInNewContext(script, previewEnv);
  assert.equal(previewHandlers.length, 1,
    'Correct employee should see the single-record preview module');
  const noWrite = previewEnv.window.ZM_WAREHOUSE_OUT_DRAFT;
  assert.ok(noWrite);
  await assert.rejects(noWrite.submit(makeMaster({'$id':'8160'}), {
    requestId:'preview-only-test'
  }, {}), /Preview only/);

  // Live testing removes the temporary employee + Master restrictions.
  // A signed-in owner account may use a different staged record.
  const liveRegistered = [];
  const liveEnv = {
    window:liveConfigContext.window,
    kintone:{
      getLoginUser(){return {code:'warehouse-owner'};},
      events:{on(names){liveRegistered.push(names);}}
    }
  };
  vm.runInNewContext(script,liveEnv);
  assert.equal(liveRegistered.length,1);
  const liveMod = liveEnv.window.ZM_WAREHOUSE_OUT_DRAFT;
  assert.ok(liveMod);
  const liveEntry = liveMod.buildEntry(makeMaster({'$id':'8765'}),
    base,['photo-one','photo-two'],schema,'live-8765');
  assert.equal(liveEntry.master_record_id.value,'8765');
  const anotherLiveEntry = liveMod.buildEntry(makeMaster({'$id':'9999'}),
    base,['photo-one','photo-two'],schema,'live-9999');
  assert.equal(anotherLiveEntry.master_record_id.value,'9999');
  // Live mode still needs an explicit write-enable value; no accidental
  // activation with mode:'live' and submissionsEnabled:false.
  const noWriteRegistered=[];
  vm.runInNewContext(script,{
    window:{ZM_WAREHOUSE_OUT_CONFIG:{
      enabled:true,ownerValidatedPermissions:true,mode:'live',
      submissionsEnabled:false
    }},
    kintone:{
      getLoginUser(){return {code:'warehouse-owner'};},
      events:{on(names){noWriteRegistered.push(names);}}
    }
  });
  assert.equal(noWriteRegistered.length,0);

  // With the opt-in flag missing, addon is inert even if script is installed.
  const disabledRegistrations = [];
  const inert = {
    window: { ZM_WAREHOUSE_OUT_CONFIG: { enabled:false,
      ownerValidatedPermissions:true } },
    kintone: {events: {on(x) { disabledRegistrations.push(x); }}}
  };
  vm.runInNewContext(script, inert);
  assert.equal(disabledRegistrations.length, 0);
  assert.equal(inert.window.ZM_WAREHOUSE_OUT_DRAFT, undefined);

  // An incomplete pilot, incorrect account, or invalid record ID must be inert.
  const badPilotConfigs = [
    {pilotMasterRecordId:'123', pilotUserCode:'not-the-employee'},
    {pilotMasterRecordId:'123', pilotUserCode:''},
    {pilotMasterRecordId:'', pilotUserCode:'crew-test-user'},
    {pilotMasterRecordId:'invalid', pilotUserCode:'crew-test-user'}
  ];
  for (const pilot of badPilotConfigs) {
    const registered = [];
    const context = {
      window:{ZM_WAREHOUSE_OUT_CONFIG:{
        enabled:true,ownerValidatedPermissions:true,...pilot
      }},
      kintone:{
        getLoginUser(){return {code:'crew-test-user'};},
        events:{on(names){registered.push(names);}}
      }
    };
    vm.runInNewContext(script,context);
    assert.equal(registered.length,0);
    assert.equal(context.window.ZM_WAREHOUSE_OUT_DRAFT,undefined);
  }

  // Large iPhone/Android camera photos are resized/encoded before App 15
  // uploads. Small files and an explicit original-quality override are untouched.
  const photoSizes = [];
  const revoked = [];
  let createCount = 0, whiteBackgroundCount = 0;
  let brokenCanvas = false;
  const fakeCanvas = {
    width: 0, height: 0,
    getContext() {
      return {
        set fillStyle(_color) {},
        fillRect() { whiteBackgroundCount++; },
        drawImage() { photoSizes.push([fakeCanvas.width, fakeCanvas.height]); }
      };
    },
    toBlob(callback, format, quality) {
      if (brokenCanvas) return callback(null);
      assert.equal(format, 'image/jpeg');
      callback({ type:'image/jpeg', size:Math.round(2000000 * quality) });
    }
  };
  class PhotoFile {
    constructor(parts,name,options) {
      this.name=name;
      this.size=parts.reduce((acc,blob)=>acc+blob.size,0);
      this.type=options.type;
      this.lastModified=options.lastModified;
    }
  }
  class PhoneImage {
    constructor() { this.naturalWidth=4032; this.naturalHeight=3024; }
    set src(value) { if (value && this.onload) this.onload(); }
  }
  const photoEnv = {
    window: { ZM_WAREHOUSE_OUT_CONFIG: {
      enabled:true, ownerValidatedPermissions:true,
      pilotMasterRecordId:'123', pilotUserCode:'crew-test-user',
      pilotSubmitEnabled:true
    } },
    kintone: {
      getLoginUser() { return {code:'crew-test-user'}; },
      events: { on() {} }
    },
    Image:PhoneImage,
    File:PhotoFile,
    URL:{
      createObjectURL() { createCount++; return 'blob:mock-test'; },
      revokeObjectURL(value) { revoked.push(value); }
    },
    document: {
      createElement(tag) { assert.equal(tag,'canvas'); return fakeCanvas; }
    }
  };
  vm.runInNewContext(script,photoEnv);
  const optimize = photoEnv.window.ZM_WAREHOUSE_OUT_DRAFT.optimizePhoto;
  assert.equal(typeof optimize, 'function');
  const phoneShot = {name:'mobile-camera.heic',size:9*1024*1024,
    type:'image/heic',lastModified:4567};
  const fullOptimized = await optimize(phoneShot,'FULL_PIECE');
  assert.equal(fullOptimized.name,'mobile-camera_optimized.jpg');
  assert.equal(fullOptimized.type,'image/jpeg');
  assert.equal(fullOptimized.lastModified,4567);
  assert.ok(fullOptimized.size < phoneShot.size / 3);
  assert.deepEqual(photoSizes[0],[2048,1536]);
  assert.ok(whiteBackgroundCount > 0);
  assert.equal(revoked.length,1,'Remove mobile source blob URL after resize');
  const labelOptimized = await optimize(phoneShot,'IDENTIFYING_LABEL');
  assert.equal(labelOptimized.type,'image/jpeg');
  assert.deepEqual(photoSizes.at(-1),[2560,1920],
    'Preserve extra pixels for labels and tiny markings');
  assert.equal(await optimize(phoneShot,'FULL_PIECE',true),phoneShot,
    'Original-quality override must skip image transcoding');
  const smallPhoto = {name:'small.jpg',size:250000,
    type:'image/jpeg',lastModified:1};
  assert.equal(await optimize(smallPhoto,'FULL_PIECE'),smallPhoto,
    'Avoid worsening already-small evidence files');
  const video = {name:'clip.mp4',size:8000000,
    type:'video/mp4',lastModified:1};
  assert.equal(await optimize(video,'FULL_PIECE'),video,
    'Never attempt to transcode videos using image canvas');
  const beforeBroken = revoked.length;
  brokenCanvas = true;
  assert.equal(await optimize(phoneShot,'FULL_PIECE'),phoneShot,
    'Keep the photo if mobile canvas encoding fails');
  assert.equal(revoked.length,beforeBroken+1,
    'Release object URLs even after encoding failure');
  assert.equal(createCount,revoked.length);
  brokenCanvas = false;

  console.log('Warehouse OUT draft: single-employee single-record pilot guard, protected-default schema preflight, ' +
    'no crew POST of owner-only fields, 2 required photos, Missing Label, unique request IDs, ' +
    'pending/void exclusion, retry safety, notification user and App 15 only: PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
