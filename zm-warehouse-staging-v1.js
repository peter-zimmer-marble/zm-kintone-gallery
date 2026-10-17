/*
 * Zimmer Marble - Warehouse Staging v1 (read-only pilot)
 * App 6 custom view "Warehouse Staging":
 * <div id="zm-warehouse-staging-root"></div>
 *
 * GET-only. Does not change RTS, App 6 records, or App 15 entries.
 * No API tokens, private inventory exports, or credentials are stored here.
 */
(function () {
  'use strict';

  const CFG = Object.freeze({
    app: 6,
    name: 'Warehouse Staging',
    rootId: 'zm-warehouse-staging-root',
    fetchLimit: 500
  });
  // Matches the existing Staging Sheet filter exactly (View ID 7535223).
  const STAGING_FILTER = 'inventory_status in ("", "In")' +
    ' and length >= "0" and width >= "0"' +
    ' and sale_status in ("", "Avl", "SOLD", "Hold")' +
    ' and color not like "NO VALUE" and zmv_num not like "NO VALUE"' +
    ' and staging_status in ("RTS", "View Staging")';

  const FIELDS = Object.freeze([
    '$id', 'color', 'color_combined', 'zmv_num', 'type', 'shape',
    'length', 'width', 'rack', 'job', 'sale_status', 'staging_status',
    'exact_picture', 'example_picture'
  ]);
  // Existing Master Inventory instruction field. Display only; never overwrite it.
  const NOTE_FIELD = 'in_out_note';
  const EXTRA_FIELDS = Object.freeze(['length_2', 'width_2']);
  const state = {
    active: false, root: null, mobile: false, token: 0, session: 0,
    records: [], search: '', status: '', busy: false,
    error: '', loadedAt: null, extraDimensions: true, notesAvailable: true,
    blobUrls: new Map(), photoRequests: new Map(), photoQueue: [],
    activePhotoXhrs: new Set(),
    preview: null, previewEpoch: 0, previousFocus: null
  };

  function value(record, code) {
    return record && record[code] && record[code].value !== undefined
      ? record[code].value : '';
  }
  function str(x) { return x === null || x === undefined ? '' : String(x); }
  function txt(x) { return str(x).trim(); }
  function esc(x) {
    return str(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function id(record) { return txt(value(record, '$id')); }
  function color(record) {
    return txt(value(record, 'color_combined')) ||
      [value(record, 'color'), value(record, 'zmv_num')].map(txt).filter(Boolean).join(' ') ||
      '(Color not specified)';
  }
  function job(record) { return txt(value(record, 'job')) || 'Job not assigned'; }
  function stage(record) { return txt(value(record, 'staging_status')); }
  function rack(record) { return txt(value(record, 'rack')) || 'Rack not assigned'; }
  function size(record) {
    const w = txt(value(record, 'width')) || '?';
    const l = txt(value(record, 'length')) || '?';
    const s = txt(value(record, 'shape'));
    const lcode = s === 'Left Hand L' ? 'LHL' : s === 'Right Hand L' ? 'RHL' : '';
    if (lcode && state.extraDimensions) {
      const l2 = txt(value(record, 'length_2'));
      const w2 = txt(value(record, 'width_2'));
      if (l2 || w2) return [l, w, l2 || '—', w2 || '—'].join(' × ') + ' in · ' + lcode;
    }
    return l + ' × ' + w + ' in' + (lcode ? ' · ' + lcode : '');
  }
  function images(record) {
    const result = [], seen = new Set();
    for (const code of ['exact_picture', 'example_picture']) {
      const list = value(record, code);
      if (!Array.isArray(list)) continue;
      for (const file of list) {
        if (!file || !file.fileKey || !/^image\//i.test(str(file.contentType))) continue;
        if (seen.has(file.fileKey)) continue;
        seen.add(file.fileKey);
        result.push({ key: file.fileKey, kind: code === 'exact_picture' ? 'Exact' : 'Example' });
      }
    }
    return result;
  }
  function recordUrl(record) {
    const recordId = encodeURIComponent(id(record));
    return state.mobile
      ? '/k/m/' + CFG.app + '/show?record=' + recordId
      : '/k/' + CFG.app + '/show#record=' + recordId;
  }

  // Each Get Records response is capped at 500. Keyset pagination avoids the
  // offset=10,000 limit and allows sorting the full result set on the client.
  async function fetchRecords(fields) {
    const results = [];
    let last = 0;
    for (;;) {
      const query = STAGING_FILTER +
        (last ? ' and $id > ' + last : '') +
        ' order by $id asc limit ' + CFG.fetchLimit;
      const response = await kintone.api(
        kintone.api.url('/k/v1/records.json', true), 'GET',
        { app: CFG.app, fields, query }
      );
      const batch = response.records || [];
      results.push(...batch);
      if (batch.length < CFG.fetchLimit) return results;
      const next = Number(id(batch[batch.length - 1]));
      if (!Number.isSafeInteger(next) || next <= last) {
        throw new Error('Could not safely paginate staging records.');
      }
      last = next;
    }
  }
  function sortRecords(a, b) {
    const cmp = (x, y) => str(x).localeCompare(str(y), undefined, { sensitivity: 'base' });
    const aW = Number(value(a, 'width')), bW = Number(value(b, 'width'));
    return cmp(stage(a), stage(b)) ||
      cmp(value(a, 'job'), value(b, 'job')) ||
      -cmp(value(a, 'color'), value(b, 'color')) ||
      -cmp(value(a, 'type'), value(b, 'type')) ||
      (Number.isFinite(aW) && Number.isFinite(bW) ? aW - bW : 0) ||
      Number(id(a)) - Number(id(b));
  }
  async function load() {
    const token = ++state.token;
    state.busy = true;
    state.error = '';
    state.records = [];
    render();
    try {
      let result;
      try {
        result = await fetchRecords([...FIELDS, NOTE_FIELD, ...EXTRA_FIELDS]);
        state.extraDimensions = true;
        state.notesAvailable = true;
      } catch (extraError) {
        // L-dimensions may not be visible to some warehouse roles; notes matter
        // more than optional measurements, so retry with the notes field.
        try {
          result = await fetchRecords([...FIELDS, NOTE_FIELD]);
          state.extraDimensions = false;
          state.notesAvailable = true;
        } catch (noteError) {
          // Keep staging usable if In/Out Notes are restricted by Kintone.
          // Do not silently imply that blank notes mean no instructions.
          result = await fetchRecords(FIELDS);
          state.extraDimensions = false;
          state.notesAvailable = false;
        }
      }
      if (!state.active || token !== state.token) return;
      state.records = result.sort(sortRecords);
      state.loadedAt = new Date();
    } catch (error) {
      if (!state.active || token !== state.token) return;
      state.error = error && (error.message || error.code)
        ? str(error.message || error.code)
        : 'Could not retrieve staging data. Check access permissions.';
      console.error('ZM Warehouse Staging load failed:', error);
    } finally {
      if (state.active && token === state.token) {
        state.busy = false;
        render();
      }
    }
  }

  function cleanPhotos() {
    ++state.session;
    // Cancel both queued and active requests on view change/refresh. A stale
    // response must never insert a photo into the next view session.
    for (const task of state.photoQueue.splice(0)) {
      task.reject(new Error('Photo request cancelled after view change.'));
    }
    for (const xhr of [...state.activePhotoXhrs]) xhr.abort();
    state.activePhotoXhrs.clear();
    for (const url of state.blobUrls.values()) URL.revokeObjectURL(url);
    state.blobUrls.clear();
    state.photoRequests.clear();
  }
  function closePreview() {
    state.preview = null;
    ++state.previewEpoch;
    if (!state.root) return;
    const modal = state.root.querySelector('[data-slot="preview"]');
    if (modal) modal.hidden = true;
    if (state.previousFocus && state.previousFocus.isConnected) state.previousFocus.focus();
    state.previousFocus = null;
  }
  function dispose() {
    ++state.token;
    closePreview();
    cleanPhotos();
    state.active = false;
    state.root = null;
    state.records = [];
  }
  // Use the same authenticated Kintone file-download path as the working
  // Visual Search v2: kintone.api.url + XMLHttpRequest + X-Requested-With.
  // Generic fetch() can be rejected by Kintone's file endpoint.
  // Limit parallel downloads to 4 so a large RTS list cannot flood the API.
  function drainPhotoQueue() {
    while (state.active && state.activePhotoXhrs.size < 4 && state.photoQueue.length) {
      const task = state.photoQueue.shift();
      if (task.session !== state.session) {
        task.reject(new Error('Photo request expired.'));
        continue;
      }
      const xhr = new XMLHttpRequest();
      state.activePhotoXhrs.add(xhr);
      let finished = false;
      const done = (error, url) => {
        if (finished) return;
        finished = true;
        state.activePhotoXhrs.delete(xhr);
        if (error) task.reject(error);
        else task.resolve(url);
        drainPhotoQueue();
      };
      xhr.onload = () => {
        if (!state.active || task.session !== state.session) {
          done(new Error('View changed during photo request.'));
          return;
        }
        if (xhr.status !== 200) {
          done(new Error('Kintone file request returned HTTP ' + xhr.status));
          return;
        }
        if (!xhr.response || !/^image\//i.test(str(xhr.response.type))) {
          done(new Error('Kintone returned no usable image.'));
          return;
        }
        try {
          const url = URL.createObjectURL(xhr.response);
          state.blobUrls.set(task.key, url);
          done(null, url);
        } catch (error) { done(error); }
      };
      xhr.onerror = () => done(new Error('Kintone photo request failed.'));
      xhr.onabort = () => done(new Error('Photo request cancelled.'));
      try {
        xhr.open('GET', kintone.api.url('/k/v1/file.json', true) +
          '?fileKey=' + encodeURIComponent(task.key), true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.responseType = 'blob';
        xhr.send();
      } catch (error) { done(error); }
    }
  }
  async function photoUrl(key) {
    if (state.blobUrls.has(key)) return state.blobUrls.get(key);
    if (state.photoRequests.has(key)) return state.photoRequests.get(key);
    const promise = new Promise((resolve, reject) => {
      state.photoQueue.push({ key, session: state.session, resolve, reject });
      drainPhotoQueue();
    });
    state.photoRequests.set(key, promise);
    try { return await promise; }
    finally {
      if (state.photoRequests.get(key) === promise) state.photoRequests.delete(key);
    }
  }
  async function populateThumb(button) {
    // If one attachment cannot be downloaded, try every other attached image,
    // not just the first two. Keep Exact Pictures ahead of Example Pictures.
    const record = state.records.find(item => id(item) === button.dataset.id);
    const keys = record ? images(record).map(image => image.key) :
      [button.dataset.primary, button.dataset.fallback].filter(Boolean);
    let lastError = null;
    for (const key of keys) {
      try {
        const url = await photoUrl(key);
        if (!state.active || !state.root || !state.root.contains(button)) return;
        button.textContent = '';
        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'eager';
        img.src = url;
        button.appendChild(img);
        button.classList.add('zmws-photo-ready');
        return;
      } catch (error) { lastError = error; /* Try the next attached image. */ }
    }
    if (state.active && state.root && state.root.contains(button)) {
      button.textContent = 'Photo unavailable';
      button.title = 'Open the Master record to inspect its attachments.';
      if (lastError && !/cancel|expired|view changed/i.test(str(lastError.message))) {
        console.warn('ZM Warehouse Staging photo download failed:', lastError.message);
      }
    }
  }
  function loadVisiblePhotos() {
    // Every staged piece is visible immediately. Start every thumbnail request
    // as soon as the list renders, even for cards below the fold. The photo
    // downloader still limits network concurrency to 4, not the number of
    // images or pieces; remaining requests are queued automatically.
    const tiles = Array.from(state.root.querySelectorAll('.zmws-photo[data-primary]'));
    tiles.forEach(populateThumb);
  }
  function card(record) {
    const recordId = id(record), photos = images(record);
    let photoMarkup;
    if (photos.length) {
      photoMarkup = '<button type="button" class="zmws-photo" data-action="view-photo"' +
        ' data-id="' + esc(recordId) + '" data-primary="' + esc(photos[0].key) + '"' +
        (photos[1] ? ' data-fallback="' + esc(photos[1].key) + '"' : '') +
        ' aria-label="View photos for ' + esc(color(record)) + '">Loading photo…</button>';
    } else {
      photoMarkup = '<div class="zmws-photo zmws-no-photo">No photo available</div>';
    }
    const status = txt(value(record, 'sale_status'));
    const shape = txt(value(record, 'shape'));
    const type = txt(value(record, 'type'));
    const inOutNotes = txt(value(record, NOTE_FIELD));
    // Show the complete existing note on every piece that has one, including
    // line breaks; escape before inserting so staff-entered text is never HTML.
    const noteMarkup = inOutNotes ?
      '<div class="zmws-in-out-notes"><span>IN / OUT NOTES</span><p>' +
      esc(inOutNotes) + '</p></div>' : '';
    return '<article class="zmws-card">' + photoMarkup +
      '<div class="zmws-card-body">' +
        '<div class="zmws-card-head"><h3>' + esc(color(record)) + '</h3>' +
        '<span class="zmws-stage">' + esc(stage(record)) + '</span></div>' +
        '<div class="zmws-size">' + esc(size(record)) + '</div>' +
        '<div class="zmws-card-sub">' + esc(type) +
        (shape && shape !== 'Rectangle' && !/Hand L/.test(shape) ? ' · ' + esc(shape) : '') +
        (status ? ' · ' + esc(status) : '') + '</div>' +
        '<div class="zmws-location"><span>RACK</span><strong>' + esc(rack(record)) + '</strong></div>' +
        noteMarkup +
        '<div class="zmws-card-bottom"><span>Master #' + esc(recordId) + '</span>' +
        '<a href="' + recordUrl(record) +
        '" target="_blank" rel="noopener noreferrer">Open record →</a></div>' +
      '</div></article>';
  }
  function filteredRecords() {
    const terms = state.search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return state.records.filter(record => {
      if (state.status && stage(record) !== state.status) return false;
      const haystack = [
        color(record), job(record), rack(record), id(record),
        value(record, 'type'), value(record, 'shape'),
        value(record, 'staging_status'), value(record, 'sale_status')
      ].map(x => str(x).toLocaleLowerCase()).join(' ');
      return terms.every(term => haystack.includes(term));
    });
  }
  function render() {
    if (!state.root) return;
    const output = state.root.querySelector('[data-slot="results"]');
    const count = state.root.querySelector('[data-slot="count"]');
    const summary = state.root.querySelector('[data-slot="summary"]');
    if (!output || !count || !summary) return;
    for (const button of state.root.querySelectorAll('[data-action="filter"]')) {
      button.setAttribute('aria-pressed', str(state.status === button.dataset.status));
    }
    const rts = state.records.filter(r => stage(r) === 'RTS').length;
    const view = state.records.filter(r => stage(r) === 'View Staging').length;
    summary.textContent = state.busy ? 'Loading…' : rts + ' RTS  ·  ' + view + ' View Staging';
    if (state.busy) {
      count.textContent = '';
      output.innerHTML = '<div class="zmws-feedback">Loading current staging pieces…</div>';
      return;
    }
    if (state.error) {
      count.textContent = '';
      output.innerHTML = '<div class="zmws-feedback zmws-error">' + esc(state.error) + '</div>';
      return;
    }
    const matches = filteredRecords();
    const total = state.records.length;
    // Never hide pieces behind a client-side item cap: warehouse workers must
    // see every staged piece that matches the active search/status filters.
    count.textContent = matches.length === total
      ? 'All ' + total + ' staged ' + (total === 1 ? 'piece' : 'pieces') + ' displayed'
      : 'Showing all ' + matches.length + ' matching ' +
        (matches.length === 1 ? 'piece' : 'pieces') + ' · ' + total +
        ' total staged (search/filter active)';
    if (!matches.length) {
      output.innerHTML = '<div class="zmws-feedback">No matching pieces. Clear the search or check the original Staging Sheet.</div>';
      return;
    }
    const groups = new Map();
    for (const record of matches) {
      const key = stage(record) + '\u0000' + job(record);
      if (!groups.has(key)) groups.set(key, { status: stage(record), job: job(record), items: [] });
      groups.get(key).items.push(record);
    }
    let html = '';
    for (const group of groups.values()) {
      html += '<section class="zmws-job-group">' +
        '<div class="zmws-group-head"><h2>' + esc(group.job) + '</h2>' +
        '<span>' + esc(group.status) + ' · ' + group.items.length + ' ' +
        (group.items.length === 1 ? 'piece' : 'pieces') + '</span></div>' +
        '<div class="zmws-cards">' + group.items.map(card).join('') + '</div></section>';
    }
    if (!state.notesAvailable) {
      html = '<div class="zmws-notes-warning" role="alert">' +
        'In/Out Notes could not be loaded for this account. ' +
        'Check Kintone field permissions before using these cards to pull material.' +
        '</div>' + html;
    }
    output.innerHTML = html;
    loadVisiblePhotos();
  }
  function shell() {
    return '<div class="zmws-app" data-zm-warehouse-staging="1">' +
      '<header class="zmws-header"><div><span class="zmws-eyebrow">ZM / WAREHOUSE</span>' +
      '<h1>Warehouse Staging</h1><p data-slot="summary">Loading…</p></div>' +
      '<button type="button" class="zmws-refresh" data-action="refresh">↻ Refresh</button></header>' +
      '<div class="zmws-notice"><strong>Read-only pilot.</strong> This list shows RTS / View Staging from Master Inventory. ' +
      'It does not record pulls; a physically pulled piece may remain listed until its OUT is approved.</div>' +
      '<div class="zmws-tools"><label class="zmws-search-label" for="zmws-search">Find a piece</label>' +
      '<input id="zmws-search" data-action="search" type="search" autocomplete="off"' +
      ' placeholder="Search job, color, rack, record #" />' +
      '<div class="zmws-filters" role="group" aria-label="Staging status">' +
      '<button type="button" data-action="filter" data-status="" aria-pressed="true">All</button>' +
      '<button type="button" data-action="filter" data-status="RTS" aria-pressed="false">RTS</button>' +
      '<button type="button" data-action="filter" data-status="View Staging" aria-pressed="false">View Staging</button>' +
      '</div></div><div class="zmws-count" data-slot="count"></div>' +
      '<main data-slot="results" aria-live="polite"></main>' +
      '<footer class="zmws-footer">Master Inventory remains the verified source of truth. No records are changed by this view.</footer>' +
      '<div class="zmws-modal" data-slot="preview" role="dialog" aria-modal="true"' +
      ' aria-label="Piece photos" hidden><div class="zmws-modal-content">' +
      '<div class="zmws-modal-head"><strong data-slot="preview-title"></strong>' +
      '<button type="button" data-action="close-photo" aria-label="Close photos">✕</button></div>' +
      '<div class="zmws-modal-image" data-slot="preview-image">Loading…</div>' +
      '<div class="zmws-modal-bottom"><button type="button" data-action="previous-photo">← Previous</button>' +
      '<span data-slot="preview-counter"></span>' +
      '<button type="button" data-action="next-photo">Next →</button></div></div></div>' +
      '</div>';
  }
  async function showPreviewIndex(index) {
    if (!state.preview || !state.root) return;
    const preview = state.preview;
    preview.index = (index + preview.photos.length) % preview.photos.length;
    const epoch = ++state.previewEpoch;
    const photo = preview.photos[preview.index];
    const holder = state.root.querySelector('[data-slot="preview-image"]');
    const counter = state.root.querySelector('[data-slot="preview-counter"]');
    holder.textContent = 'Loading photo…';
    counter.textContent = (preview.index + 1) + ' of ' + preview.photos.length + ' · ' + photo.kind;
    try {
      const url = await photoUrl(photo.key);
      if (!state.preview || epoch !== state.previewEpoch) return;
      holder.textContent = '';
      const img = document.createElement('img');
      img.alt = preview.name + ', photo ' + (preview.index + 1);
      img.src = url;
      holder.appendChild(img);
    } catch (error) {
      if (state.preview && epoch === state.previewEpoch) holder.textContent = 'Photo unavailable';
    }
  }
  function openPreview(record) {
    const photos = images(record);
    if (!photos.length || !state.root) return;
    state.previousFocus = document.activeElement;
    state.preview = { name: color(record), index: 0, photos };
    const modal = state.root.querySelector('[data-slot="preview"]');
    modal.hidden = false;
    state.root.querySelector('[data-slot="preview-title"]').textContent = state.preview.name;
    state.root.querySelector('[data-action="close-photo"]').focus();
    showPreviewIndex(0);
  }
  function handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || !state.root || !state.root.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'search') return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'refresh') {
      closePreview();
      cleanPhotos();
      load();
    } else if (action === 'filter') {
      state.status = button.dataset.status;
      render();
    } else if (action === 'view-photo') {
      const record = state.records.find(r => id(r) === button.dataset.id);
      if (record) openPreview(record);
    } else if (action === 'close-photo') closePreview();
    else if (action === 'previous-photo' && state.preview) showPreviewIndex(state.preview.index - 1);
    else if (action === 'next-photo' && state.preview) showPreviewIndex(state.preview.index + 1);
  }
  function handleKeydown(event) {
    if (!state.active || !state.preview) return;
    if (event.key === 'Escape') { event.preventDefault(); closePreview(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPreviewIndex(state.preview.index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPreviewIndex(state.preview.index + 1); }
  }
  function onShow(event) {
    const eligible = Number(event.appId) === CFG.app &&
      event.viewType === 'custom' && event.viewName === CFG.name;
    if (!eligible) {
      if (state.active) dispose();
      return event;
    }
    const root = document.getElementById(CFG.rootId);
    if (!root) return event;
    if (state.active) dispose();
    state.active = true;
    state.root = root;
    state.mobile = event.type === 'mobile.app.record.index.show';
    state.search = '';
    state.status = '';
    state.extraDimensions = true;
    state.notesAvailable = true;
    root.innerHTML = shell();
    if (root.dataset.zmwsBound !== '1') {
      root.addEventListener('click', handleClick, true);
      root.addEventListener('input', e => {
        if (!e.target.matches('[data-action="search"]')) return;
        state.search = e.target.value;
        render();
      });
      root.dataset.zmwsBound = '1';
    }
    load();
    return event;
  }
  document.addEventListener('keydown', handleKeydown);
  kintone.events.on(
    ['app.record.index.show', 'mobile.app.record.index.show'],
    onShow
  );
})();