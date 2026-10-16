/*
 * ZM Inventory - Visual Search v1.0
 * Independent read-only Kintone Custom View for Inventory App 6.
 * Install in ZM Inventory only, using a Custom View named exactly "Visual Search"
 * with HTML: <div id="zm-visual-search-root"></div>
 */
(function () {
  'use strict';

  const GALLERY_LOGO = 'data:image/jpeg;base64,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';

  const SETTINGS = Object.freeze({ INVENTORY_APP_ID: 6, PAGE_SIZE: 500 });
  const ROOT_ID = 'zm-visual-search-root';
  const esc = v => String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const field = (r,k) => r && r[k] && r[k].value !== undefined ? r[k].value : '';
  const str = v => v == null ? '' : String(v);
  const toText = v => str(v).trim();
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const getId = r => str(field(r,'$id') || field(r,'Record_number'));
  const getRack = r => toText(field(r,'rack')).toUpperCase();
  const getColor = r => toText(field(r,'color_combined')) ||
    [field(r,'color'),field(r,'zmv_num')].map(toText).filter(Boolean).join(' ');
  const getSale = r => toText(field(r,'sale_status'));
  const isRemnant = r => /rem/i.test(str(field(r,'type')));
  const isSlab = r => /slab/i.test(str(field(r,'type')));
  const normalizeColorCombined = v => str(v).replace(/\s+/g,' ').trim();
  const getColorCombined = r => normalizeColorCombined(field(r,'color_combined')) ||
    normalizeColorCombined(getColor(r)) || '(Color not specified)';
  function statusClass(sale) {
    return sale==='SOLD'?'sold':sale==='Hold'?'hold':sale==='Avl'?'available':'unknown';
  }
  function describeError(error) {
    return error && (error.message||error.code)
      ? str(error.message||error.code)
      : 'Request failed. Check inventory permissions and try again.';
  }
  function readOnlyApi(app,fields,query) {
    return kintone.api(kintone.api.url('/k/v1/records.json',true),'GET',{app,fields,query});
  }
  function mapSignature() {
    return '<div class="zmwm-map-signature"><img src="' + GALLERY_LOGO +
      '" alt="Zimmer Marble logo"><span>ZM / INVENTORY</span></div>';
  }

  // Visual Search uses the same authenticated Inventory App 6 records as the
  // physical maps, but has its own image-first, read-only user interface.
  // It does not change any warehouse-map layout or write to Kintone.
  const VISUAL_PAGE_SIZE = 32;
  // Strict field allowlist: only values required for the visible cards/filters.
  // Never request pricing, costs, margins, notes, or unrelated inventory fields.
  // The job field is an intentional exception for the requested card display.
  // Kintone itself enforces access rights.
  // inventory_status is used only in the query (not returned to the browser).
  const VISUAL_FIELDS = Object.freeze([
    '$id', 'color', 'color_combined', 'zmv_num',
    'type', 'length', 'width', 'shape', 'rack', 'sale_status',
    'exact_picture', 'example_picture', 'job'
  ]);
  const visualState = {
    active:false, records:[], search:'', kind:'', sale:'', minLength:'', minWidth:'',
    photosOnly:false, shown:VISUAL_PAGE_SIZE, loading:false, error:'', updatedAt:null,
    token:0, urls:new Map(), failed:new Set(), pending:[], pendingKeys:new Set(),
    inflight:new Map(), observer:null, lightbox:null, keydownHandler:null,
    touchStartX:null
  };
  const visualDimension = value => toText(value) || '?';
  const visualNumericDimension = value => {
    const n = Number(toText(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };
  // Kintone attachment fields can each contain multiple image files.
  // Preserve exact-picture order, then example-picture order, without duplicates.
  function visualImages(record) {
    const images = [];
    const seen = new Set();
    for (const [fieldName, kind] of [['exact_picture','Exact photo'],
      ['example_picture','Example photo']]) {
      const files = field(record, fieldName);
      if (!Array.isArray(files)) continue;
      for (const file of files) {
        if (!file || !file.fileKey || !/^image\//i.test(str(file.contentType))) continue;
        const key = str(file.fileKey);
        if (seen.has(key)) continue;
        seen.add(key);
        images.push({key,kind,name:str(file.name),mime:str(file.contentType).toLowerCase()});
      }
    }
    return images;
  }
  function visualPhotoKeys(record) {
    return visualImages(record).map(image => image.key);
  }
  function visualMatches(record) {
    if (visualState.kind === 'slab' && !isSlab(record)) return false;
    if (visualState.kind === 'remnant' && !isRemnant(record)) return false;
    if (visualState.sale && getSale(record) !== visualState.sale) return false;
    if (visualState.photosOnly && !visualPhotoKeys(record).length) return false;
    if (visualState.minLength !== '' &&
      !(visualNumericDimension(field(record,'length')) >= Number(visualState.minLength))) return false;
    if (visualState.minWidth !== '' &&
      !(visualNumericDimension(field(record,'width')) >= Number(visualState.minWidth))) return false;
    const terms = visualState.search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const haystack = [getId(record),getColor(record),getRack(record),
      field(record,'color'),field(record,'zmv_num'),field(record,'type'),
      field(record,'shape')]
      .map(value => str(value).toLocaleLowerCase()).join(' ');
    return terms.every(term => haystack.includes(term));
  }
  function visualMatchesSorted() {
    return visualState.records.filter(visualMatches).sort((a,b) =>
      getColorCombined(a).localeCompare(getColorCombined(b),undefined,{sensitivity:'base'}) ||
      num(getId(a)) - num(getId(b)));
  }
  function visualCard(record) {
    const id = getId(record);
    const name = getColorCombined(record);
    const url = '/k/' + SETTINGS.INVENTORY_APP_ID + '/show#record=' + encodeURIComponent(id);
    const images = visualImages(record);
    const primary = images[0] ? images[0].key : '';
    const fallback = images[1] ? images[1].key : '';
    const length = visualDimension(field(record,'length'));
    const width = visualDimension(field(record,'width'));
    const rack = toText(field(record,'rack')) || 'Location not set';
    const type = toText(field(record,'type')) || 'Stone';
    const shape = toText(field(record,'shape'));
    const sale = getSale(record);
    const job = toText(field(record,'job'));
    const label = sale === 'Avl' ? 'Available' : sale === 'SOLD' ? 'Sold' : sale === 'Hold' ? 'Hold' : '';
    const statusBadge = label ? '<span class="zmwm-visual-status ' + statusClass(sale) +
      '">' + esc(label) + '</span>' : '';
    const countBadge = images.length > 1 ? '<span class="zmwm-visual-photo-count">' +
      images.length + ' photos · View all</span>' : '';
    const photo = primary ?
      '<button type="button" class="zmwm-visual-photo zmwm-visual-photo-action"' +
        ' data-visual-action="open-photo" data-visual-id="' + esc(id) + '"' +
        ' data-visual-photo="' + esc(primary) + '"' +
        (fallback ? ' data-visual-fallback="' + esc(fallback) + '"' : '') +
        ' aria-label="Enlarge ' + images.length + ' photo' + (images.length === 1 ? '' : 's') +
        ' of ' + esc(name) + '">' +
        '<span class="zmwm-visual-photo-pending">Photo loading…</span>' +
        statusBadge + countBadge + '</button>' :
      '<div class="zmwm-visual-photo"><span class="zmwm-visual-no-photo">No photo available</span>' +
        statusBadge + '</div>';
    return '<article class="zmwm-visual-card">' + photo +
      '<a class="zmwm-visual-link" href="' + url +
      '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(name) + ', ' + esc(length) +
      ' by ' + esc(width) + ' inches. Open Kintone record ' + esc(id) + '">' +
      '<div class="zmwm-visual-card-details">' +
      '<h3 class="zmwm-visual-color">' + esc(name) + '</h3>' +
      '<div class="zmwm-visual-size">' + esc(length) + ' × ' + esc(width) + ' in</div>' +
      (job ? '<div class="zmwm-visual-job"><span class="zmwm-visual-job-label">Job</span>' +
        '<span class="zmwm-visual-job-value">' + esc(job) + '</span></div>' : '') +
      '<div class="zmwm-visual-card-meta"><span>' + esc(type) +
      (shape && shape.toLowerCase() !== 'rectangle' ? ' · ' + esc(shape) : '') +
      '</span><span>' + esc(rack) + ' · #' + esc(id) + '</span></div>' +
      '</div></a></article>';
  }
  function visualShell() {
    return '<main class="zmwm-visual-app" id="zmwm-visual-root">' +
      '<header class="zmwm-visual-header"><div><div class="zmwm-visual-eyebrow">ZM / INVENTORY</div>' +
      '<h1>Visual Search</h1><p>Browse individual pieces by photo, size and material name.</p></div>' +
      '<div class="zmwm-visual-header-actions"><span>READ ONLY</span>' +
      '<button type="button" data-visual-action="refresh">↻ Refresh</button></div></header>' +
      '<div class="zmwm-visual-toolbar" role="search" aria-label="Photo inventory filters">' +
      '<label class="zmwm-visual-field zmwm-visual-search-field"><span>SEARCH</span>' +
      '<input id="zmwm-visual-search" type="search" placeholder="Name, color, record #, rack…" autocomplete="off"></label>' +
      '<label class="zmwm-visual-field"><span>PIECE TYPE</span><select id="zmwm-visual-kind">' +
      '<option value="">All pieces</option><option value="slab">Slabs</option>' +
      '<option value="remnant">Remnants</option></select></label>' +
      '<label class="zmwm-visual-field"><span>AVAILABILITY</span><select id="zmwm-visual-sale">' +
      '<option value="">All statuses</option><option value="Avl">Available</option>' +
      '<option value="Hold">Hold</option><option value="SOLD">Sold</option></select></label>' +
      '<label class="zmwm-visual-field zmwm-visual-number"><span>MIN. LENGTH (IN)</span>' +
      '<input id="zmwm-visual-min-length" type="number" min="0" step="any" placeholder="Any"></label>' +
      '<label class="zmwm-visual-field zmwm-visual-number"><span>MIN. WIDTH (IN)</span>' +
      '<input id="zmwm-visual-min-width" type="number" min="0" step="any" placeholder="Any"></label>' +
      '<label class="zmwm-visual-toggle"><input id="zmwm-visual-photos-only" type="checkbox">' +
      '<span>Photos only</span></label>' +
      '<button class="zmwm-visual-reset" type="button" data-visual-action="reset">Reset</button></div>' +
      '<div id="zmwm-visual-feedback" class="zmwm-visual-feedback" role="status" aria-live="polite"></div>' +
      '<div id="zmwm-visual-results"></div>' +
      '<div id="zmwm-visual-lightbox" class="zmwm-visual-lightbox" role="dialog"' +
        ' aria-modal="true" aria-label="Inventory photo viewer" hidden>' +
        '<div class="zmwm-visual-lightbox-backdrop" data-visual-action="close-photo"></div>' +
        '<section class="zmwm-visual-lightbox-panel">' +
          '<header class="zmwm-visual-lightbox-header">' +
            '<div><div class="zmwm-visual-lightbox-eyebrow">INVENTORY PHOTOS</div>' +
              '<h2 id="zmwm-visual-lightbox-title"></h2>' +
              '<p id="zmwm-visual-lightbox-meta"></p></div>' +
            '<button type="button" class="zmwm-visual-lightbox-close"' +
              ' data-visual-action="close-photo" aria-label="Close photo viewer">×</button>' +
          '</header>' +
          '<div class="zmwm-visual-lightbox-stage">' +
            '<button type="button" class="zmwm-visual-lightbox-arrow" data-visual-action="previous-photo"' +
              ' aria-label="Previous photo">‹</button>' +
            '<div class="zmwm-visual-lightbox-image" id="zmwm-visual-lightbox-image"' +
              ' aria-live="polite"></div>' +
            '<button type="button" class="zmwm-visual-lightbox-arrow" data-visual-action="next-photo"' +
              ' aria-label="Next photo">›</button>' +
          '</div>' +
          '<div class="zmwm-visual-lightbox-footer">' +
            '<span id="zmwm-visual-lightbox-caption"></span>' +
            '<button type="button" class="zmwm-visual-lightbox-download"' +
              ' data-visual-action="download-photo" disabled>↓ Download photo</button>' +
          '</div>' +
          '<div class="zmwm-visual-lightbox-thumbnails" id="zmwm-visual-lightbox-thumbnails"' +
            ' aria-label="Select a photo"></div>' +
        '</section></div>' +
      '<footer class="zmwm-visual-footer">Inventory currently marked In in Kintone. ' +
      'Photos and dimensions are sourced from the existing records; nothing is edited here.</footer>' +
      mapSignature() + '</main>';
  }
  function renderVisualFeedback() {
    const node = document.getElementById('zmwm-visual-feedback');
    if (!node) return;
    if (visualState.loading) {
      node.textContent = 'Loading current Kintone inventory…';
    } else if (visualState.error) {
      node.textContent = 'Could not load inventory: ' + visualState.error;
    } else {
      node.textContent = 'LIVE KINTONE DATA · ' + visualState.records.length.toLocaleString() +
        ' pieces in shop · Refreshed ' + (visualState.updatedAt ?
          visualState.updatedAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) : '—');
    }
  }
  function renderVisualResults() {
    const container = document.getElementById('zmwm-visual-results');
    if (!container || !visualState.active) return;
    if (visualState.observer) { visualState.observer.disconnect(); visualState.observer = null; }
    if (visualState.loading) {
      container.innerHTML = '<div class="zmwm-visual-loading">Finding your inventory pieces…</div>';
      return;
    }
    if (visualState.error) {
      container.innerHTML = '<div class="zmwm-visual-empty">Inventory could not be loaded. ' +
        '<button type="button" data-visual-action="refresh">Try again</button></div>';
      return;
    }
    const results = visualMatchesSorted();
    const visible = results.slice(0,visualState.shown);
    container.innerHTML = '<div class="zmwm-visual-count">' + results.length.toLocaleString() +
      ' matching ' + (results.length === 1 ? 'piece' : 'pieces') +
      ' <span>· Showing ' + visible.length.toLocaleString() + '</span></div>' +
      (results.length ? '<div class="zmwm-visual-grid">' + visible.map(visualCard).join('') + '</div>' :
        '<div class="zmwm-visual-empty">No pieces match those filters.</div>') +
      (visible.length < results.length ? '<div class="zmwm-visual-more-wrap"><button type="button" ' +
        'data-visual-action="more">Show more pieces</button></div>' : '');
    prepareVisualPhotos();
  }
  function fillVisualSlot(slot, url) {
    if (!slot) return;
    const badge = slot.querySelector('.zmwm-visual-status');
    const count = slot.querySelector('.zmwm-visual-photo-count');
    slot.textContent = '';
    const image = document.createElement('img');
    image.src = url;
    image.alt = 'Photo of inventory piece';
    image.loading = 'lazy';
    slot.appendChild(image);
    if (badge) slot.appendChild(badge);
    if (count) slot.appendChild(count);
  }
  function markVisualPhotoFailure(key) {
    visualState.failed.add(key);
    const root = document.getElementById('zmwm-visual-root');
    if (!root || !visualState.active) return;
    root.querySelectorAll('[data-visual-photo]').forEach(slot => {
      if (slot.dataset.visualPhoto !== key) return;
      const record = visualState.records.find(r => getId(r) === str(slot.dataset.visualId));
      const other = record ? visualImages(record).find(item =>
        item.key !== key && !visualState.failed.has(item.key)) : null;
      const alternate = other ? other.key : slot.dataset.visualFallback;
      if (alternate && alternate !== key && !visualState.failed.has(alternate)) {
        slot.dataset.visualPhoto = alternate;
        delete slot.dataset.visualFallback;
        requestVisualPhoto(alternate);
      } else {
        const badge = slot.querySelector('.zmwm-visual-status');
        const count = slot.querySelector('.zmwm-visual-photo-count');
        slot.textContent = '';
        const textNode = document.createElement('span');
        textNode.className = 'zmwm-visual-no-photo';
        textNode.textContent = 'Photo unavailable';
        slot.appendChild(textNode);
        if (badge) slot.appendChild(badge);
        if (count) slot.appendChild(count);
        delete slot.dataset.visualPhoto;
      }
    });
    renderVisualLightbox();
  }
  function requestVisualPhoto(key, priority = false) {
    if (!visualState.active || !key) return;
    if (visualState.urls.has(key)) {
      const root = document.getElementById('zmwm-visual-root');
      if (root) root.querySelectorAll('[data-visual-photo]').forEach(slot => {
        if (slot.dataset.visualPhoto === key) fillVisualSlot(slot,visualState.urls.get(key));
      });
      return;
    }
    if (visualState.failed.has(key)) { markVisualPhotoFailure(key); return; }
    if (visualState.inflight.has(key)) return;
    if (visualState.pendingKeys.has(key)) {
      if (priority) {
        visualState.pending = [key,...visualState.pending.filter(item => item !== key)];
      }
      return;
    }
    if (priority) visualState.pending.unshift(key);
    else visualState.pending.push(key);
    visualState.pendingKeys.add(key);
    drainVisualPhotoQueue();
  }
  function drainVisualPhotoQueue() {
    while (visualState.active && visualState.inflight.size < 4 && visualState.pending.length) {
      const key = visualState.pending.shift();
      visualState.pendingKeys.delete(key);
      if (visualState.urls.has(key) || visualState.failed.has(key)) continue;
      const xhr = new XMLHttpRequest();
      visualState.inflight.set(key,xhr);
      xhr.open('GET', kintone.api.url('/k/v1/file.json',true) +
        '?fileKey=' + encodeURIComponent(key), true);
      xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
      xhr.responseType = 'blob';
      const done = ok => {
        visualState.inflight.delete(key);
        if (!visualState.active) return;
        if (ok && xhr.response && /^image\//i.test(xhr.response.type)) {
          const url = URL.createObjectURL(xhr.response);
          visualState.urls.set(key,url);
          requestVisualPhoto(key);
          renderVisualLightbox();
        } else markVisualPhotoFailure(key);
        drainVisualPhotoQueue();
      };
      xhr.onload = () => done(xhr.status === 200);
      xhr.onerror = () => done(false);
      xhr.send();
    }
  }
  function prepareVisualPhotos() {
    const root = document.getElementById('zmwm-visual-root');
    if (!root || !visualState.active) return;
    const slots = [...root.querySelectorAll('[data-visual-photo]')];
    const watch = slot => requestVisualPhoto(slot.dataset.visualPhoto);
    if (typeof IntersectionObserver === 'function') {
      visualState.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visualState.observer.unobserve(entry.target);
            watch(entry.target);
          }
        });
      },{rootMargin:'350px 0px'});
      slots.forEach(slot => {
        const url = visualState.urls.get(slot.dataset.visualPhoto);
        if (url) fillVisualSlot(slot,url);
        else visualState.observer.observe(slot);
      });
    } else slots.forEach(watch);
  }

  function visualSafeFilenamePart(value, maximum = 90) {
    const cleaned = str(value).normalize('NFKC')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g,'-')
      .replace(/\s+/g,' ').replace(/^[. ]+|[. ]+$/g,'').slice(0,maximum)
      .replace(/[. ]+$/g,'');
    return cleaned || 'Unknown';
  }
  function visualDownloadFilename(record, image, index, total) {
    const extensions = {
      'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png',
      'image/webp':'webp','image/gif':'gif','image/avif':'avif',
      'image/heic':'heic','image/heif':'heif','image/bmp':'bmp',
      'image/tiff':'tif','image/svg+xml':'svg'
    };
    const originalExt = str(image.name).match(/\.([a-z0-9]{2,5})$/i);
    const ext = extensions[image.mime] || (originalExt ? originalExt[1].toLowerCase() : 'jpg');
    const length = visualDimension(field(record,'length'));
    const width = visualDimension(field(record,'width'));
    const name = visualSafeFilenamePart(getColorCombined(record));
    const dims = visualSafeFilenamePart(length === '?' ? 'Unknown' : length,24) +
      ' x ' + visualSafeFilenamePart(width === '?' ? 'Unknown' : width,24) + ' in';
    const recNumber = visualSafeFilenamePart(getId(record),24);
    const numbered = total > 1 ? ' - Photo ' + (index + 1) : '';
    return name + ' - ' + dims + ' - Record ' + recNumber + numbered + '.' + ext;
  }
  function renderVisualLightbox() {
    const current = visualState.lightbox;
    if (!visualState.active || !current) return;
    const root = document.getElementById('zmwm-visual-lightbox');
    if (!root) return;
    const image = current.images[current.index];
    const blobUrl = visualState.urls.get(image.key);
    const failure = visualState.failed.has(image.key);
    const title = root.querySelector('#zmwm-visual-lightbox-title');
    const meta = root.querySelector('#zmwm-visual-lightbox-meta');
    const stage = root.querySelector('#zmwm-visual-lightbox-image');
    const caption = root.querySelector('#zmwm-visual-lightbox-caption');
    const download = root.querySelector('[data-visual-action="download-photo"]');
    const previous = root.querySelector('[data-visual-action="previous-photo"]');
    const next = root.querySelector('[data-visual-action="next-photo"]');
    const thumbnails = root.querySelector('#zmwm-visual-lightbox-thumbnails');
    if (!title || !meta || !stage || !caption || !download || !thumbnails) return;
    const name = getColorCombined(current.record);
    title.textContent = name;
    meta.textContent = visualDimension(field(current.record,'length')) + ' × ' +
      visualDimension(field(current.record,'width')) + ' in · Record #' + getId(current.record);
    const number = current.index + 1;
    const total = current.images.length;
    caption.textContent = image.kind + ' · Photo ' + number + ' of ' + total;
    download.disabled = !blobUrl;
    download.title = blobUrl ? visualDownloadFilename(current.record,image,current.index,total) :
      'Wait for photo to finish loading';
    if (previous) previous.disabled = total < 2;
    if (next) next.disabled = total < 2;
    if (blobUrl) {
      stage.innerHTML = '<img src="' + esc(blobUrl) + '" alt="' + esc(name) +
        ', photo ' + number + ' of ' + total + '">';
    } else {
      stage.innerHTML = '<div class="zmwm-visual-lightbox-message">' +
        (failure ? 'Photo could not be loaded.' : 'Loading photo…') + '</div>';
    }
    const scroll = thumbnails.scrollLeft;
    thumbnails.innerHTML = current.images.map((item,i) => {
      const small = visualState.urls.get(item.key);
      return '<button type="button" class="zmwm-visual-lightbox-thumb' +
        (i === current.index ? ' is-current' : '') + '" data-visual-action="jump-photo"' +
        ' data-visual-index="' + i + '" aria-label="View ' + esc(item.kind) +
        ' ' + (i + 1) + ' of ' + total + '" aria-pressed="' + (i === current.index) + '">' +
        (small ? '<img src="' + esc(small) + '" alt="">' :
          '<span>' + (i + 1) + '</span>') + '</button>';
    }).join('');
    thumbnails.scrollLeft = scroll;
    if (!blobUrl && !failure) requestVisualPhoto(image.key,true);
  }
  function openVisualLightbox(recordId, trigger) {
    const record = visualState.records.find(item => getId(item) === str(recordId));
    const images = record ? visualImages(record) : [];
    const root = document.getElementById('zmwm-visual-lightbox');
    if (!root || !images.length) return;
    visualState.lightbox = {record,images,index:0,trigger};
    root.hidden = false;
    renderVisualLightbox();
    const close = root.querySelector('[data-visual-action="close-photo"].zmwm-visual-lightbox-close');
    if (close) close.focus({preventScroll:true});
  }
  function closeVisualLightbox(restoreFocus = true) {
    const open = visualState.lightbox;
    const root = document.getElementById('zmwm-visual-lightbox');
    if (root) root.hidden = true;
    visualState.lightbox = null;
    visualState.touchStartX = null;
    if (restoreFocus && open && open.trigger && open.trigger.isConnected)
      open.trigger.focus({preventScroll:true});
  }
  function navigateVisualLightbox(delta) {
    const current = visualState.lightbox;
    if (!current || current.images.length < 2) return;
    current.index = (current.index + delta + current.images.length) % current.images.length;
    renderVisualLightbox();
  }
  function visualLightboxKeydown(event) {
    if (!visualState.lightbox) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeVisualLightbox();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateVisualLightbox(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateVisualLightbox(-1);
    } else if (event.key === 'Tab') {
      const root = document.getElementById('zmwm-visual-lightbox');
      if (!root) return;
      const focusable = [...root.querySelectorAll('button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }
  function downloadVisualLightboxPhoto() {
    const current = visualState.lightbox;
    if (!current) return;
    const image = current.images[current.index];
    const url = visualState.urls.get(image.key);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url; // authenticated Kintone image already loaded as a local blob
    link.download = visualDownloadFilename(current.record,image,current.index,current.images.length);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Keyset pagination avoids Kintone's 10,000-record offset limit. All reads
  // are GETs from the inventory app; no cursor resources or writes are created.
  async function fetchVisualRecords() {
    const records = [];
    let last = 0;
    for (let page=0;page<80;page++) {
      const cond = 'inventory_status in ("In")' + (last ? ' and $id > ' + last : '');
      const data = await readOnlyApi(SETTINGS.INVENTORY_APP_ID,VISUAL_FIELDS,
        cond + ' order by $id asc limit ' + SETTINGS.PAGE_SIZE);
      const batch = Array.isArray(data.records) ? data.records : [];
      records.push(...batch);
      if (batch.length < SETTINGS.PAGE_SIZE) return records;
      const id = Number(getId(batch[batch.length-1]));
      if (!Number.isSafeInteger(id) || id <= last) throw new Error('Unable to page inventory record IDs.');
      last = id;
    }
    throw new Error('Too many records for this view. Narrow the scope before retrying.');
  }
  async function loadVisualSearch() {
    if (!visualState.active) return;
    closeVisualLightbox();
    const token = ++visualState.token;
    visualState.loading = true;
    visualState.error = '';
    renderVisualFeedback();
    renderVisualResults();
    try {
      const records = await fetchVisualRecords();
      if (token !== visualState.token || !visualState.active) return;
      visualState.records = records;
      visualState.updatedAt = new Date();
      visualState.shown = VISUAL_PAGE_SIZE;
    } catch (error) {
      if (token !== visualState.token || !visualState.active) return;
      visualState.records = [];
      visualState.error = describeError(error);
    } finally {
      if (token === visualState.token && visualState.active) {
        visualState.loading = false;
        renderVisualFeedback();
        renderVisualResults();
      }
    }
  }
  function resetVisualFilters() {
    for (const prop of ['search','kind','sale','minLength','minWidth']) visualState[prop] = '';
    visualState.photosOnly = false;
    visualState.shown = VISUAL_PAGE_SIZE;
    const root = document.getElementById('zmwm-visual-root');
    if (!root) return;
    for (const id of ['search','kind','sale','min-length','min-width']) {
      const node = root.querySelector('#zmwm-visual-' + id);
      if (node) node.value = '';
    }
    const checkbox = root.querySelector('#zmwm-visual-photos-only');
    if (checkbox) checkbox.checked = false;
    renderVisualResults();
  }
  function stopVisualSearch() {
    closeVisualLightbox(false);
    if (visualState.keydownHandler) {
      document.removeEventListener('keydown',visualState.keydownHandler);
      visualState.keydownHandler = null;
    }
    visualState.token++;
    visualState.active = false;
    if (visualState.observer) { visualState.observer.disconnect(); visualState.observer = null; }
    visualState.inflight.forEach(xhr => xhr.abort());
    visualState.inflight.clear();
    visualState.pending = [];
    visualState.pendingKeys.clear();
    visualState.urls.forEach(url => URL.revokeObjectURL(url));
    visualState.urls.clear();
    visualState.failed.clear();
    // Drop cached inventory when leaving Visual Search; never retain
    // per-piece data in memory across unrelated Kintone views.
    visualState.records = [];
    visualState.updatedAt = null;
  }
  function startVisualSearch() {
    stopVisualSearch();
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    visualState.active = true;
    visualState.records = [];
    visualState.updatedAt = null;
    visualState.error = '';
    for (const name of ['search','kind','sale','minLength','minWidth']) visualState[name] = '';
    visualState.photosOnly = false;
    visualState.shown = VISUAL_PAGE_SIZE;
    root.innerHTML = visualShell();
    const ui = root.querySelector('#zmwm-visual-root');
    if (!ui) return;
    visualState.keydownHandler = visualLightboxKeydown;
    document.addEventListener('keydown',visualState.keydownHandler);
    ui.addEventListener('touchstart',event => {
      if (!visualState.lightbox || !event.target.closest('.zmwm-visual-lightbox-stage')) return;
      visualState.touchStartX = event.touches[0] ? event.touches[0].clientX : null;
    },{passive:true});
    ui.addEventListener('touchend',event => {
      if (!visualState.lightbox || visualState.touchStartX === null ||
          !event.target.closest('.zmwm-visual-lightbox-stage')) return;
      const touch = event.changedTouches[0];
      const distance = touch ? touch.clientX - visualState.touchStartX : 0;
      visualState.touchStartX = null;
      if (Math.abs(distance) >= 55) navigateVisualLightbox(distance < 0 ? 1 : -1);
    },{passive:true});
    ui.addEventListener('input',event => {
      const names = {
        'zmwm-visual-search':'search',
        'zmwm-visual-min-length':'minLength',
        'zmwm-visual-min-width':'minWidth'
      };
      const key = names[event.target.id];
      if (key) {
        visualState[key] = event.target.value;
        visualState.shown = VISUAL_PAGE_SIZE;
        renderVisualResults();
      }
    });
    ui.addEventListener('change',event => {
      const names = {'zmwm-visual-kind':'kind','zmwm-visual-sale':'sale'};
      const key = names[event.target.id];
      if (key) {
        visualState[key] = event.target.value;
      } else if (event.target.id === 'zmwm-visual-photos-only') {
        visualState.photosOnly = event.target.checked;
      } else return;
      visualState.shown = VISUAL_PAGE_SIZE;
      renderVisualResults();
    });
    ui.addEventListener('click',event => {
      const button = event.target.closest('[data-visual-action]');
      if (!button) return;
      const action = button.dataset.visualAction;
      if (action === 'open-photo') openVisualLightbox(button.dataset.visualId,button);
      if (action === 'close-photo') closeVisualLightbox();
      if (action === 'next-photo') navigateVisualLightbox(1);
      if (action === 'previous-photo') navigateVisualLightbox(-1);
      if (action === 'jump-photo' && visualState.lightbox) {
        const index = Number(button.dataset.visualIndex);
        if (Number.isInteger(index) && index >= 0 &&
            index < visualState.lightbox.images.length) {
          visualState.lightbox.index = index;
          renderVisualLightbox();
        }
      }
      if (action === 'download-photo') downloadVisualLightboxPhoto();
      if (action === 'refresh') loadVisualSearch();
      if (action === 'reset') resetVisualFilters();
      if (action === 'more') {
        visualState.shown += VISUAL_PAGE_SIZE;
        renderVisualResults();
      }
    });
    loadVisualSearch();
  }



  // Nothing runs on other Kintone views; no changes to inventory records.
  if (typeof window.kintone === 'undefined' || !kintone.events) return;
  kintone.events.on(['app.record.index.show','mobile.app.record.index.show'], event => {
    const matches = event.viewName === 'Visual Search' &&
      (event.viewType === 'custom' || event.viewType === 'CUSTOM' || !event.viewType);
    if (!matches) {
      if (visualState.active) stopVisualSearch();
      return event;
    }
    if (!document.getElementById(ROOT_ID)) return event;
    startVisualSearch();
    return event;
  });
})();
