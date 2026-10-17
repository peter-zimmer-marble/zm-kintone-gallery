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
const root = {
  dataset: {},
  innerHTML: '',
  addEventListener() {},
  querySelector(selector) {
    const match = selector.match(/^\[data-slot="([^"]+)"\]$/);
    return match ? slots[match[1]] : null;
  },
  querySelectorAll() { return []; },
  contains() { return false; }
};
const registrations = [];
const requests = [];
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
  exact_picture: { value: [] },
  example_picture: { value: [] }
};
async function get(url, method, data) {
  assert.equal(method, 'GET', 'Warehouse staging must not write to Kintone');
  assert.equal(data.app, 6);
  requests.push(data);
  return { records: [inputRecord] };
}
get.url = path => path;
const env = {
  console,
  kintone: {
    events: { on(types, callback) { registrations.push({ types, callback }); } },
    api: get
  },
  document: {
    addEventListener() {},
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
  for (const restricted of [
    'purchase_price', 'cost', 'vendor', 'rough_base_price',
    'sale_base_price', 'purchase_notes', 'po_num'
  ]) {
    assert.ok(!requests[0].fields.includes(restricted), 'Unexpected private field: ' + restricted);
  }
  assert.match(slots.results.innerHTML, /Blue Dunes V1/);
  assert.match(slots.results.innerHTML, /Johnson Kitchen/);
  assert.match(slots.results.innerHTML, /Z-5A/);
  assert.match(slots.results.innerHTML, /\/k\/6\/show#record=1240/);
  assert.equal(slots.count.textContent, '1 matching piece');
  console.log('Warehouse Staging v1: syntax, view isolation, safe GET, filters, and rendering passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
