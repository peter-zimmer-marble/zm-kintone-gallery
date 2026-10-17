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
    fetchLimit: 500,
    displayStep: 48,
    filter: 'inventory_status in ("", "In") and length >= "0" and width >= "0")'
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
  const EXTRA_FIELDS = Object.freeze(['length_2', 'width_2']);
  const state = {
    active: false, root: null, mobile: false, token: 0, session: 0,
    records: [], search: '', status: '', shown: 48, busy: false,
    error: '', loadedAt: null, extraDimensions: true,
    blobUrls: new Map(), photoRequests: new Map(), observer: null,
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
      cmp(job(a), job(b)) ||
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
        result = await fetchRecords([...FIELDS, ...EXTRA_FIELDS]);
        state.extraDimensions = true;
      } catch (extraError) {
        // Permission-restricted optional L-dimensions are not required to view staging.
        result = await fetchRecords(FIELDS);
        state.extraDimensions = false;
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
    if (state.observer) { state.observer.disconnect(); state.observer = null; }
    for (const url of state.blobUrls.values()) URL.revokeObjectURL(url);
    state.blobUrls.clear();
    state.photoRequests.clear();
    ++state.session;
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
  async function photoUrl(key) {
    if (state.blobUrls.has(key)) return state.blobUrls.get(key);
    if (state.photoRequests.has(key)) return state.photoRequests.get(key);
    const session = state.session;
    const promise = (async () => {
      const response = await fetch('/k/v1/file.json?fileKey=' + encodeURIComponent(key),
        { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Photo could not be loaded (' + response.status + ').');
      const blob = await response.blob();
      if (session !== state.session || !state.active) throw new Error('View changed.');
      const url = URL.createObjectURL(blob);
      state.blobUrls.set(key, url);
      return url;
    })();
    state.photoRequests.set(key, promise);
    try { return await promise; }
    finally { if (state.photoRequests.get(key) === promise) state.photoRequests.delete(key); }
  }
  async function populateThumb(button) {
    const primary = button.dataset.primary;
    const fallback = button.dataset.fallback;
    for (const key of [primary, fallback].filter(Boolean)) {
      try {
        const url = await photoUrl(key);
        if (!state.active || !state.root || !state.root.contains(button)) return;
        button.textContent = '';
        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.src = url;
        button.appendChild(img);
        button.classList.add('zmws-photo-ready');
        return;
      } catch (error) { /* Retry the next attachment if one fails. */ }
    }
    if (state.root && state.root.contains(button)) button.textContent = 'Photo unavailable';
  }
  function loadVisiblePhotos() {
    if (state.observer) state.observer.disconnect();
    const tiles = Array.from(state.root.querySelectorAll('.zmws-photo[data-primary]'));
    if (typeof IntersectionObserver !== 'function') {
      tiles.forEach(populateThumb);
      return;
    }
    state.observer = new IntersectionObserver(entries => {
      for (const item of entries) {
        if (!item.isIntersecting) continue;
        state.observer.unobserve(item.target);
        populateThumb(item.target);
      }
    }, { rootMargin: '240px 0px' });
    tiles.forEach(tile => state.observer.observe(tile));
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
    return '<article class="zmws-card">' + photoMarkup +
      '<div class="zmws-card-body">' +
        '<div class="zmws-card-head"><h3>' + esc(color(record)) + '</h3>' +
        '<span class="zmws-stage">' + esc(stage(record)) + '</span></div>' +
        '<div class="zmws-size">' + esc(size(record)) + '</div>' +
        '<div class="zmws-card-sub">' + esc(type) +
        (shape && shape !== 'Rectangle' && !/Hand L/.test(shape) ? ' · ' + esc(shape) : '') +
        (status ? ' · ' + esc(status) : '') + '</div>' +
        '<div class="zmws-location"><span>RACK</span><strong>' + esc(rack(record)) + '</strong></div>' +
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
    if (state.observer) { state.observer.disconnect(); state.observer = null; }
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
    const visible = matches.slice(0, state.shown);
    count.textContent = matches.length + ' matching ' + (matches.length === 1 ? 'piece' : 'pieces');
    if (!matches.length) {
      output.innerHTML = '<div class="zmws-feedback">No matching pieces. Clear the search or check the original Staging Sheet.</div>';
      return;
    }
    const groups = new Map();
    for (const record of visible) {
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
    if (visible.length < matches.length) {
      html += '<div class="zmws-more"><button type="button" data-action="more">Show more (' +
        (matches.length - visible.length) + ' remaining)</button></div>';
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
      state.shown = CFG.displayStep;
      cleanPhotos();
      load();
    } else if (action === 'filter') {
      state.status = button.dataset.status;
      state.shown = CFG.displayStep;
      render();
    } else if (action === 'more') {
      state.shown += CFG.displayStep;
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
    state.shown = CFG.displayStep;
    state.search = '';
    state.status = '';
    state.extraDimensions = true;
    root.innerHTML = shell();
    if (root.dataset.zmwsBound !== '1') {
      root.addEventListener('click', handleClick, true);
      root.addEventListener('input', e => {
        if (!e.target.matches('[data-action="search"]')) return;
        state.search = e.target.value;
        state.shown = CFG.displayStep;
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