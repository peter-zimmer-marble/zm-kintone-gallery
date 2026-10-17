// Dependency-free smoke tests for Warehouse Staging v1.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('zm-warehouse-staging-v1.js', 'utf8');
new vm.Script(source, { filename: 'zm-warehouse-staging-v1.js' });

const slots = {
  results: { innerHTML: '' },
  count: { textContent: '' },
  summary: { textContent: '' }
};
const downloadedImages = [];
const downloadRequests = [];
const thumb = {
  dataset: { id: '1240', primary: 'missing-file', fallback: 'good-file' },
  textContent: 'Loading photo…',
  classList: { add(value) { assert.equal(value, 'zmws-photo-ready'); } },
  appendChild(child) { downloadedImages.push(child); }
};
const root = {
  dataset: {},
  innerHTML: '',
  addEventListener() {},
  querySelector(selector) {
    const match = selector.match(/^\[data-slot="([^"]+)"\]$/);
    return match ? slots[match[1]] : null;
  },
  querySelectorAll(selector) {
    if (selector === '.zmws-photo[data-primary]' &&
        slots.results.innerHTML.includes('data-primary="missing-file"')) return [thumb];
    return [];
  },
  contains(item) { return item === thumb; }
};
const registrations = [];
const requests = [];
let notesRestricted = false;
let mockRecords = [];
const inputRecord = {
  $id: { value: '1240' },
  color: { value: 'Blue Dunes' },
  color_combined: { value: 'Blue Dunes V1' },
  zmv_num: { value: 'V1' },
  type: { value: 'Stock Slab' },
  shape: { value: 'Rectangle' },
  length: { value: '120' },
  width: { value: '64' },
  rack: { value: 'Z-5A' },
  job: { value: 'Johnson Kitchen' },
  sale_status: { value: 'SOLD' },
  staging_status: { value: 'RTS' },
  in_out_note: { value: 'Do not stack & keep upright.\nHandle <carefully>.' },
  exact_picture: {
    value: [{ fileKey: 'missing-file', contentType: 'image/jpeg', name: 'missing.jpg' }]
  },
  example_picture: {
    value: [{ fileKey: 'good-file', contentType: 'image/png', name: 'sample.png' }]
  }
};
mockRecords = [inputRecord];
async function get(url, method, data) {
  assert.equal(method, 'GET', 'Warehouse staging must not write to Kintone');
  assert.equal(data.app, 6);
  requests.push(data);
  if (notesRestricted && data.fields.includes('in_out_note')) {
    throw new Error('In/Out Notes field is restricted');
  }
  const after = data.query.match(/\$id > (\d+)/);
  const limit = data.query.match(/limit (\d+)/);
  assert.ok(limit, 'Staging API requests must include Kintone batch limit');
  const records = mockRecords.filter(record =>
    !after || Number(record.$id.value) > Number(after[1]))
    .sort((a, b) => Number(a.$id.value) - Number(b.$id.value))
    .slice(0, Number(limit[1]));
  return { records };
}
get.url = path => path;
class FakeXMLHttpRequest {
  headers = {};
  open(method, url, async) {
    this.method = method;
    this.url = url;
    assert.equal(async, true);
  }
  setRequestHeader(name, value) { this.headers[name] = value; }
  send() {
    downloadRequests.push(this);
    // Exercise the fallback: first Exact photo fails, then Example photo succeeds.
    Promise.resolve().then(() => {
      this.status = this.url.includes('missing-file') ? 403 : 200;
      this.response = this.status === 200 ? { type: 'image/png' } :
        { type: 'application/json' };
      this.onload();
    });
  }
  abort() { if (this.onabort) this.onabort(); }
}
const env = {
  console,
  XMLHttpRequest: FakeXMLHttpRequest,
  URL: {
    createObjectURL(blob) {
      assert.equal(blob.type, 'image/png');
      return 'blob:verified-kintone-photo';
    },
    revokeObjectURL() {}
  },
  kintone: {
    events: { on(types, callback) { registrations.push({ types, callback }); } },
    api: get
  },
  document: {
    addEventListener() {},
    createElement(name) { return { tagName: name }; },
    getElementById(name) { return name === 'zm-warehouse-staging-root' ? root : null; }
  }
};
vm.runInNewContext(source, env, { filename: 'zm-warehouse-staging-v1.js' });

assert.equal(registrations.length, 1);
assert.deepEqual(Array.from(registrations[0].types),
  ['app.record.index.show', 'mobile.app.record.index.show']);
const handler = registrations[0].callback;
const original = { appId: 6, viewName: 'Staging Sheet', viewType: 'list' };
assert.equal(handler(original), original, 'Existing Staging Sheet must be untouched');
assert.equal(requests.length, 0);

(async () => {
  const event = {
    appId: 6, viewName: 'Warehouse Staging',
    viewType: 'custom', type: 'app.record.index.show'
  };
  assert.equal(handler(event), event);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1, 'One paginated GET expected');
  const query = requests[0].query;
  assert.match(query, /staging_status in \("RTS", "View Staging"\)/);
  assert.match(query, /inventory_status in \("", "In"\)/);
  assert.match(query, /sale_status in \("", "Avl", "SOLD", "Hold"\)/);
  assert.match(query, /color not like "NO VALUE"/);
  assert.match(query, /order by \$id asc limit 500/);
  assert.ok(requests[0].fields.includes('job'));
  assert.ok(requests[0].fields.includes('exact_picture'));
  assert.ok(requests[0].fields.includes('in_out_note'),
    'Read existing Master In/Out Notes alongside staged piece information');
  for (const restricted of [
    'purchase_price', 'cost', 'vendor', 'rough_base_price',
    'sale_base_price', 'purchase_notes', 'po_num'
  ]) {
    assert.ok(!requests[0].fields.includes(restricted), 'Unexpected private field: ' + restricted);
  }
  assert.match(slots.results.innerHTML, /Blue Dunes V1/);
  assert.match(slots.results.innerHTML, /Johnson Kitchen/);
  assert.match(slots.results.innerHTML, /Z-5A/);
  assert.match(slots.results.innerHTML, /IN \/ OUT NOTES/);
  assert.match(slots.results.innerHTML,
    /Do not stack &amp; keep upright\.\s*Handle &lt;carefully&gt;\./);
  assert.ok(!slots.results.innerHTML.includes('<carefully>'),
    'Staff-entered notes must be safely escaped');
  assert.match(slots.results.innerHTML, /\/k\/6\/show#record=1240/);
  assert.equal(slots.count.textContent, 'All 1 staged piece displayed');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(downloadRequests.length, 2,
    'A failed Exact photo should fall back to the next attached Example image');
  for (const xhr of downloadRequests) {
    assert.equal(xhr.method, 'GET');
    assert.equal(xhr.responseType, 'blob');
    assert.equal(xhr.headers['X-Requested-With'], 'XMLHttpRequest',
      'Kintone file requests must send X-Requested-With');
    assert.match(xhr.url, /^\/k\/v1\/file\.json\?fileKey=/,
      'Use Kintone API URL rather than generic relative fetch');
  }
  assert.equal(downloadedImages.length, 1);
  assert.equal(downloadedImages[0].tagName, 'img');
  assert.equal(downloadedImages[0].src, 'blob:verified-kintone-photo');
  notesRestricted = true;
  handler(event);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(requests.length >= 4, 'Retry after a note-field permission error');
  assert.ok(!requests[requests.length - 1].fields.includes('in_out_note'),
    'Preserve read-only staging when field permissions hide In/Out Notes');
  assert.match(slots.results.innerHTML, /In\/Out Notes could not be loaded/);
  assert.match(slots.results.innerHTML, /Blue Dunes V1/);

  // More than the old 48-item display cutoff: every piece must appear without
  // a Show More control. These synthetic cards have no photos.
  notesRestricted = false;
  function stagedRecords(quantity) {
    return Array.from({ length: quantity }, (_, i) => ({
      ...inputRecord,
      $id: { value: String(i + 1) },
      color_combined: { value: 'Test Staging Piece ' + (i + 1) },
      exact_picture: { value: [] },
      example_picture: { value: [] }
    }));
  }
  mockRecords = stagedRecords(55);
  const before55 = requests.length;
  handler(event);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length - before55, 1);
  assert.equal(slots.count.textContent, 'All 55 staged pieces displayed');
  assert.match(slots.results.innerHTML, /Test Staging Piece 1<\/h3>/);
  assert.match(slots.results.innerHTML, /Test Staging Piece 55<\/h3>/);
  assert.equal((slots.results.innerHTML.match(/class="zmws-card"/g) || []).length, 55);
  assert.ok(!slots.results.innerHTML.includes('Show more'),
    'Warehouse staging must not hide pieces behind pagination');

  // More than Kintone's 500-record GET batch size: pagination must collect
  // every page before rendering, and render all 501 cards.
  mockRecords = stagedRecords(501);
  const before501 = requests.length;
  handler(event);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length - before501, 2,
    '501 pieces should require two Kintone GET requests of 500 + 1');
  assert.equal(slots.count.textContent, 'All 501 staged pieces displayed');
  assert.match(slots.results.innerHTML, /Test Staging Piece 501<\/h3>/);
  assert.equal((slots.results.innerHTML.match(/class="zmws-card"/g) || []).length, 501);
  assert.ok(!slots.results.innerHTML.includes('Show more'));

  console.log('Warehouse Staging v1: all 55/501 records visible without Show More, ' +
    'complete Kintone pagination, photo XHR, notes display/escaping, ' +
    'permissions fallback, safe GET, view isolation and rendering passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
