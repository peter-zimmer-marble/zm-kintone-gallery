// Dependency-free mocked contract tests for opt-in Warehouse OUT draft.
// Never call a real Kintone site, send actual uploads, or touch App 6.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('zm-warehouse-out-v1.js', 'utf8');
new vm.Script(script, { filename: 'zm-warehouse-out-v1.js' });

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
  base.peter_notification = { type: 'USER_SELECT',
    defaultValue: [{ code: 'peter-validated', type: 'USER' }] };
  base.master_record_id = { type: 'NUMBER' };
  base.warehouse_request_id = {
    type: 'SINGLE_LINE_TEXT', unique: true
  };
  base.warehouse_disposition = {
    type: 'DROP_DOWN', options: {
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
let activeCode = 'peter-validated';
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
    return { records: [makeMaster()] };
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
    assert.equal(data.record.inventory_verified.value, 'No');
    assert.equal(data.record.peter_notification.value[0].code, activeCode);
    if (apiPostMode === 'reject') throw new Error('Server timeout');
    const id = String(nextId++);
    entryRecords.push({
      ...data.record,
      $id: { value: id }
    });
    notifications.push(id); // a single App 15 creation notification
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
  enabled: true, ownerValidatedPermissions: true
};
const env = {
  window: {
    ZM_WAREHOUSE_OUT_CONFIG: config,
    crypto: { randomUUID() { return 'uuid-valid-draft'; } }
  },
  kintone: {
    events: { on(names, callback) { eventHandlers.push([names, callback]); } },
    api,
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
  let data = mod.validateSchema(properties);
  assert.equal(data.peterUserCode, 'peter-validated');
  activeCode = 'peter-owner-confirmed';
  config.peterUserCode = activeCode;
  data = mod.validateSchema(properties);
  assert.equal(data.peterUserCode, activeCode);
  delete config.peterUserCode;
  activeCode = 'peter-validated';

  const noUnique = { ...properties, warehouse_request_id: {
    type: 'SINGLE_LINE_TEXT', unique: false
  }};
  assert.throws(() => mod.validateSchema(noUnique), /prohibit duplicate values/);
  const noVoid = { ...properties, warehouse_disposition: {
    type: 'DROP_DOWN', options: { active: { label: 'Active' } }
  }};
  assert.throws(() => mod.validateSchema(noVoid), /Voided/);
  const noLabel = { ...properties, warehouse_label_note: undefined };
  assert.throws(() => mod.validateSchema(noLabel), /warehouse_label_note/);
  const defaultsNotPeter = { ...properties, peter_notification: {
    type: 'USER_SELECT', defaultValue: [{type:'FUNCTION',code:'LOGINUSER()'}]
  }};
  assert.throws(() => mod.validateSchema(defaultsNotPeter), /Confirm the Peter Notification/);

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
  const entry = mod.buildEntry(makeMaster(), base,
    ['file-one', 'file-two'], schema, 'request-001');
  assert.equal(entry.old_job.value, 'N/A');
  assert.equal(entry.new_job.value, 'Johnson Kitchen');
  assert.equal(entry.inventory_status.value, 'Out');
  assert.equal(entry.inventory_verified.value, 'No');
  assert.equal(entry.master_record_id.value, '123');
  assert.equal(entry.warehouse_disposition.value, 'Active');
  assert.equal(entry.warehouse_label_status.value, 'Present');
  assert.equal(entry.exact_picture.value.length, 2);
  assert.equal(entry.in_out_note.value, 'Take carefully');
  assert.equal(entry.warehouse_request_id.value, 'request-001');
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
  assert.equal(entryRecords.length, 1);
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

  // If unable to check pending state, no uploads or submissions happen.
  apiReadEnabled = false;
  const uploadsBefore = uploadCount;
  await assert.rejects(mod.submit(makeMaster(),
    {...base, requestId:'request-denied'}, {full,label}),
    /Kintone permissions/);
  assert.equal(uploadCount, uploadsBefore);
  apiReadEnabled = true;

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

  console.log('Warehouse OUT draft: opt-in guard, schema preflight, safe ' +
    'field mapping, 2 required photos, Missing Label, unique request IDs, ' +
    'pending/void exclusion, retry safety, notification user and App 15 only: PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
