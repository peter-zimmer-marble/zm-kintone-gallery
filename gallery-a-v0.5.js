/*
 * ZM Inventory — Inside Slab Gallery A map (Kintone Custom View, v0.5)
 * Copyright (c) 2026 ZM. Read-only: GET requests only, no data writes.
 * Install inside Rack app (or its test copy). Custom View name must match VIEW_NAME.
 * No external libraries, tokens, or hosting needed.
 */
(function () {
  'use strict';

  const SETTINGS = {
    VIEW_NAME: 'Inside Slab Gallery',
    INVENTORY_APP_ID: 6,
    RACK_APP_ID: 7,
    PAGE_SIZE: 500,
    MAX_PAGES: 20,
    PHOTO_LIMIT_PER_RACK: 12
  };

  // Gallery geometry comes from the customer-provided Inside Slab Gallery A drawing.
  // Coordinate positions are reference-diagram values, not surveyed measurements.
  const Z_WALL = ['Z-1A', 'Z-2A', 'Z-3A', 'Z-4A'];
  const Z_FLOOR = [5, 6, 7, 8, 9, 10].map(n => ({ number: n, a: `Z-${n}A`, b: `Z-${n}B` }));
  const G_FLOOR = [54, 56, 58, 62, 64].map(n => ({ number: n, a: `G-${n}A`, b: `G-${n}B` }));
  const Z_NORTH = ['Z-11A'];
  // In the historic export, some pieces use an unsided G rack code or Z-11B.
  // Keep these records visible but don't imply a physical face that wasn't confirmed.
  const UNMAPPED = ['Z-11B', ...G_FLOOR.map(p => `G-${p.number}`)];
  const MAPPED = [...Z_WALL, ...Z_FLOOR.flatMap(p => [p.a,p.b]), ...G_FLOOR.flatMap(p => [p.a,p.b]), ...Z_NORTH];
  const QUERY_RACKS = [...new Set([...MAPPED, ...UNMAPPED])];

  // Original Google Drawing PDF coordinate space (points): 1203 by 1045.
  // Individual face locations are traced from the provided vector shapes.
  const PLAN_WIDTH = 1203;
  const PLAN_HEIGHT = 1045;
  const PLAN_FACES = [{"rack":"Z-1A","x":1.5,"y":0.8,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-2A","x":274.5,"y":0.8,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-3A","x":547.4,"y":1.4,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-4A","x":820.3,"y":0.1,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-5B","x":1.6,"y":178.1,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-6B","x":274.5,"y":178.1,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-7B","x":547.5,"y":178.1,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-8B","x":820.4,"y":176.8,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-5A","x":1.6,"y":306.9,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-6A","x":274.5,"y":306.9,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-7A","x":547.5,"y":308.2,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-8A","x":820.5,"y":306.9,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"G-54A","x":2.1,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-54B","x":77.4,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-56A","x":161.9,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-56B","x":237.1,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-58A","x":325.5,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-58B","x":400.7,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-62A","x":484.7,"y":484.9,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-62B","x":560.0,"y":484.9,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-64A","x":644.2,"y":484.9,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"G-64B","x":719.4,"y":484.9,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"Z-9B","x":820.5,"y":484.9,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-11A","x":1011.9,"y":484.7,"w":64.7,"h":111.5,"tone":"blue"},{"rack":"Z-11B","x":1087.1,"y":484.6,"w":64.7,"h":111.5,"tone":"violet"},{"rack":"Z-9A","x":820.5,"y":615.0,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-10B","x":820.5,"y":803.6,"w":106.7,"h":111.8,"tone":"blue"},{"rack":"Z-10A","x":820.5,"y":933.7,"w":106.7,"h":111.8,"tone":"yellow"}];
  const PLAN_SPINES = [{"x":1.5,"y":288.5,"w":106.7,"h":18.4},{"x":274.5,"y":288.5,"w":106.7,"h":18.4},{"x":820.4,"y":288.5,"w":106.7,"h":18.4},{"x":547.5,"y":289.8,"w":106.7,"h":18.4},{"x":1076.5,"y":484.6,"w":10.6,"h":111.5},{"x":66.7,"y":484.7,"w":10.6,"h":111.5},{"x":226.5,"y":484.7,"w":10.6,"h":111.5},{"x":390.1,"y":484.7,"w":10.6,"h":111.5},{"x":549.3,"y":484.9,"w":10.6,"h":111.5},{"x":708.8,"y":484.9,"w":10.6,"h":111.5},{"x":820.5,"y":596.6,"w":106.7,"h":18.4},{"x":820.4,"y":915.3,"w":106.7,"h":18.4}];
  const GALLERY_LOGO = 'data:image/jpeg;base64,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';
  const pct = (v, total) => (v / total * 100).toFixed(5) + '%';
  const isNorthSouthFace = rack => /^G-\d+[AB]$/.test(str(rack)) || /^Z-11[AB]$/.test(str(rack));

  // One consistent 8-unit gray divider throughout the reference drawing.
  // This is slightly thinner than the earlier 10-unit G-series separators.
  // Every A/B face remains an independent Kintone rack selection target.
  const DIVIDER_THICKNESS = 8;
  const G_FACE_WIDTH = 70.5;
  const G_PAIR_ANCHORS = new Map(G_FLOOR.map(pair =>
    [pair.number, PLAN_FACES.find(face => face.rack === pair.a)]));

  // The Z-11 faces had previously been independently enlarged until they
  // overlapped and obscured their original divider. Keep them as a true pair.
  const Z11_A = PLAN_FACES.find(face => face.rack === 'Z-11A');
  const Z11_B = PLAN_FACES.find(face => face.rack === 'Z-11B');
  const Z11_WIDTH = Z11_A.w * 1.20;
  const Z11_PAIR_LEFT = (Z11_A.x + Z11_B.x + Z11_B.w) / 2 -
    (2 * Z11_WIDTH + DIVIDER_THICKNESS) / 2;

  // For horizontal Z-series racks, fill the space formerly occupied by the
  // thick original gray spine with a thinner centered separator, without
  // moving the outside edge of either face or introducing a white gap.
  const Z_HORIZONTAL_FACES = new Map();
  const Z_HORIZONTAL_SPINES = [];
  Z_FLOOR.forEach(pair => {
    const upper = PLAN_FACES.find(face => face.rack === pair.b);
    const lower = PLAN_FACES.find(face => face.rack === pair.a);
    if (!upper || !lower) return;
    const upperBottom = upper.y + upper.h;
    const lowerBottom = lower.y + lower.h;
    const spineY = (upperBottom + lower.y - DIVIDER_THICKNESS) / 2;
    Z_HORIZONTAL_FACES.set(pair.b, { ...upper, h: spineY - upper.y });
    Z_HORIZONTAL_FACES.set(pair.a, {
      ...lower, y: spineY + DIVIDER_THICKNESS,
      h: lowerBottom - (spineY + DIVIDER_THICKNESS)
    });
    Z_HORIZONTAL_SPINES.push({ upper, y: spineY });
  });

  const displayBox = box => {
    if (!box || !box.rack) return box;
    const g = /^G-(\d+)([AB])$/.exec(str(box.rack));
    if (g) {
      const first = G_PAIR_ANCHORS.get(Number(g[1]));
      if (first) {
        const h = first.h * 1.08;
        return {
          ...box,
          x: first.x + (g[2] === 'B' ? G_FACE_WIDTH + DIVIDER_THICKNESS : 0),
          y: first.y - (h - first.h) / 2,
          w: G_FACE_WIDTH,
          h
        };
      }
    }
    const z11 = /^Z-11([AB])$/.exec(str(box.rack));
    if (z11) {
      const h = Z11_A.h * 1.08;
      return {
        ...box,
        x: Z11_PAIR_LEFT + (z11[1] === 'B' ? Z11_WIDTH + DIVIDER_THICKNESS : 0),
        y: Z11_A.y - (h - Z11_A.h) / 2,
        w: Z11_WIDTH,
        h
      };
    }
    return Z_HORIZONTAL_FACES.get(box.rack) || box;
  };

  const displaySpine = spine => {
    // G-series vertical A/B dividers, perfectly flush with both enlarged faces.
    for (const first of G_PAIR_ANCHORS.values()) {
      if (first && Math.abs(spine.x - (first.x + first.w)) < .75 &&
          Math.abs(spine.y - first.y) < .75) {
        const shown = displayBox(first);
        return { ...spine, x: shown.x + shown.w, y: shown.y,
          w: DIVIDER_THICKNESS, h: shown.h };
      }
    }
    // The same thickness and flush alignment for Z-11A / Z-11B.
    if (Math.abs(spine.x - (Z11_A.x + Z11_A.w)) < .75 &&
        Math.abs(spine.y - Z11_A.y) < .75) {
      const shown = displayBox(Z11_A);
      return { ...spine, x: shown.x + shown.w, y: shown.y,
        w: DIVIDER_THICKNESS, h: shown.h };
    }
    // Z-5 through Z-10 separators are horizontal, but have the same thickness.
    const pair = Z_HORIZONTAL_SPINES.find(p =>
      Math.abs(spine.x - p.upper.x) < 1.5 &&
      Math.abs(spine.y - (p.upper.y + p.upper.h)) < 2.5);
    if (pair) {
      return { ...spine, x: pair.upper.x, y: pair.y,
        w: pair.upper.w, h: DIVIDER_THICKNESS };
    }
    return spine;
  };

  const position = box => {
    const drawBox = displayBox(box);
    return 'left:' + pct(drawBox.x, PLAN_WIDTH) + ';top:' + pct(drawBox.y, PLAN_HEIGHT) +
      ';width:' + pct(drawBox.w, PLAN_WIDTH) + ';height:' + pct(drawBox.h, PLAN_HEIGHT) + ';';
  };
  const REFERENCE_ONLY = new Set(['Z-11B']);

  const ROOT_ID = 'zm-warehouse-map-root';

  const state = {
    records: [],
    rackMeta: new Map(),
    selected: null,
    search: '',
    sale: '',
    kind: '',
    zoom: 1,
    loading: false,
    error: '',
    warning: '',
    updatedAt: null,
    renderToken: 0,
    photoUrls: new Map(),
    photoInflight: new Set(),
    initialized: false
  };

  const DEMO = Boolean(window.ZM_MAP_DEMO);
  const esc = value => String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const field = (record, key) => record && record[key] && record[key].value !== undefined ? record[key].value : '';
  const str = value => value == null ? '' : String(value);
  const normalizeRack = value => str(value).trim().toUpperCase();
  const num = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const toText = value => str(value).trim();
  const getId = record => str(field(record, '$id') || field(record, 'Record_number'));
  const getRack = record => normalizeRack(field(record, 'rack'));
  const getColor = record => toText(field(record, 'color_combined')) || [field(record, 'color'), field(record, 'zmv_num')].map(toText).filter(Boolean).join(' ');
  const getSale = record => toText(field(record, 'sale_status'));
  const isRemnant = record => /rem/i.test(str(field(record, 'type')));
  const isSlab = record => /slab/i.test(str(field(record, 'type')));

  function readOnlyApi(app, fields, query) {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app,
      query,
      fields
    });
  }

  async function getRecords(app, fields, filterQuery) {
    const result = [];
    for (let page = 0; page < SETTINGS.MAX_PAGES; page++) {
      const offset = page * SETTINGS.PAGE_SIZE;
      const query = `${filterQuery} order by $id asc limit ${SETTINGS.PAGE_SIZE} offset ${offset}`;
      const response = await readOnlyApi(app, fields, query);
      const batch = Array.isArray(response.records) ? response.records : [];
      result.push(...batch);
      if (batch.length < SETTINGS.PAGE_SIZE) return result;
    }
    throw new Error('Too many matching records to load safely. Narrow the query or switch to cursor paging.');
  }

  function describeError(error) {
    const detail = error && (error.message || error.code);
    return detail ? str(detail) : 'Request failed. Check record-view permissions and try again.';
  }

  async function load() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const token = ++state.renderToken;
    state.loading = true;
    state.error = '';
    state.warning = '';
    render();
    const rackList = QUERY_RACKS.map(r => `"${r}"`).join(', ');
    const ids = `rack in (${rackList})`;
    const inventoryFields = [
      '$id', 'Record_number', 'rack', 'color', 'color_combined', 'zmv_num', 'finish',
      'type', 'length', 'width', 'shape', 'thickness', 'sale_status', 'material_status',
      'inventory_status', 'job', 'lot_num', 'slab_num', 'staging_status', 'notes',
      'in_out_note', 'exact_picture', 'example_picture'
    ];
    const rackFields = ['$id', 'rack', 'rack_type', 'location', 'manual_number'];
    try {
      const records = await getRecords(SETTINGS.INVENTORY_APP_ID, inventoryFields,
        `${ids} and inventory_status in ("In")`);
      if (token !== state.renderToken) return;
      state.records = records.filter(r => QUERY_RACKS.includes(getRack(r)));
      state.updatedAt = new Date();
      state.error = '';
      if (!state.selected || !QUERY_RACKS.includes(state.selected)) {
        state.selected = PLAN_FACES.map(f => f.rack).find(rack => MAPPED.includes(rack) && state.records.some(r => getRack(r) === rack)) || MAPPED[0];
      }
      // Rack metadata is useful but optional. Inventory remains usable if this call fails.
      try {
        const racks = await getRecords(SETTINGS.RACK_APP_ID, rackFields, ids);
        if (token !== state.renderToken) return;
        state.rackMeta = new Map(racks.map(r => [getRack(r), r]));
      } catch (metaError) {
        state.rackMeta = new Map();
        state.warning = 'Rack attributes could not be loaded; inventory is still available.';
      }
    } catch (error) {
      if (token !== state.renderToken) return;
      state.error = describeError(error);
      state.records = [];
      state.rackMeta = new Map();
    } finally {
      if (token === state.renderToken) {
        state.loading = false;
        render();
      }
    }
  }

  function matchesFilters(record) {
    if (state.sale && getSale(record) !== state.sale) return false;
    if (state.kind === 'slab' && !isSlab(record)) return false;
    if (state.kind === 'remnant' && !isRemnant(record)) return false;
    const search = state.search.toLocaleLowerCase().trim();
    if (!search) return true;
    const haystack = [getId(record), getColor(record), getRack(record),
      field(record, 'color'), field(record, 'zmv_num'), field(record, 'type'),
      field(record, 'thickness'), field(record, 'job'), field(record, 'lot_num'),
      field(record, 'slab_num'), field(record, 'notes'), field(record, 'in_out_note')]
      .map(v => str(v).toLocaleLowerCase()).join(' ');
    return search.split(/\s+/).every(term => haystack.includes(term));
  }

  function groups() {
    const all = new Map(QUERY_RACKS.map(r => [r, []]));
    const filtered = new Map(QUERY_RACKS.map(r => [r, []]));
    for (const r of state.records) {
      const rack = getRack(r);
      if (!all.has(rack)) continue;
      all.get(rack).push(r);
      if (matchesFilters(r)) filtered.get(rack).push(r);
    }
    return { all, filtered };
  }


  function normalizeColorCombined(value) {
    return str(value).replace(/\s+/g, ' ').trim();
  }

  function getColorCombined(record) {
    return normalizeColorCombined(field(record, 'color_combined')) || normalizeColorCombined(getColor(record)) || '(Color not specified)';
  }

  function summarizeByColorCombined(records) {
    const counts = new Map();
    for (const record of records) {
      const key = getColorCombined(record);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  }

  function rackPreview(records) {
    const groups = summarizeByColorCombined(records);
    return {
      groups,
      top: groups.slice(0, 2),
      moreCount: Math.max(0, groups.length - 2)
    };
  }

  function rackPreviewMarkup(records) {
    const preview = rackPreview(records);
    if (!preview.groups.length) return '<span class="zmwm-layout-empty-note">Empty</span>';
    return `<div class="zmwm-layout-summary">${preview.top.map(([name, count]) =>
      `<span class="zmwm-layout-summary-line"><span class="zmwm-layout-summary-name">${esc(name)}</span><span class="zmwm-layout-summary-count">×${count}</span></span>`
    ).join('')}${preview.moreCount ? `<span class="zmwm-layout-summary-more">+${preview.moreCount} more</span>` : ''}</div>`;
  }

  function rackPreviewTitle(records) {
    return summarizeByColorCombined(records).slice(0, 8).map(([name, count]) => `${name} (${count})`).join('; ');
  }

  function faceHtml(rack, g) {
    const all = (g.all.get(rack) || []).length;
    const visible = (g.filtered.get(rack) || []).length;
    const activeFilter = Boolean(state.search || state.sale || state.kind);
    const selected = state.selected === rack;
    const classes = [
      'zmwm-face', selected ? 'is-selected' : '', !visible ? 'is-dim' : '',
      all ? 'has-pieces' : 'is-empty'
    ].filter(Boolean).join(' ');
    const display = activeFilter ? `${visible} / ${all}` : `${all}`;
    return `<button type="button" class="${classes}" data-rack="${esc(rack)}" title="${esc(rack)} — ${all} pieces" aria-label="${esc(rack)}: ${all} pieces. Inspect rack." aria-pressed="${selected}">
      <span class="zmwm-face-name">${esc(rack)}</span><span class="zmwm-face-count">${display}</span></button>`;
  }

  // On the reference drawing, every physical rack face remains independently clickable.
  function layoutFaceHtml(face, g) {
    const rack = face.rack;
    const allRecords = g.all.get(rack) || [];
    const filteredRecords = g.filtered.get(rack) || [];
    const all = allRecords.length;
    const visible = filteredRecords.length;
    const activeFilter = Boolean(state.search || state.sale || state.kind);
    const selected = state.selected === rack;
    const flagged = REFERENCE_ONLY.has(rack);
    const northSouth = isNorthSouthFace(rack);
    const previewRecords = activeFilter ? filteredRecords : allRecords;
    const previewTitle = rackPreviewTitle(activeFilter ? filteredRecords : allRecords) || 'No pieces assigned';
    const classes = ['zmwm-layout-face', 'tone-' + face.tone, selected ? 'is-selected' : '',
      activeFilter && !visible ? 'is-dim' : '', visible ? 'has-match' : '',
      flagged ? 'is-reference' : '', northSouth ? 'is-northsouth' : '', all ? 'has-pieces' : 'is-empty'].filter(Boolean).join(' ');
    const count = activeFilter ? visible + '/' + all : '' + all;
    return `<button type="button" class="${classes}" style="${position(face)}" data-rack="${esc(rack)}"
      aria-label="${esc(rack)}: ${all} pieces${flagged ? '. Reference only, not confirmed usable' : ''}. Top colors: ${esc(previewTitle)}. Open rack details."
      title="${esc(rack)} — ${all} pieces${flagged ? ' · reference only' : ''}${previewTitle ? ' · ' + esc(previewTitle) : ''}"
      aria-pressed="${selected}"><span class="zmwm-layout-name">${esc(rack)}</span>${rackPreviewMarkup(previewRecords)}<span class="zmwm-layout-qty">${count}</span>
      ${flagged ? `<span class="zmwm-layout-warning" aria-hidden="true">!</span>` : ''}</button>`;
  }

  function shellHtml() {
    return `<main class="zmwm-app">
      <header class="zmwm-head">
        <div class="zmwm-head-left"><div class="zmwm-mark">ZM<span> / </span>OPS</div>
          <div><div class="zmwm-eyebrow">INVENTORY / LOCATION INTELLIGENCE</div><h1>Inside Slab Gallery</h1>
          <p>Explore material by its physical rack position.</p></div>
        </div>
        <div class="zmwm-head-tools"><span class="zmwm-readonly">READ ONLY</span><button type="button" class="zmwm-button" data-action="refresh">↻ Refresh</button></div>
      </header>
      <div class="zmwm-feedback" id="zmwm-feedback" role="status" aria-live="polite"></div>
      <section class="zmwm-overview" id="zmwm-overview"></section>
      <section class="zmwm-filterbar" aria-label="Rack map filters">
        <label class="zmwm-search-wrap"><span class="zmwm-magnifier">⌕</span>
          <input type="search" id="zmwm-search" placeholder="Search color, version, job, rack, record #..." aria-label="Search inventory" autocomplete="off" />
        </label>
        <label class="zmwm-select-wrap"><span>Availability</span><select id="zmwm-sale"><option value="">All statuses</option><option value="Avl">Available</option><option value="Hold">Hold</option><option value="SOLD">Sold</option></select></label>
        <label class="zmwm-select-wrap"><span>Material type</span><select id="zmwm-kind"><option value="">All pieces</option><option value="slab">Slabs</option><option value="remnant">Remnants</option></select></label>
        <button type="button" class="zmwm-clear" data-action="clear">Clear</button>
      </section>
      <div class="zmwm-content">
        <section class="zmwm-map-wrap" aria-label="Warehouse schematic">
          <div class="zmwm-content-heading"><div><h2>Gallery A <span class="zmwm-subtle">/ Main Showroom</span></h2><p>Floor arrangement traced from your Google Drawing. Click a rack face for live inventory.</p></div><span class="zmwm-north">← NORTH</span></div>
          <div id="zmwm-plan" class="zmwm-plan"></div>
          <div id="zmwm-unmapped" class="zmwm-unmapped"></div>
        </section>
        <aside id="zmwm-inspector" class="zmwm-inspector" aria-label="Selected rack inventory"></aside>
      </div>
      <footer class="zmwm-footer">Rack arrangement follows the supplied Gallery A reference drawing. Not surveyed or to scale. Face colors follow the drawing, not inventory status. No data is written to Kintone.</footer>
    </main>`;
  }

  function renderOverview(g) {
    const root = document.getElementById('zmwm-overview');
    if (!root) return;
    const mappedRecords = MAPPED.reduce((count, rack) => count + (g.all.get(rack) || []).length, 0);
    const unmappedRecords = UNMAPPED.reduce((count, rack) => count + (g.all.get(rack) || []).length, 0);
    const matchingRecords = [...g.filtered.values()].reduce((sum, records) => sum + records.length, 0);
    root.innerHTML = [
      { title: 'USABLE FACES', value: MAPPED.length, meta: 'Plus Z-11B reference face' },
      { title: 'PHYSICAL PIECES', value: mappedRecords, meta: 'In mapped rack faces' },
      { title: 'MATCHES', value: matchingRecords, meta: 'Current filters · includes unplaced' },
      { title: 'NEEDS MAPPING', value: unmappedRecords, meta: 'Unsided or unconfirmed face' }
    ].map(item => `<article class="zmwm-stat"><span>${item.title}</span><strong>${item.value.toLocaleString()}</strong><small>${item.meta}</small></article>`).join('');
  }

  function renderFeedback() {
    const target = document.getElementById('zmwm-feedback');
    if (!target) return;
    if (state.error) {
      target.innerHTML = `<div class="zmwm-message zmwm-error"><strong>Could not load live inventory.</strong> ${esc(state.error)} <button type="button" data-action="refresh">Try again</button></div>`;
    } else if (state.loading) {
      target.innerHTML = `<div class="zmwm-message">Loading rack assignments from Kintone…</div>`;
    } else {
      const updated = state.updatedAt ? state.updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
      target.innerHTML = `<div class="zmwm-loaded"><span class="zmwm-dot"></span>${DEMO ? 'OCT 14 SNAPSHOT PREVIEW' : 'LIVE KINTONE DATA'} <span class="zmwm-separator">·</span> Refreshed ${esc(updated)}${state.warning ? ' · ' + esc(state.warning) : ''}</div>`;
    }
  }

  function renderPlan(g) {
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    // Rebuilding the map on rack click or filtering must not erase the mobile pan position.
    const priorScroll = root.querySelector('.zmwm-reference-scroll');
    const priorLeft = priorScroll ? priorScroll.scrollLeft : 0;
    const beforeZoom = priorScroll ? Number(priorScroll.dataset.zoom || '1') : state.zoom;
    const spineHTML = PLAN_SPINES.map(box => `<span class="zmwm-layout-spine" style="${position(displaySpine(box))}" aria-hidden="true"></span>`).join('');
    const faceHTML = PLAN_FACES.map(face => layoutFaceHtml(face,g)).join('');
    const zoomWidth = Math.round(980 * state.zoom);
    root.innerHTML = `<div class="zmwm-reference-controls">
      <div class="zmwm-reference-context"><span class="zmwm-reference-tag">REFERENCE DRAWING</span>
        <span>27 usable faces · Z-11B shown for orientation only</span></div>
      <div class="zmwm-reference-zoom" aria-label="Map zoom">
        <button type="button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out" ${state.zoom <= .76 ? 'disabled' : ''}>−</button>
        <span>${Math.round(state.zoom*100)}%</span>
        <button type="button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in" ${state.zoom >= 1.59 ? 'disabled' : ''}>+</button>
      </div>
    </div>
    <div class="zmwm-reference-scroll" data-zoom="${state.zoom}" tabindex="0" aria-label="Scroll horizontally to navigate the rack map on smaller screens">
      <div class="zmwm-reference-board" style="min-width:${zoomWidth}px" role="group" aria-label="Gallery A plan. North points to the left.">
        ${spineHTML}${faceHTML}
        <div class="zmwm-drawing-title">Gallery A <span>(Main Showroom)</span></div>
        <div class="zmwm-drawing-north"><span aria-hidden="true">⬅</span> North</div>
        <img class="zmwm-drawing-logo" alt="ZM logo" src="${GALLERY_LOGO}">
      </div>
    </div>
    <div class="zmwm-reference-legend"><span><i class="zmwm-swatch sw-blue"></i>Rack face</span>
      <span><i class="zmwm-swatch sw-flagged"></i>Reference only</span>
      <span><i class="zmwm-swatch sw-selected"></i>Selected</span>
      <small>Yellow and lavender follow the original drawing; they are not status indicators. Swipe horizontally on mobile.</small></div>`;
    const nextScroll = root.querySelector('.zmwm-reference-scroll');
    if (nextScroll) nextScroll.scrollLeft = beforeZoom === state.zoom ? priorLeft : priorLeft * state.zoom / beforeZoom;
    const issues = document.getElementById('zmwm-unmapped');
    if (issues) {
      const unplaced = UNMAPPED.filter(r => (g.all.get(r) || []).length);
      issues.innerHTML = unplaced.length ? `<div class="zmwm-unmapped-head"><span>UNCONFIRMED ASSIGNMENTS</span><small>These records use a rack code without a confirmed usable face</small></div><div class="zmwm-unmapped-list">${unplaced.map(r => faceHtml(r,g)).join('')}</div>` : '';
    }
  }

  function photoFor(r) {
    for (const key of ['exact_picture', 'example_picture']) {
      const attachments = field(r, key);
      if (!Array.isArray(attachments)) continue;
      const photo = attachments.find(f => /^image\//i.test(str(f.contentType)) && f.fileKey);
      if (photo) return photo;
    }
    return null;
  }

  function statusClass(sale) {
    if (sale === 'SOLD') return 'sold';
    if (sale === 'Hold') return 'hold';
    if (sale === 'Avl') return 'available';
    return 'unknown';
  }

  function photoHTML(r) {
    const photo = photoFor(r);
    if (!photo) return `<div class="zmwm-no-photo" aria-label="No photograph">▧</div>`;
    const key = str(photo.fileKey);
    const url = state.photoUrls.get(key);
    return url ? `<img src="${esc(url)}" alt="Stone photo" loading="lazy">` :
      `<div class="zmwm-image-wait" data-photo-key="${esc(key)}">PHOTO</div>`;
  }

  function itemHTML(r) {
    const recordId = getId(r);
    const material = getColor(r) || '(Color not specified)';
    const sale = getSale(r) || 'Not set';
    const length = toText(field(r, 'length')) || '?';
    const width = toText(field(r, 'width')) || '?';
    const type = toText(field(r, 'type')) || 'Stone';
    const shape = toText(field(r, 'shape'));
    // Kintone's Job field stores the sold-to / held-for customer and project name.
    // It is not a separate customer lookup, and may include room / builder details.
    const job = toText(field(r, 'job'));
    const isSold = sale === 'SOLD';
    const isHeld = sale === 'Hold';
    const showAllocation = isSold || isHeld || Boolean(job);
    const allocationLabel = isSold ? 'Sold to / Job' : isHeld ? 'On hold for / Job' : 'Job';
    const allocationClass = isSold ? 'sold' : isHeld ? 'hold' : 'other';
    const note = toText(field(r, 'in_out_note')) || toText(field(r, 'notes'));
    const url = `/k/${SETTINGS.INVENTORY_APP_ID}/show#record=${encodeURIComponent(recordId)}`;
    return `<article class="zmwm-piece">
      <div class="zmwm-piece-photo">${photoHTML(r)}</div>
      <div class="zmwm-piece-main"><div class="zmwm-piece-top"><span>#${esc(recordId)}</span><span class="zmwm-status ${statusClass(sale)}">${esc(sale === 'Avl' ? 'Available' : sale)}</span></div>
        <h4>${esc(material)}</h4>
        <div class="zmwm-piece-meta">${esc(type)} · ${esc(length)} × ${esc(width)} in${shape && shape !== 'Rectangle' ? ' · ' + esc(shape) : ''}</div>
        ${showAllocation ? `<div class="zmwm-piece-allocation ${allocationClass}"><span class="zmwm-piece-allocation-label">${allocationLabel}</span><strong>${job ? esc(job) : 'Job not available'}</strong></div>` : ''}
        ${note ? `<p class="zmwm-piece-note">${esc(note.slice(0,200))}</p>` : ''}
        ${DEMO ? `<span class="zmwm-record-link is-demo">Kintone record ↗ (live view only)</span>` : `<a class="zmwm-record-link" href="${url}" target="_blank" rel="noopener noreferrer">Open Kintone record ↗</a>`}
      </div>
    </article>`;
  }

  function renderInspector(g) {
    const root = document.getElementById('zmwm-inspector');
    if (!root) return;
    const rack = state.selected;
    if (!rack) {
      root.innerHTML = `<div class="zmwm-empty-inspector">Select a rack to inspect its contents.</div>`;
      return;
    }
    const all = g.all.get(rack) || [];
    const visible = (g.filtered.get(rack) || []).slice().sort((a,b) =>
      getColor(a).localeCompare(getColor(b),undefined,{sensitivity:'base'}) || num(getId(a)) - num(getId(b)));
    const meta = state.rackMeta.get(rack);
    const loc = meta ? toText(field(meta, 'location')) : '';
    const rackType = meta ? toText(field(meta, 'rack_type')) : '';
    const isUnmapped = UNMAPPED.includes(rack);
    const isReference = REFERENCE_ONLY.has(rack);
    root.innerHTML = `<div class="zmwm-inspector-head"><span class="zmwm-eyebrow">RACK DETAIL</span>
      <div class="zmwm-inspector-title"><h2>${esc(rack)}</h2><span>${visible.length}${visible.length !== all.length ? ' / ' + all.length : ''} pieces</span></div><button type="button" class="zmwm-back-to-map" data-action="back-to-map">↑ Back to rack map</button>
      <p>${isReference ? 'Reference face on drawing — not confirmed usable. Please verify any assignments here.' : isUnmapped ? 'Rack code needs side / location review' : 'Live inventory assigned to this rack face'}</p>
      ${loc || rackType ? `<div class="zmwm-inspector-meta">${loc ? `<span>${esc(loc)}</span>` : ''}${rackType ? `<span>${esc(rackType)}</span>` : ''}</div>` : ''}
    </div>
    <div class="zmwm-piece-list">${visible.length ? visible.map(itemHTML).join('') : `<div class="zmwm-empty-inspector">${all.length ? 'No pieces match your current filters.' : 'No current pieces assigned to this rack.'}</div>`}</div>
    <div class="zmwm-inspector-footer">Showing approved Kintone record data. All actions here are read-only.</div>`;
    if (!DEMO) hydratePhotos();
  }

  function loadImage(fileKey) {
    if (!fileKey || state.photoInflight.has(fileKey) || state.photoUrls.has(fileKey)) return;
    state.photoInflight.add(fileKey);
    const url = kintone.api.url('/k/v1/file.json', true) + '?fileKey=' + encodeURIComponent(fileKey);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.responseType = 'blob';
    xhr.onload = function () {
      state.photoInflight.delete(fileKey);
      if (xhr.status === 200 && xhr.response && /^image\//i.test(xhr.response.type)) {
        state.photoUrls.set(fileKey, URL.createObjectURL(xhr.response));
        const wrapper = document.getElementById('zmwm-inspector');
        if (wrapper) {
          wrapper.querySelectorAll('[data-photo-key]').forEach(node => {
            if (node.dataset.photoKey !== fileKey) return;
            const img = document.createElement('img');
            img.alt = 'Stone photograph';
            img.loading = 'lazy';
            img.src = state.photoUrls.get(fileKey);
            node.replaceWith(img);
          });
        }
      } else {
        markPhotoUnavailable(fileKey);
      }
    };
    xhr.onerror = function () { state.photoInflight.delete(fileKey); markPhotoUnavailable(fileKey); };
    xhr.send();
  }

  function markPhotoUnavailable(fileKey) {
    const wrapper = document.getElementById('zmwm-inspector');
    if (!wrapper) return;
    wrapper.querySelectorAll('[data-photo-key]').forEach(node => {
      if (node.dataset.photoKey === fileKey) node.textContent = 'NO PREVIEW';
    });
  }

  function hydratePhotos() {
    const wrapper = document.getElementById('zmwm-inspector');
    if (!wrapper) return;
    const keys = [...new Set([...wrapper.querySelectorAll('[data-photo-key]')]
      .slice(0, SETTINGS.PHOTO_LIMIT_PER_RACK).map(node => node.dataset.photoKey))];
    keys.forEach(loadImage);
  }

  function render() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (!state.initialized) {
      root.innerHTML = shellHtml();
      root.querySelector('#zmwm-search').value = state.search;
      root.querySelector('#zmwm-sale').value = state.sale;
      root.querySelector('#zmwm-kind').value = state.kind;
      state.initialized = true;
      root.addEventListener('click', e => {
        const rackButton = e.target.closest('[data-rack]');
        if (rackButton) { state.selected = rackButton.dataset.rack; render(); if (window.innerWidth <= 780) root.querySelector('#zmwm-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;
        if (actionButton.dataset.action === 'refresh') load();
        if (actionButton.dataset.action === 'zoom-in') { state.zoom = Math.min(1.6, Math.round((state.zoom + .2)*100)/100); render(); }
        if (actionButton.dataset.action === 'zoom-out') { state.zoom = Math.max(.75, Math.round((state.zoom - .2)*100)/100); render(); }
        if (actionButton.dataset.action === 'back-to-map') root.querySelector('.zmwm-content-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (actionButton.dataset.action === 'clear') {
          state.search = ''; state.sale = ''; state.kind = '';
          root.querySelector('#zmwm-search').value = '';
          root.querySelector('#zmwm-sale').value = '';
          root.querySelector('#zmwm-kind').value = '';
          render();
        }
      });
      root.querySelector('#zmwm-search').addEventListener('input', e => { state.search = e.target.value; render(); });
      root.querySelector('#zmwm-sale').addEventListener('change', e => { state.sale = e.target.value; render(); });
      root.querySelector('#zmwm-kind').addEventListener('change', e => { state.kind = e.target.value; render(); });
    }
    const g = groups();
    renderFeedback();
    renderOverview(g);
    renderPlan(g);
    renderInspector(g);
  }

  function releasePhotos() {
    state.photoUrls.forEach(url => URL.revokeObjectURL(url));
    state.photoUrls.clear();
  }

  if (typeof window.kintone === 'undefined' || !kintone.events) {
    // Only runs inside Kintone or a dedicated local demo mock.
    return;
  }

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], event => {
    const isCorrectView = event.viewName === SETTINGS.VIEW_NAME &&
      (event.viewType === 'custom' || event.viewType === 'CUSTOM' || !event.viewType);
    if (!isCorrectView) {
      if (state.initialized) { releasePhotos(); state.initialized = false; }
      return event;
    }
    if (!document.getElementById(ROOT_ID)) return event;
    state.initialized = false;
    state.selected = null;
    state.search = '';
    state.sale = '';
    state.kind = '';
    load();
    return event;
  });
})();