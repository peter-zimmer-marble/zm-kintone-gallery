/*
 * Zimmer Marble - Warehouse OUT v1 (DRAFT; disabled by default)
 *
 * Add only after the existing read-only Warehouse Staging v1 code. This module
 * is inert until an administrator explicitly provides the configuration below.
 * It never modifies App 6 and never stores credentials/API tokens.
 *
 * window.ZM_WAREHOUSE_OUT_CONFIG = {
 *   enabled: true,
 *   ownerValidatedPermissions: true,
 *   peterUserCode: 'CONFIRMED_KINTONE_LOGIN_CODE' // or single USER default
 * };
 *
 * The enabled switch and permissions acknowledgement are not security
 * boundaries. Set actual App 15 add/read/edit and field permissions in Kintone.
 * DO NOT activate for the crew without validating all required new fields,
 * owner-only Void, and an end-to-end mobile test.
 */
(function () {
  'use strict';

  const config = window.ZM_WAREHOUSE_OUT_CONFIG || {};
  if (config.enabled !== true || config.ownerValidatedPermissions !== true) return;

  const MASTER_APP = 6;
  const ENTRY_APP = 15;
  const VIEW = 'Warehouse Staging';
  const MASTER_FIELDS = Object.freeze([
    '$id', 'color', 'color_combined', 'zmv_num', 'stock_id',
    'thickness', 'finish', 'shape', 'length', 'width', 'length_2',
    'width_2', 'rack', 'job', 'material', 'inventory_status',
    'staging_status', 'type'
  ]);
  const REQUIRED_ENTRY_FIELDS = Object.freeze([
    'color', 'thickness', 'inventory_status', 'finish',
    'new_job', 'peter_notification', 'rack', 'shape', 'length',
    'old_job', 'material', 'width'
  ]);
  const EXTRA_FIELDS = Object.freeze({
    master_record_id: 'NUMBER',
    warehouse_request_id: 'SINGLE_LINE_TEXT',
    warehouse_disposition: 'DROP_DOWN',
    warehouse_label_status: 'DROP_DOWN',
    warehouse_label_note: 'MULTI_LINE_TEXT',
    exact_picture: 'FILE'
  });
  const STATUS = Object.freeze({ active: 'Active', voided: 'Voided' });

  let root = null;
  let observer = null;
  let firstCard = null;
  let pendingRequestVersion = 0;
  let busy = false;
  let modal = null;
  let formSchemaPromise = null;
  let pendingIds = new Set();
  let pendingError = '';
  let isChecking = true;

  function str(value) {
    return value == null ? '' : String(value);
  }
  function txt(value) { return str(value).trim(); }
  function val(record, field) {
    return record && record[field] && record[field].value !== undefined
      ? record[field].value : '';
  }
  function esc(value) {
    return str(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function readValue(record, field) { return txt(val(record, field)); }
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }
  function dropdownHas(field, option) {
    return field && field.options &&
      Object.values(field.options).some(item => item.label === option);
  }
  function validateSchema(properties) {
    assert(properties && typeof properties === 'object',
      'App 15 field definitions could not be read.');
    for (const code of REQUIRED_ENTRY_FIELDS) {
      assert(properties[code],
        'App 15 is missing the required "' + code + '" field.');
    }
    for (const [code, type] of Object.entries(EXTRA_FIELDS)) {
      assert(properties[code] && properties[code].type === type,
        'App 15 needs field "' + code + '" with type ' + type +
        ' before mobile OUT can be enabled.');
    }
    assert(properties.warehouse_request_id.unique === true,
      'Set warehouse_request_id to prohibit duplicate values in App 15.');
    for (const status of Object.values(STATUS)) {
      assert(dropdownHas(properties.warehouse_disposition, status),
        'Add the ' + status + ' choice to warehouse_disposition.');
    }
    for (const label of ['Present', 'Missing']) {
      assert(dropdownHas(properties.warehouse_label_status, label),
        'Add the ' + label + ' choice to warehouse_label_status.');
    }
    assert(properties.peter_notification.type === 'USER_SELECT',
      'Peter Notification must remain a User selection field.');
    const configuredUser = txt(config.peterUserCode);
    const defaults = properties.peter_notification.defaultValue;
    const defaultUser = Array.isArray(defaults) && defaults.length === 1 &&
      defaults[0].type === 'USER' ? txt(defaults[0].code) : '';
    const peterUserCode = configuredUser || defaultUser;
    assert(peterUserCode && peterUserCode !== 'LOGINUSER()',
      'Confirm the Peter Notification Kintone user code (or a single USER default) before writing.');
    return { properties, peterUserCode };
  }

  function verifyAllowedMasterValues(master, props) {
    for (const code of ['color', 'thickness', 'finish', 'shape',
      'rack', 'length', 'material', 'width']) {
      assert(readValue(master, code), 'Master #' + readValue(master, '$id') +
        ' has no ' + code + '. Correct this before submitting OUT.');
    }
    for (const code of ['length', 'width']) {
      const n = Number(readValue(master, code));
      assert(Number.isFinite(n) && n > 0,
        'Master ' + code + ' must be a positive number.');
    }
    for (const code of ['thickness', 'finish', 'shape', 'material']) {
      assert(dropdownHas(props[code], readValue(master, code)),
        'Master ' + code + ' "' + readValue(master, code) +
        '" is not an allowed App 15 option. Align the dropdown options; do not substitute values.');
    }
    assert(['RTS', 'View Staging'].includes(readValue(master, 'staging_status')),
      'This piece is no longer in Warehouse Staging. Refresh before pulling.');
    assert(['', 'In'].includes(readValue(master, 'inventory_status')),
      'This piece is no longer marked In. Do not create a second OUT.');
  }

  function makeRequestId() {
    assert(window.crypto && typeof window.crypto.randomUUID === 'function',
      'Secure request ID unavailable; this browser cannot submit safely.');
    return window.crypto.randomUUID();
  }
  function getJobInput(input) {
    const currentJob = txt(input.newJob);
    assert(currentJob, 'Enter the job receiving this piece.');
    assert(currentJob.length <= 255, 'New Job must be 255 characters or fewer.');
    const oldMode = txt(input.previousMode);
    assert(['none', 'known', 'unknown'].includes(oldMode),
      'Choose whether there was a previous job.');
    const oldJob = oldMode === 'none' ? 'N/A' :
      oldMode === 'unknown' ? 'UNKNOWN - REVIEW' : txt(input.previousJob);
    assert(oldJob, 'Enter the previous job name.');
    assert(oldJob.length <= 255, 'Previous Job must be 255 characters or fewer.');
    return { oldJob, currentJob };
  }
  function buildEntry(master, input, keys, schema, requestId) {
    verifyAllowedMasterValues(master, schema.properties);
    const jobs = getJobInput(input);
    assert(Array.isArray(keys) && keys.length >= 2,
      'A full-piece photo and label/alternative photo are required.');
    assert(txt(requestId), 'Movement request ID is required.');
    const missing = input.missingLabel === true;
    const reason = txt(input.labelReason);
    assert(!missing || reason,
      'Explain why the piece has no identifying label.');
    const note = txt(input.notes);
    assert(note.length <= 255,
      'In/Out Notes is currently a single-line Kintone field (maximum 255 characters).');
    const record = {
      master_record_id: { value: readValue(master, '$id') },
      inventory_status: { value: 'Out' },
      inventory_verified: { value: 'No' },
      warehouse_request_id: { value: requestId },
      warehouse_disposition: { value: STATUS.active },
      warehouse_label_status: { value: missing ? 'Missing' : 'Present' },
      warehouse_label_note: { value: missing ? reason : '' },
      peter_notification: { value: [{ code: schema.peterUserCode }] },
      old_job: { value: jobs.oldJob },
      new_job: { value: jobs.currentJob },
      color: { value: readValue(master, 'color') },
      thickness: { value: readValue(master, 'thickness') },
      finish: { value: readValue(master, 'finish') },
      rack: { value: readValue(master, 'rack') },
      shape: { value: readValue(master, 'shape') },
      length: { value: readValue(master, 'length') },
      width: { value: readValue(master, 'width') },
      material: { value: readValue(master, 'material') },
      exact_picture: { value: keys.map(fileKey => ({ fileKey })) }
    };
    if (note) record.in_out_note = { value: note };
    for (const code of ['color_combined', 'zmv_num', 'length_2', 'width_2',
      'parent_slab_id']) {
      if (readValue(master, code) && schema.properties[code]) {
        record[code] = { value: readValue(master, code) };
      }
    }
    // Do not populate or overwrite Move Complete, Master entry_id, Master
    // photos, sale status, or any confidential/financial fields.
    return record;
  }

  async function api(path, method, data) {
    return kintone.api(kintone.api.url(path, true), method, data);
  }
  async function schema() {
    if (!formSchemaPromise) {
      formSchemaPromise = api('/k/v1/app/form/fields.json', 'GET',
        { app: ENTRY_APP }).then(response =>
        validateSchema(response.properties));
    }
    try { return await formSchemaPromise; }
    catch (error) {
      formSchemaPromise = null;
      throw error;
    }
  }
  async function fetchMaster(masterId) {
    assert(/^[1-9]\d*$/.test(str(masterId)), 'Invalid Master record ID.');
    const result = await api('/k/v1/records.json', 'GET', {
      app: MASTER_APP,
      fields: MASTER_FIELDS.slice(),
      query: '$id = ' + masterId + ' limit 1'
    });
    assert(result.records && result.records.length === 1,
      'Could not find Master #' + masterId + '. Please refresh staging.');
    return result.records[0];
  }

  async function queryEntries(query, fields) {
    const results = [];
    let last = 0;
    for (;;) {
      const q = query + (last ? ' and $id > ' + last : '') +
        ' order by $id asc limit 500';
      const result = await api('/k/v1/records.json', 'GET', {
        app: ENTRY_APP, fields, query: q
      });
      const batch = result.records || [];
      results.push(...batch);
      if (batch.length < 500) return results;
      last = Number(readValue(batch[batch.length - 1], '$id'));
      assert(Number.isSafeInteger(last) && last > 0,
        'Could not complete Entry Sheet movement search.');
    }
  }
  async function pendingForIds(ids) {
    const list = [...new Set(ids.map(Number).filter(
      id => Number.isSafeInteger(id) && id > 0))];
    if (!list.length) return new Set();
    const result = new Set();
    for (let i = 0; i < list.length; i += 70) {
      const group = list.slice(i, i + 70);
      const records = await queryEntries(
        'master_record_id in (' + group.join(',') + ')' +
        ' and inventory_status in ("Out")' +
        ' and inventory_verified in ("No")' +
        ' and warehouse_disposition in ("Active")',
        ['$id', 'master_record_id', 'inventory_status',
          'inventory_verified', 'warehouse_disposition']
      );
      for (const record of records) {
        if (readValue(record, 'warehouse_disposition') === STATUS.active &&
            readValue(record, 'inventory_verified') === 'No' &&
            readValue(record, 'inventory_status') === 'Out') {
          result.add(readValue(record, 'master_record_id'));
        }
      }
    }
    return result;
  }
  async function findSubmittedRequest(requestId) {
    const escaped = txt(requestId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const records = await queryEntries(
      'warehouse_request_id = "' + escaped + '"',
      ['$id', 'warehouse_request_id']
    );
    return records.length ? readValue(records[0], '$id') : '';
  }

  async function uploadPhoto(file, name) {
    assert(file && /^image\//i.test(str(file.type)),
      'Please choose an image for ' + name + '.');
    const token = kintone.getRequestToken();
    assert(token, 'Kintone session token unavailable. Sign in again.');
    const data = new FormData();
    data.append('__REQUEST_TOKEN__', token);
    data.append('file', file, name + '_' + (file.name || 'photo.jpg'));
    const response = await fetch(kintone.api.url('/k/v1/file.json', true), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: data
    });
    let payload;
    try { payload = await response.json(); } catch (_) { payload = {}; }
    assert(response.ok && payload.fileKey,
      'Photo upload failed (' + response.status + '). No OUT was submitted.');
    return payload.fileKey;
  }
  function distinctFiles(a, b) {
    if (!a || !b) return false;
    return !(a === b || (a.name === b.name &&
      a.size === b.size && a.lastModified === b.lastModified));
  }

  async function submit(master, input, photos, statusUpdate) {
    const requestId = txt(input.requestId);
    assert(requestId, 'Movement request ID is missing.');
    assert(distinctFiles(photos.full, photos.label),
      'Take two different photos: one full piece and one label/alternative.');
    const saved = await findSubmittedRequest(requestId);
    if (saved) return { id: saved, existing: true };
    const pending = await pendingForIds([readValue(master, '$id')]);
    assert(!pending.has(readValue(master, '$id')),
      'This piece already has an unverified OUT. Contact the owner.');
    const verifiedSchema = await schema();
    // Fully validate every required field before starting photo uploads.
    buildEntry(master, input, ['validation-full', 'validation-label'],
      verifiedSchema, requestId);
    const files = [
      { file: photos.full, prefix: 'FULL_PIECE' },
      { file: photos.label,
        prefix: input.missingLabel ? 'ALTERNATIVE_ID' : 'IDENTIFYING_LABEL' }
    ];
    for (const file of (photos.extra || [])) {
      files.push({ file, prefix: 'ADDITIONAL' });
    }
    const keys = [];
    for (let i = 0; i < files.length; i++) {
      if (typeof statusUpdate === 'function') {
        statusUpdate('Uploading photo ' + (i + 1) + ' of ' + files.length + '…');
      }
      keys.push(await uploadPhoto(files[i].file, files[i].prefix));
    }
    const entry = buildEntry(master, input, keys, verifiedSchema, requestId);
    if (typeof statusUpdate === 'function') statusUpdate('Submitting OUT entry…');
    try {
      const created = await api('/k/v1/record.json', 'POST', {
        app: ENTRY_APP, record: entry
      });
      assert(created && created.id, 'Kintone did not return an Entry record ID.');
      return { id: str(created.id), existing: false };
    } catch (error) {
      // A timed-out POST might have succeeded. Never blindly retry a write.
      try {
        const found = await findSubmittedRequest(requestId);
        if (found) return { id: found, existing: true };
      } catch (_) { /* ambiguous outcome: still do not retry */ }
      const msg = txt(error && (error.message || error.code));
      throw new Error('OUT result could not be confirmed. Do NOT submit again ' +
        'until the owner checks App 15 for request ID ' + requestId + '.' +
        (msg ? ' Kintone: ' + msg : ''));
    }
  }

  function cardId(card) {
    const link = card.querySelector('.zmws-card-bottom a[href]');
    const href = link && link.getAttribute('href');
    const match = href && href.match(/[?#&]record=(\d+)/);
    return match ? match[1] : '';
  }
  function cards() {
    return root ? Array.from(root.querySelectorAll('.zmws-card')) : [];
  }
  function setButtonStates() {
    for (const card of cards()) {
      const button = card.querySelector('[data-zmout-master]');
      if (!button) continue;
      const masterId = button.dataset.zmoutMaster;
      button.disabled = isChecking || Boolean(pendingError) ||
        pendingIds.has(masterId) || busy;
      button.textContent = pendingIds.has(masterId) ? 'Pending OUT' :
        isChecking ? 'Checking OUT status…' :
        pendingError ? 'OUT unavailable' : 'Confirm OUT';
      button.setAttribute('aria-label',
        button.textContent + ' for Master #' + masterId);
    }
    if (!root) return;
    let warning = root.querySelector('[data-zmout-warning]');
    if (pendingError && !warning) {
      warning = document.createElement('div');
      warning.className = 'zmout-warning';
      warning.dataset.zmoutWarning = '1';
      warning.setAttribute('role', 'alert');
      const count = root.querySelector('[data-slot="count"]');
      if (count && count.parentNode) count.parentNode.insertBefore(
        warning, count.nextSibling);
    }
    if (warning) {
      warning.textContent = pendingError ?
        'Could not verify Pending OUT status. Submissions are disabled until ' +
        'Entry Sheet permissions/fields can be checked: ' + pendingError : '';
      warning.hidden = !pendingError;
    }
  }
  async function checkVisibleCards() {
    const version = ++pendingRequestVersion;
    const ids = cards().map(cardId).filter(Boolean);
    isChecking = true;
    pendingError = '';
    setButtonStates();
    try {
      await schema();
      const result = await pendingForIds(ids);
      if (version !== pendingRequestVersion) return;
      pendingIds = result;
    } catch (error) {
      if (version !== pendingRequestVersion) return;
      pendingError = txt(error && (error.message || error.code)) ||
        'Entry Sheet is unavailable.';
    } finally {
      if (version === pendingRequestVersion) {
        isChecking = false;
        setButtonStates();
      }
    }
  }
  function scan() {
    if (!root) return;
    const visible = cards();
    const first = visible[0] || null;
    for (const card of visible) {
      const id = cardId(card);
      if (!id || card.querySelector('[data-zmout-master]')) continue;
      const foot = card.querySelector('.zmws-card-bottom');
      if (!foot) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'zmout-card-button';
      button.dataset.zmoutMaster = id;
      button.disabled = true;
      button.textContent = 'Checking OUT status…';
      foot.appendChild(button);
    }
    if (first !== firstCard) {
      firstCard = first;
      checkVisibleCards();
    }
  }
  function closeModal() {
    if (busy) return;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
  }
  function showError(message) {
    if (!modal) return;
    const box = modal.querySelector('[data-zmout-error]');
    if (box) { box.textContent = message; box.hidden = false; }
  }
  function showMessage(message) {
    if (!modal) return;
    const target = modal.querySelector('[data-zmout-progress]');
    if (target) target.textContent = message;
  }
  function modalShell(masterId) {
    const wrap = document.createElement('div');
    wrap.className = 'zmout-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Confirm OUT');
    wrap.innerHTML = '<div class="zmout-modal">' +
      '<div class="zmout-modal-head"><h2>Confirm OUT · Master #' + esc(masterId) + '</h2>' +
      '<button type="button" data-zmout-close aria-label="Close">✕</button></div>' +
      '<div data-zmout-error class="zmout-error" role="alert" hidden></div>' +
      '<div data-zmout-progress class="zmout-progress">Checking inventory…</div>' +
      '<div data-zmout-body></div></div>';
    wrap.addEventListener('click', event => {
      if ((event.target === wrap || event.target.closest('[data-zmout-close]')) &&
          !busy) closeModal();
    });
    document.body.appendChild(wrap);
    return wrap;
  }
  function renderForm(master, requestId) {
    const target = modal.querySelector('[data-zmout-body]');
    target.innerHTML =
      '<form data-zmout-form>' +
      '<div class="zmout-readonly"><strong>' +
      esc(readValue(master, 'color_combined') || readValue(master, 'color')) +
      '</strong><span>' + esc(readValue(master, 'length')) + ' × ' +
      esc(readValue(master, 'width')) + ' in · ' +
      esc(readValue(master, 'rack')) + '</span></div>' +
      '<label>Job receiving the piece <input name="newJob" maxlength="255" required value="' +
      esc(readValue(master, 'job')) + '"></label>' +
      '<label>Previous job <select name="previousMode" required>' +
      '<option value="">Choose…</option><option value="none">No previous job</option>' +
      '<option value="known">Enter previous job</option>' +
      '<option value="unknown">Previous job unknown — flag for review</option>' +
      '</select></label>' +
      '<label data-zmout-previous hidden>Previous job name' +
      '<input name="previousJob" maxlength="255"></label>' +
      '<label>Full-piece photo (required)<input name="fullPhoto" type="file"' +
      ' accept="image/*" capture="environment" required></label>' +
      '<label><span data-zmout-label-text>Identifying label photo (required)</span>' +
      '<input name="labelPhoto" type="file" accept="image/*" capture="environment" required></label>' +
      '<label class="zmout-check"><input name="missingLabel" type="checkbox">' +
      'No identifying label on this piece</label>' +
      '<label data-zmout-label-reason hidden>Why is the label missing? (required)' +
      '<textarea name="labelReason" rows="2"></textarea></label>' +
      '<label>Additional photos (optional)<input name="extraPhotos" type="file"' +
      ' accept="image/*" multiple></label>' +
      '<label>OUT notes (optional, max 255 characters)' +
      '<textarea name="notes" maxlength="255" rows="2"></textarea></label>' +
      '<div class="zmout-actions"><button type="button" data-zmout-close>Cancel</button>' +
      '<button type="submit" data-zmout-submit>Submit OUT</button></div>' +
      '</form>';
    const form = target.querySelector('form');
    const previous = form.elements.previousMode;
    previous.addEventListener('change', () => {
      const known = previous.value === 'known';
      form.querySelector('[data-zmout-previous]').hidden = !known;
      form.elements.previousJob.required = known;
    });
    const missing = form.elements.missingLabel;
    missing.addEventListener('change', () => {
      form.querySelector('[data-zmout-label-text]').textContent =
        missing.checked ? 'Alternative identifying photo (required)' :
          'Identifying label photo (required)';
      form.querySelector('[data-zmout-label-reason]').hidden = !missing.checked;
      form.elements.labelReason.required = missing.checked;
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const input = {
        requestId,
        newJob: form.elements.newJob.value,
        previousMode: previous.value,
        previousJob: form.elements.previousJob.value,
        missingLabel: missing.checked,
        labelReason: form.elements.labelReason.value,
        notes: form.elements.notes.value
      };
      const photos = {
        full: form.elements.fullPhoto.files[0],
        label: form.elements.labelPhoto.files[0],
        extra: Array.from(form.elements.extraPhotos.files || [])
      };
      try {
        assert(photos.full && photos.label, 'Both required photos must be selected.');
        const verifiedSchema = await schema();
        buildEntry(master, input, ['check1', 'check2'], verifiedSchema,
          requestId);
        assert(distinctFiles(photos.full, photos.label),
          'Choose two different photos.');
      } catch (error) {
        showError(error.message);
        return;
      }
      busy = true;
      const submitButton = form.querySelector('[data-zmout-submit]');
      submitButton.disabled = true;
      try {
        const result = await submit(master, input, photos, showMessage);
        target.innerHTML =
          '<div class="zmout-success"><strong>OUT recorded in Entry Sheet.</strong>' +
          '<p>Entry #' + esc(result.id) +
          ' is awaiting owner verification. Master Inventory was not changed.</p>' +
          '<a href="/k/15/show#record=' + encodeURIComponent(result.id) +
          '" target="_blank" rel="noopener noreferrer">Open Entry record</a>' +
          '<button type="button" data-zmout-done>Done</button></div>';
        target.querySelector('[data-zmout-done]').addEventListener('click', () => {
          busy = false;
          closeModal();
        });
        checkVisibleCards();
      } catch (error) {
        showError(txt(error.message));
        // In case of ambiguous POST result, do not permit blind resubmission.
        if (/result could not be confirmed/.test(txt(error.message))) {
          showMessage('Submission outcome uncertain: contact owner before retrying.');
        } else {
          showMessage('Submission did not complete. Review the error.');
        }
      } finally {
        busy = false;
        if (submitButton.isConnected) {
          submitButton.disabled = false;
        }
        setButtonStates();
      }
    });
  }
  async function openOut(masterId) {
    if (busy || modal) return;
    modal = modalShell(masterId);
    const requestId = makeRequestId();
    try {
      await schema();
      const pending = await pendingForIds([masterId]);
      assert(!pending.has(str(masterId)),
        'This piece already has an unverified OUT.');
      const master = await fetchMaster(masterId);
      verifyAllowedMasterValues(master, (await schema()).properties);
      showMessage('Two photos are required. Master Inventory will not change.');
      renderForm(master, requestId);
    } catch (error) {
      showError(txt(error.message));
      showMessage('Submission unavailable; nothing has been recorded.');
    }
  }

  function onShow(event) {
    const eligible = Number(event.appId) === MASTER_APP &&
      event.viewType === 'custom' && event.viewName === VIEW;
    if (observer) observer.disconnect();
    ++pendingRequestVersion;
    if (!eligible) {
      if (!busy) closeModal();
      root = null;
      firstCard = null;
      return event;
    }
    root = document.getElementById('zm-warehouse-staging-root');
    firstCard = null;
    pendingIds = new Set();
    pendingError = '';
    isChecking = true;
    if (!root) return event;
    if (root.dataset.zmoutClickBound !== '1') {
      root.addEventListener('click', event => {
        const button = event.target.closest('[data-zmout-master]');
        if (!button || !root.contains(button) || button.disabled) return;
        event.preventDefault();
        openOut(button.dataset.zmoutMaster);
      });
      root.dataset.zmoutClickBound = '1';
    }
    observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    scan();
    return event;
  }

  kintone.events.on(
    ['app.record.index.show', 'mobile.app.record.index.show'], onShow);
  window.ZM_WAREHOUSE_OUT_DRAFT = Object.freeze({
    validateSchema, verifyAllowedMasterValues, buildEntry,
    pendingForIds, findSubmittedRequest, submit, distinctFiles,
    openOut, scan
  });
})();
