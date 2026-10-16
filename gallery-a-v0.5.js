/*
 * ZM Warehouse Maps: Shared map system (Galleries A-D, TO) plus Visual Search (v1.1)
 * Copyright (c) 2026 ZM. Read-only: GET requests only, no data writes.
 * Install inside Warehouse Map; use the same root HTML in all six Custom Views.
 * Uses existing versioned GitHub Pages links; inventory stays in authenticated Kintone.
 */
(function () {
  'use strict';

  const SETTINGS = {
    GALLERY_A_VIEW_NAMES: ['Gallery A', 'Inside Slab Gallery'],
    TO_VIEW_NAME: 'Temporary Outside',
    GALLERY_C_VIEW_NAME: 'Gallery C',
    GALLERY_B_VIEW_NAME: 'Gallery B',
    GALLERY_D_VIEW_NAME: 'Gallery D',
    VISUAL_SEARCH_VIEW_NAME: 'Visual Search',
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

  // Temporary Outside: six free-standing A-frames ordered road (TO-1) to
  // building (TO-6). Looking at the sketch, north is LEFT, A on the left,
  // B on the right. Unknown unsided codes remain visible for review.
  const TO_PAIRS = [1, 2, 3, 4, 5, 6].map(n => ({ number: n, a: `TO-${n}A`, b: `TO-${n}B` }));
  const TO_MAPPED = TO_PAIRS.flatMap(pair => [pair.a, pair.b]);
  const TO_UNMAPPED = TO_PAIRS.map(pair => `TO-${pair.number}`);
  const TO_QUERY_RACKS = [...TO_MAPPED, ...TO_UNMAPPED];
  const TO_FACES = TO_PAIRS.flatMap(pair => [{rack:pair.a}, {rack:pair.b}]);

  // Gallery B (Light Pole): eight actual A-frames with A on the north/left.
  // Physical grid: road side LP-1,3,5,7; building side LP-2,4,6,8.
  // The crossed-out LP-9 location has NO physical rack; Kintone LP-9 assignments
  // are shown as unconfirmed (not silently mapped into another physical rack).
  const GALLERY_B_ROWS = [[1, 3, 5, 7], [2, 4, 6, 8]];
  const GALLERY_B_MAPPED = GALLERY_B_ROWS.flatMap(nums =>
    nums.flatMap(n => [`LP-${n}A`, `LP-${n}B`]));
  const GALLERY_B_FACES = GALLERY_B_MAPPED.map(rack => ({rack}));
  const GALLERY_B_UNMAPPED = ['LP-9A', 'LP-9B',
    ...Array.from({length:9}, (_,i) => `LP-${i+1}`)];
  const GALLERY_B_ALIASES = new Map([...GALLERY_B_MAPPED, ...GALLERY_B_UNMAPPED]
    .map(rack => [rack.replace(/-/g, ''), rack]).filter(([alias,rack]) => alias !== rack));
  const GALLERY_B_QUERY_RACKS = [...new Set([...GALLERY_B_MAPPED, ...GALLERY_B_UNMAPPED,
    ...GALLERY_B_ALIASES.keys()])];
  // Key = correct Kintone location, value = outdated physical label in the yard.
  // We never redirect inventory from one rack to another based on these tags.
  const GALLERY_B_PHYSICAL_TAGS = Object.freeze({
    'LP-5A':'LP-7A', 'LP-5B':'LP-7B',
    'LP-7A':'LP-9A', 'LP-7B':'LP-9B'
  });
  const GALLERY_B_AUDIT_RACK = 'LP-7A';
  const isGalleryB = () => state.view === 'gallery-b';


  // Gallery D (Outside Robot Room): left-to-right Robot-3, then Robot-2.
  // Each A-frame has two usable faces, A on the left and B on the right.
  // The supplied sketch has the road above, building below and NORTH DOWN.
  const GALLERY_D_PAIRS = [3, 2].map(number => ({
    number, a: `Robot-${number}A`, b: `Robot-${number}B`
  }));
  const GALLERY_D_FACES = GALLERY_D_PAIRS.flatMap(pair => [{rack:pair.a}, {rack:pair.b}]);
  const GALLERY_D_MAPPED = GALLERY_D_FACES.map(face => face.rack);
  const GALLERY_D_UNMAPPED = GALLERY_D_PAIRS.map(pair => `Robot-${pair.number}`);
  // Canonical casing matches the yard labels. Accept uppercase and hyphenless
  // Kintone values without silently assigning an unsided code to A or B.
  const GALLERY_D_CODES = [...GALLERY_D_MAPPED, ...GALLERY_D_UNMAPPED];
  const GALLERY_D_ALIASES = new Map(GALLERY_D_CODES.flatMap(rack => [
    [rack.toUpperCase(), rack], [rack.replace(/-/g, '').toUpperCase(), rack]
  ]));
  const GALLERY_D_QUERY_RACKS = [...new Set(GALLERY_D_CODES.flatMap(rack => [
    rack, rack.toUpperCase(), rack.replace(/-/g, ''),
    rack.replace(/-/g, '').toUpperCase()
  ]))];
  const isGalleryD = () => state.view === 'gallery-d';

  // Gallery C (By Trucks): coordinates traced directly from Outside Slab Gallery C.pdf.
  // Orientation: road at top, building at bottom, north points left.
  // All 30 locations are usable. Six have *provisional* restrictions, not hard blocks.
  const GALLERY_C_WIDTH = 759;
  const GALLERY_C_HEIGHT = 903;
  const GALLERY_C_FACES = [{"rack":"OS-13B","x":681.69,"y":-0.0,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-13A","x":681.7,"y":80.33,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-12B","x":560.98,"y":187.23,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-11B","x":681.71,"y":187.25,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-12A","x":561.0,"y":267.56,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-11A","x":681.72,"y":267.58,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-10B","x":429.75,"y":306.76,"w":67.48,"h":82.09,"limited":false},{"rack":"OS-10A","x":354.27,"y":306.77,"w":67.48,"h":82.09,"limited":true},{"rack":"OS-9B","x":560.97,"y":374.48,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-8B","x":681.73,"y":374.5,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-DAR","x":75.5,"y":396.29,"w":67.47,"h":82.09,"limited":true},{"rack":"OS-DBL","x":0.02,"y":396.31,"w":67.48,"h":82.09,"limited":true},{"rack":"OT103-R","x":252.1,"y":396.32,"w":67.48,"h":82.09,"limited":true},{"rack":"OT103-L","x":176.62,"y":396.34,"w":67.48,"h":82.09,"limited":true},{"rack":"OS-9A","x":560.99,"y":454.81,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-8A","x":681.75,"y":454.83,"w":75.99,"h":72.32,"limited":false},{"rack":"OS-7B","x":429.75,"y":499.39,"w":67.48,"h":82.09,"limited":false},{"rack":"OS-7A","x":354.27,"y":499.4,"w":67.48,"h":82.09,"limited":true},{"rack":"OS-6B","x":561.0,"y":561.72,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-5B","x":681.72,"y":561.73,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-6A","x":561.01,"y":642.05,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-5A","x":681.73,"y":642.06,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-1B","x":681.73,"y":748.95,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-4B","x":319.57,"y":748.96,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-3B","x":440.26,"y":748.96,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-2B","x":560.99,"y":748.96,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-1A","x":681.75,"y":829.28,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-4A","x":319.59,"y":829.29,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-3A","x":440.28,"y":829.29,"w":75.99,"h":72.33,"limited":false},{"rack":"OS-2A","x":561.0,"y":829.29,"w":75.99,"h":72.33,"limited":false}];
  const GALLERY_C_SPINES = [{"x":681.75,"y":821.28,"w":75.99,"h":8},{"x":561.0,"y":821.29,"w":75.99,"h":8},{"x":440.28,"y":821.29,"w":75.99,"h":8},{"x":319.59,"y":821.29,"w":75.99,"h":8},{"x":681.73,"y":634.06,"w":75.99,"h":8},{"x":561.01,"y":634.05,"w":75.99,"h":8},{"x":421.75,"y":499.4,"w":8,"h":82.09},{"x":681.75,"y":446.83,"w":75.99,"h":8},{"x":560.99,"y":446.81,"w":75.99,"h":8},{"x":421.75,"y":306.77,"w":8,"h":82.09},{"x":681.72,"y":259.58,"w":75.99,"h":8},{"x":561.0,"y":259.56,"w":75.99,"h":8},{"x":681.7,"y":72.33,"w":75.99,"h":8},{"x":67.5,"y":396.31,"w":8,"h":82.09},{"x":244.1,"y":396.34,"w":8,"h":82.09}];
  const GALLERY_C_MAPPED = GALLERY_C_FACES.map(face => face.rack);
  const GALLERY_C_UNMAPPED = Array.from({length:13}, (_,i) => `OS-${i+1}`);
  // Lookup aliases protect against occasional hyphen-free Kintone rack values
  // (e.g. OS7A, OSDBL, OT103L) while always displaying PDF-defined labels.
  const GALLERY_C_ALIASES = new Map([...GALLERY_C_MAPPED, ...GALLERY_C_UNMAPPED]
    .map(rack => [rack.replace(/-/g, ''), rack]).filter(([alias,rack]) => alias !== rack));
  const GALLERY_C_QUERY_RACKS = [...new Set([...GALLERY_C_MAPPED, ...GALLERY_C_UNMAPPED,
    ...GALLERY_C_ALIASES.keys()])];
  const GALLERY_C_LIMITED = new Set(['OS-DBL','OS-DAR','OT103-L','OT103-R','OS-7A','OS-10A']);
  const isGalleryC = () => state.view === 'gallery-c';
  const canonicalRack = rack => isGalleryD() ? (GALLERY_D_ALIASES.get(rack) || rack) :
    isGalleryC() ? (GALLERY_C_ALIASES.get(rack) || rack) :
    isGalleryB() ? (GALLERY_B_ALIASES.get(rack) || rack) : rack;

  const viewForName = name => SETTINGS.GALLERY_A_VIEW_NAMES.includes(name) ? 'gallery-a' :
    name === SETTINGS.TO_VIEW_NAME ? 'temporary-outside' :
    name === SETTINGS.GALLERY_C_VIEW_NAME ? 'gallery-c' :
    name === SETTINGS.GALLERY_B_VIEW_NAME ? 'gallery-b' :
    name === SETTINGS.GALLERY_D_VIEW_NAME ? 'gallery-d' :
    name === SETTINGS.VISUAL_SEARCH_VIEW_NAME ? 'visual-search' : null;
  const isTO = () => state.view === 'temporary-outside';
  const mappedRacks = () => isGalleryD() ? GALLERY_D_MAPPED : isGalleryB() ? GALLERY_B_MAPPED : isGalleryC() ? GALLERY_C_MAPPED : isTO() ? TO_MAPPED : MAPPED;
  const unmappedRacks = () => isGalleryD() ? GALLERY_D_UNMAPPED : isGalleryB() ? GALLERY_B_UNMAPPED : isGalleryC() ? GALLERY_C_UNMAPPED : isTO() ? TO_UNMAPPED : UNMAPPED;
  const queryRacks = () => isGalleryD() ? GALLERY_D_QUERY_RACKS : isGalleryB() ? GALLERY_B_QUERY_RACKS : isGalleryC() ? GALLERY_C_QUERY_RACKS : isTO() ? TO_QUERY_RACKS : QUERY_RACKS;
  const planFaces = () => isGalleryD() ? GALLERY_D_FACES : isGalleryB() ? GALLERY_B_FACES : isGalleryC() ? GALLERY_C_FACES : isTO() ? TO_FACES : PLAN_FACES;

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
    view: 'gallery-a',
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
  const getRack = record => canonicalRack(normalizeRack(field(record, 'rack')));
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
    const racks = queryRacks();
    const mapped = mappedRacks();
    const rackList = racks.map(r => `"${r}"`).join(', ');
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
      state.records = records.filter(r => racks.includes(getRack(r)));
      state.updatedAt = new Date();
      state.error = '';
      if (!state.selected || !racks.includes(state.selected)) {
        state.selected = planFaces().map(f => f.rack).find(rack =>
          mapped.includes(rack) && state.records.some(r => getRack(r) === rack)) || mapped[0];
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
    const racks = queryRacks();
    const all = new Map(racks.map(r => [r, []]));
    const filtered = new Map(racks.map(r => [r, []]));
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

  function mapTitle() { return isGalleryD() ? 'Gallery D' : isGalleryB() ? 'Gallery B' : isGalleryC() ? 'Gallery C' : isTO() ? 'Temporary Outside' : 'Gallery A'; }
  function mapDescription() { return isGalleryD() ? 'Outside slab storage · Outside Robot Room.' :
    isGalleryB() ? 'Outside slab storage · Light Pole.' :
    isGalleryC() ? 'Outside slab storage · By Trucks.' :
    isTO() ? 'Temporary outdoor A-frame storage, from road to building.' :
    'Explore material by its physical rack position.'; }

  // Shared map chrome. New galleries reuse these elements so all locations
  // keep identical placement, typography and spacing automatically.
  function mapLocation() { return isGalleryD() ? 'Outside Robot Room' : isGalleryB() ? 'Light Pole' : isGalleryC() ? 'By Trucks' :
    isTO() ? 'TO Racks' : 'Main Showroom'; }
  function mapControls(note) {
    return `<div class="zmwm-reference-controls">
      <div class="zmwm-reference-context"><span class="zmwm-reference-tag">RACK MAP</span>
        <span>${esc(note)}</span></div>
      <div class="zmwm-reference-zoom" aria-label="Map zoom">
        <button type="button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out" ${state.zoom <= .76 ? 'disabled' : ''}>−</button>
        <span>${Math.round(state.zoom*100)}%</span>
        <button type="button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in" ${state.zoom >= 1.59 ? 'disabled' : ''}>+</button>
      </div>
    </div>`;
  }
  function mapBoundary(position, label, hint = '') {
    return `<div class="zmwm-map-boundary is-${position}">
      <strong>${esc(label)}</strong>${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
  }
  function mapSignature() {
    // Below the scrollable drawing, so the logo stays lower-left at any zoom
    // and cannot cover the racks, direction references, or inventory buttons.
    return `<div class="zmwm-map-signature"><img src="${GALLERY_LOGO}" alt="Zimmer Marble logo" />
      <span>ZM / WAREHOUSE MAP</span></div>`;
  }
  function mapLegend(extras, note) {
    const standard = [
      ['zmwm-swatch ' + (isGalleryC() ? 'zmwm-swatch-green' : 'sw-blue'), 'Rack face'],
      ['zmwm-to-legend-divider', 'A/B divider'],
      ['zmwm-swatch sw-selected', 'Selected rack']
    ];
    return `<div class="zmwm-reference-legend">${standard.concat(extras).map(([cls,label]) =>
      `<span><i class="${esc(cls)}"></i>${esc(label)}</span>`).join('')}
      <small>${esc(note)}</small></div>`;
  }

  function shellHtml() {
    return `<main class="zmwm-app">
      <header class="zmwm-head">
        <div class="zmwm-head-left"><div class="zmwm-mark">ZM<span> / </span>OPS</div>
          <div><div class="zmwm-eyebrow">INVENTORY / LOCATION INTELLIGENCE</div><h1>${mapTitle()}</h1>
          <p>${mapDescription()}</p></div>
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
          <div class="zmwm-content-heading"><div><h2>${esc(mapTitle())} <span class="zmwm-subtle">/ ${esc(mapLocation())}</span></h2><p>${isGalleryD() ? 'Two double-sided racks outside the robot room. All four faces are usable.' : isGalleryB() ? 'Eight A-frames. Temporary rack-tag mismatches on LP-5 and LP-7; LP-7A awaiting inventory audit.' : isGalleryC() ? 'Outdoor inventory from your Gallery C drawing. Six racks have provisional access limits.' : isTO() ? 'Six double-sided racks, road to building. Select a face for live inventory.' : 'Floor arrangement traced from your Google Drawing. Click a rack face for live inventory.'}</p></div><span class="zmwm-north" aria-label="North points ${isGalleryD() ? 'down' : 'left'}"><span class="zmwm-north-arrow" aria-hidden="true">${isGalleryD() ? '↓' : '←'}</span><span>NORTH</span></span></div>
          <div id="zmwm-plan" class="zmwm-plan"></div>
          <div id="zmwm-unmapped" class="zmwm-unmapped"></div>
        </section>
        <aside id="zmwm-inspector" class="zmwm-inspector" aria-label="Selected rack inventory"></aside>
      </div>
      <footer class="zmwm-footer">${isGalleryD() ? 'Gallery D follows the Outside Robot Room sketch: Robot-3 left, Robot-2 right, all four faces usable, north down. Not surveyed or to scale. ' : isGalleryB() ? 'Gallery B positions follow the Light Pole drawing with LP-9 removed, and corrected location names LP-5/LP-7. Physical tags and the LP-7A record location require an audit. Not surveyed or to scale. ' : isGalleryC() ? 'Gallery C positions trace the supplied Outside Slab Gallery C drawing; not surveyed or to scale. Six access restrictions are provisional. ' : isTO() ? 'TO rack arrangement follows the supplied sketch; not surveyed or to scale. North is to the left. ' : 'Rack arrangement follows the supplied Gallery A reference drawing. Not surveyed or to scale. Face colors follow the drawing, not inventory status. '}No data is written to Kintone.</footer>
    </main>`;
  }

  function renderOverview(g) {
    const root = document.getElementById('zmwm-overview');
    if (!root) return;
    const mappedRecords = mappedRacks().reduce((count, rack) => count + (g.all.get(rack) || []).length, 0);
    const unmappedRecords = unmappedRacks().reduce((count, rack) => count + (g.all.get(rack) || []).length, 0);
    const matchingRecords = [...g.filtered.values()].reduce((sum, records) => sum + records.length, 0);
    root.innerHTML = [
      { title: 'USABLE FACES', value: mappedRacks().length, meta: isGalleryD() ? '2 double-sided Robot racks' : isGalleryB() ? '8 double-sided LP racks' : isGalleryC() ? '6 provisional access limits' : isTO() ? '6 double-sided TO racks' : 'Plus Z-11B reference face' },
      { title: 'PHYSICAL PIECES', value: mappedRecords, meta: 'In mapped rack faces' },
      { title: 'MATCHES', value: matchingRecords, meta: 'Current filters · includes unplaced' },
      { title: 'NEEDS MAPPING', value: unmappedRecords, meta: isGalleryD() ? 'Unsided Robot rack codes' : isGalleryB() ? 'Unsided or former LP-9 locations' : isGalleryC() ? 'Unsided OS rack code' : isTO() ? 'Unsided TO rack code' : 'Unsided or unconfirmed face' }
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
      target.innerHTML = `<div class="zmwm-loaded"><span class="zmwm-dot"></span>${DEMO ? 'SAMPLE DATA PREVIEW' : 'LIVE KINTONE DATA'} <span class="zmwm-separator">·</span> Refreshed ${esc(updated)}${state.warning ? ' · ' + esc(state.warning) : ''}</div>`;
    }
  }

  function toFaceHtml(rack, g) {
    const allRecords = g.all.get(rack) || [];
    const filteredRecords = g.filtered.get(rack) || [];
    const activeFilter = Boolean(state.search || state.sale || state.kind);
    const records = activeFilter ? filteredRecords : allRecords;
    const count = activeFilter ? `${filteredRecords.length}/${allRecords.length}` : `${allRecords.length}`;
    const selected = state.selected === rack;
    const previewTitle = rackPreviewTitle(records) || 'No pieces assigned';
    const classes = ['zmwm-to-face', selected ? 'is-selected' : '',
      activeFilter && !filteredRecords.length ? 'is-dim' : '',
      allRecords.length ? 'has-pieces' : 'is-empty'].filter(Boolean).join(' ');
    return `<button type="button" class="${classes}" data-rack="${esc(rack)}"
      aria-pressed="${selected}" aria-label="${esc(rack)}: ${allRecords.length} pieces. ${esc(previewTitle)}. Open rack details."
      title="${esc(rack)} — ${allRecords.length} pieces · ${esc(previewTitle)}">
      <span class="zmwm-to-face-header"><span class="zmwm-to-face-name">${esc(rack)}</span>
        <span class="zmwm-to-face-count">${count}</span></span>
      ${rackPreviewMarkup(records)}
    </button>`;
  }

  function renderToPlan(g) {
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    const priorScroll = root.querySelector('.zmwm-reference-scroll');
    const priorLeft = priorScroll ? priorScroll.scrollLeft : 0;
    const beforeZoom = priorScroll ? Number(priorScroll.dataset.zoom || '1') : state.zoom;
    const racks = TO_PAIRS.map(pair => `<div class="zmwm-to-pair" aria-label="TO-${pair.number} A-frame">
      ${toFaceHtml(pair.a, g)}<span class="zmwm-to-divider" aria-hidden="true"></span>${toFaceHtml(pair.b, g)}
    </div>`).join('');
    const boardWidth = Math.round(790 * state.zoom);
    root.innerHTML = `${mapControls('6 A-frames · 12 faces · TO-1 nearest road')}
    <div class="zmwm-reference-scroll zmwm-to-scroll" data-zoom="${state.zoom}" tabindex="0"
      aria-label="Temporary Outside map, north to the left. Swipe sideways if needed.">
      <div class="zmwm-to-board" style="width:${boardWidth}px;--zmwm-to-zoom:${state.zoom}" role="group"
        aria-label="Six double-sided TO racks from road to building; A on the north left, B on the south right.">
        ${mapBoundary('top','ROAD','TO-1 closest to road')}
        <div class="zmwm-to-map-body">
          <div class="zmwm-to-stack">
            <div class="zmwm-to-column-legend"><span>A SIDE · NORTH</span><span>B SIDE · SOUTH</span></div>
            ${racks}
          </div>
        </div>
        ${mapBoundary('bottom','BUILDING','TO-6 closest to building')}
      </div>
    </div>
    ${mapLegend([], 'Rack order follows your sketch; not to scale. Swipe horizontally on small screens.')}
    ${mapSignature()}`;
    const nextScroll = root.querySelector('.zmwm-reference-scroll');
    if (nextScroll) nextScroll.scrollLeft = beforeZoom === state.zoom ? priorLeft : priorLeft * state.zoom / beforeZoom;
    const issues = document.getElementById('zmwm-unmapped');
    if (issues) {
      const unplaced = TO_UNMAPPED.filter(r => (g.all.get(r) || []).length);
      issues.innerHTML = unplaced.length ? `<div class="zmwm-unmapped-head"><span>UNCONFIRMED TO ASSIGNMENTS</span><small>These inventory records have a TO rack number, but no A/B side</small></div>
        <div class="zmwm-unmapped-list">${unplaced.map(r => faceHtml(r,g)).join('')}</div>` : '';
    }
  }

  // Paired A/B rack face card shared by Gallery B and Gallery D.
  // Gallery C shares the same Kintone data/query controls.
  // Only face geometry, access warnings, and presentation are specific to this view.
  function pairedFaceHtml(rack, g) {
    const all = g.all.get(rack) || [];
    const filtered = g.filtered.get(rack) || [];
    const activeFilter = Boolean(state.search || state.sale || state.kind);
    const records = activeFilter ? filtered : all;
    const selected = state.selected === rack;
    const physicalTag = GALLERY_B_PHYSICAL_TAGS[rack];
    const needsAudit = rack === GALLERY_B_AUDIT_RACK;
    const colors = rackPreviewTitle(records) || 'No pieces assigned';
    const count = activeFilter ? `${filtered.length}/${all.length}` : `${all.length}`;
    const classes = ['zmwm-gallery-b-face', selected ? 'is-selected' : '',
      physicalTag ? 'has-wrong-tag' : '', needsAudit ? 'needs-audit' : '',
      activeFilter && !filtered.length ? 'is-dim' : '', all.length ? 'has-pieces' : 'is-empty'
    ].filter(Boolean).join(' ');
    const info = physicalTag ? ` Physical rack tag currently reads ${physicalTag}.` : '';
    const auditInfo = needsAudit ? ' Inventory assigned here has unverified physical location pending yard audit.' : '';
    return `<button type="button" class="${classes}" data-rack="${esc(rack)}"
      aria-pressed="${selected}"
      aria-label="${esc(rack)}: ${all.length} pieces.${esc(info + auditInfo)} ${esc(colors)}. Open rack details."
      title="${esc(rack)} — ${all.length} pieces.${esc(info + auditInfo)} ${esc(colors)}">
      <span class="zmwm-gallery-b-face-header"><strong>${esc(rack)}</strong><span class="zmwm-gallery-b-count">${count}</span></span>
      ${rackPreviewMarkup(records)}
      ${physicalTag ? `<span class="zmwm-gallery-b-tag-note">Tag: ${esc(physicalTag)}</span>` : ''}
      ${needsAudit ? '<span class="zmwm-gallery-b-audit-note">Location unverified</span>' : ''}
    </button>`;
  }

  function renderGalleryB(g) {
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    const previous = root.querySelector('.zmwm-reference-scroll');
    const previousLeft = previous ? previous.scrollLeft : 0;
    const previousZoom = previous ? Number(previous.dataset.zoom || '1') : state.zoom;
    const boardWidth = Math.round(1125 * state.zoom);
    const rows = GALLERY_B_ROWS.map((numbers, rowIndex) =>
      `<div class="zmwm-gallery-b-row" role="group" aria-label="${rowIndex === 0 ? 'Road-side' : 'Building-side'} rack row">
        ${numbers.map(n => `<div class="zmwm-gallery-b-pair" role="group" aria-label="LP-${n} double-sided rack">
          ${pairedFaceHtml(`LP-${n}A`, g)}<span class="zmwm-gallery-b-divider" aria-hidden="true"></span>${pairedFaceHtml(`LP-${n}B`, g)}
        </div>`).join('')}
      </div>`).join('');
    root.innerHTML = `${mapControls('8 A-frames · 16 faces · LP-9 removed')}
    <div class="zmwm-reference-scroll zmwm-gallery-b-scroll" data-zoom="${state.zoom}" tabindex="0"
      aria-label="Gallery B outdoor rack map. North is to the left, road above, building below. Scroll horizontally to reach more racks.">
      <div class="zmwm-gallery-b-board" style="width:${boardWidth}px" role="group" aria-label="Gallery B Light Pole yard; two rows with eight A-frames.">
        ${mapBoundary('top','ROAD','Road-side row')}
        <div class="zmwm-gallery-b-racks">${rows}</div>
        ${mapBoundary('bottom','BUILDING','Building-side row')}
      </div>
    </div>
    ${mapLegend([['zmwm-swatch zmwm-gallery-b-swatch-warn','Physical tag mismatch'],
      ['zmwm-swatch zmwm-gallery-b-swatch-audit','Location audit pending']],
      'LP-5 is tagged LP-7; LP-7 is tagged LP-9. LP-9 has no mapped rack. Not to scale.')}
    ${mapSignature()}`;
    const next = root.querySelector('.zmwm-reference-scroll');
    if (next) next.scrollLeft = previousZoom === state.zoom ? previousLeft : previousLeft * state.zoom / previousZoom;
    const issues = document.getElementById('zmwm-unmapped');
    if (issues) {
      const unplaced = GALLERY_B_UNMAPPED.filter(rack => (g.all.get(rack) || []).length);
      issues.innerHTML = unplaced.length ? `<div class="zmwm-unmapped-head"><span>UNCONFIRMED LP ASSIGNMENTS</span>
          <small>Former LP-9 and unsided LP codes have no confirmed mapped face. Review before pulling inventory.</small></div>
          <div class="zmwm-unmapped-list">${unplaced.map(r => faceHtml(r,g)).join('')}</div>` : '';
    }
  }


  function renderGalleryD(g) {
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    const previous = root.querySelector('.zmwm-reference-scroll');
    const previousLeft = previous ? previous.scrollLeft : 0;
    const previousZoom = previous ? Number(previous.dataset.zoom || '1') : state.zoom;
    const boardWidth = Math.round(840 * state.zoom);
    const pairs = GALLERY_D_PAIRS.map(pair => `<div class="zmwm-gallery-d-pair" role="group"
      aria-label="Robot-${pair.number} double-sided rack, both faces usable">
      <div class="zmwm-gallery-d-faces">
        ${pairedFaceHtml(pair.a, g)}<span class="zmwm-gallery-b-divider" aria-hidden="true"></span>${pairedFaceHtml(pair.b, g)}
      </div>
    </div>`).join('');
    root.innerHTML = `${mapControls('2 A-frames · 4 fully usable faces')}
      <div class="zmwm-reference-scroll zmwm-gallery-d-scroll" data-zoom="${state.zoom}" tabindex="0"
        aria-label="Gallery D outside the robot room. North points down; road above, building below. Swipe horizontally if needed.">
        <div class="zmwm-gallery-d-board" style="width:${boardWidth}px" role="group"
          aria-label="Two double-sided racks: Robot-3 on the left and Robot-2 on the right. All four faces accessible.">
          ${mapBoundary('top','ROAD')}
          <div class="zmwm-gallery-d-racks">${pairs}</div>
          ${mapBoundary('bottom','BUILDING')}
        </div>
      </div>
      ${mapLegend([], 'Robot-3 on the left, Robot-2 on the right. All A/B faces usable. Not to scale.')}
      ${mapSignature()}`;
    const next = root.querySelector('.zmwm-reference-scroll');
    if (next) next.scrollLeft = previousZoom === state.zoom ? previousLeft : previousLeft * state.zoom / previousZoom;
    const issues = document.getElementById('zmwm-unmapped');
    if (issues) {
      const unplaced = GALLERY_D_UNMAPPED.filter(rack => (g.all.get(rack) || []).length);
      issues.innerHTML = unplaced.length ? `<div class="zmwm-unmapped-head"><span>UNCONFIRMED ROBOT ASSIGNMENTS</span>
        <small>These records have a Robot rack number without an A/B face. Confirm the side before pulling inventory.</small></div>
        <div class="zmwm-unmapped-list">${unplaced.map(rack => faceHtml(rack,g)).join('')}</div>` : '';
    }
  }

  function galleryCFaceHtml(face, g) {
    const rack = face.rack;
    const all = g.all.get(rack) || [];
    const filtered = g.filtered.get(rack) || [];
    const activeFilter = Boolean(state.search || state.sale || state.kind);
    const records = activeFilter ? filtered : all;
    const selected = state.selected === rack;
    const restricted = GALLERY_C_LIMITED.has(rack);
    const previewTitle = rackPreviewTitle(records) || 'No pieces assigned';
    const classes = ['zmwm-layout-face','zmwm-gallery-c-face','tone-green',
      selected ? 'is-selected' : '', restricted ? 'is-limited' : '',
      activeFilter && !filtered.length ? 'is-dim' : '',
      all.length ? 'has-pieces' : 'is-empty'].filter(Boolean).join(' ');
    const count = activeFilter ? `${filtered.length}/${all.length}` : String(all.length);
    const details = restricted ? ' Limited access (provisional): not suitable for full slabs.' : '';
    const style = 'left:' + pct(face.x, GALLERY_C_WIDTH) + ';top:' + pct(face.y, GALLERY_C_HEIGHT) +
      ';width:' + pct(face.w, GALLERY_C_WIDTH) + ';height:' + pct(face.h, GALLERY_C_HEIGHT) + ';';
    return `<button type="button" class="${classes}" style="${style}" data-rack="${esc(rack)}"
      aria-label="${esc(rack)}: ${all.length} pieces.${details} Top colors: ${esc(previewTitle)}. Open rack details."
      title="${esc(rack)} — ${all.length} pieces${restricted ? ' · LIMITED ACCESS / NO FULL SLABS (provisional)' : ''} · ${esc(previewTitle)}"
      aria-pressed="${selected}"><span class="zmwm-layout-name">${esc(rack)}</span>
      ${restricted ? '<span class="zmwm-gallery-c-warning" aria-hidden="true">!</span>' : ''}
      ${rackPreviewMarkup(records)}<span class="zmwm-layout-qty">${count}</span></button>`;
  }

  function renderGalleryC(g) {
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    const previous = root.querySelector('.zmwm-reference-scroll');
    const left = previous ? previous.scrollLeft : 0;
    const previousZoom = previous ? Number(previous.dataset.zoom || '1') : state.zoom;
    const boardMinWidth = Math.round(1000 * state.zoom);
    const spines = GALLERY_C_SPINES.map(box => `<span class="zmwm-layout-spine zmwm-gallery-c-spine"
      style="left:${pct(box.x,GALLERY_C_WIDTH)};top:${pct(box.y,GALLERY_C_HEIGHT)};width:${pct(box.w,GALLERY_C_WIDTH)};height:${pct(box.h,GALLERY_C_HEIGHT)}" aria-hidden="true"></span>`).join('');
    const faces = GALLERY_C_FACES.map(face => galleryCFaceHtml(face,g)).join('');
    root.innerHTML = `${mapControls('30 faces · 6 provisional access limits')}
    <div class="zmwm-reference-scroll zmwm-gallery-c-scroll" data-zoom="${state.zoom}" tabindex="0"
      aria-label="Gallery C rack map. North points left; road is above and building below. Scroll horizontally if needed.">
      <div class="zmwm-gallery-c-frame" style="min-width:${boardMinWidth}px">
        ${mapBoundary('top','ROAD')}
        <div class="zmwm-gallery-c-board" role="group" aria-label="Gallery C drawing: 30 rack faces, 6 provisional limited-access locations.">
          ${spines}${faces}
        </div>
        ${mapBoundary('bottom','BUILDING')}
      </div>
    </div>
    ${mapLegend([['zmwm-swatch zmwm-swatch-amber','Limited access (provisional)']],
      'Limited-access racks are not recommended for full slabs; classification needs verification. Not to scale.')}
    ${mapSignature()}`;
    const nextScroll = root.querySelector('.zmwm-reference-scroll');
    if (nextScroll) nextScroll.scrollLeft = previousZoom === state.zoom ? left : left * state.zoom / previousZoom;
    const issues = document.getElementById('zmwm-unmapped');
    if (issues) {
      const unplaced = GALLERY_C_UNMAPPED.filter(rack => (g.all.get(rack) || []).length);
      issues.innerHTML = unplaced.length ? `<div class="zmwm-unmapped-head"><span>UNCONFIRMED OS ASSIGNMENTS</span>
        <small>These records use an OS rack number without an A/B face.</small></div>
        <div class="zmwm-unmapped-list">${unplaced.map(r => faceHtml(r,g)).join('')}</div>` : '';
    }
  }

  function renderPlan(g) {
    if (isGalleryD()) { renderGalleryD(g); return; }
    if (isGalleryB()) { renderGalleryB(g); return; }
    if (isGalleryC()) { renderGalleryC(g); return; }
    if (isTO()) { renderToPlan(g); return; }
    const root = document.getElementById('zmwm-plan');
    if (!root) return;
    // Rebuilding the map on rack click or filtering must not erase the mobile pan position.
    const priorScroll = root.querySelector('.zmwm-reference-scroll');
    const priorLeft = priorScroll ? priorScroll.scrollLeft : 0;
    const beforeZoom = priorScroll ? Number(priorScroll.dataset.zoom || '1') : state.zoom;
    const spineHTML = PLAN_SPINES.map(box => `<span class="zmwm-layout-spine" style="${position(displaySpine(box))}" aria-hidden="true"></span>`).join('');
    const faceHTML = PLAN_FACES.map(face => layoutFaceHtml(face,g)).join('');
    const zoomWidth = Math.round(980 * state.zoom);
    root.innerHTML = `${mapControls('27 faces · Z-11B reference only')}
    <div class="zmwm-reference-scroll" data-zoom="${state.zoom}" tabindex="0" aria-label="Scroll horizontally to navigate the rack map on smaller screens">
      <div class="zmwm-reference-board" style="min-width:${zoomWidth}px" role="group" aria-label="Gallery A plan. North points to the left.">
        ${spineHTML}${faceHTML}
      </div>
    </div>
    ${mapLegend([['zmwm-swatch sw-flagged','Reference only']],
      'Yellow and lavender follow the original drawing; not inventory statuses. Swipe horizontally on mobile.')}
    ${mapSignature()}`;
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
    const isUnmapped = unmappedRacks().includes(rack);
    const isReference = !isTO() && !isGalleryC() && !isGalleryB() && !isGalleryD() && REFERENCE_ONLY.has(rack);
    const isLimited = isGalleryC() && GALLERY_C_LIMITED.has(rack);
    const physicalTag = isGalleryB() ? GALLERY_B_PHYSICAL_TAGS[rack] : '';
    const needsLocationAudit = isGalleryB() && rack === GALLERY_B_AUDIT_RACK;
    const noPhysicalRack = isGalleryB() && /^LP-9[AB]$/.test(rack);
    root.innerHTML = `<div class="zmwm-inspector-head"><span class="zmwm-eyebrow">RACK DETAIL</span>
      <div class="zmwm-inspector-title"><h2>${esc(rack)}</h2><span>${visible.length}${visible.length !== all.length ? ' / ' + all.length : ''} pieces</span></div><button type="button" class="zmwm-back-to-map" data-action="back-to-map">↑ Back to rack map</button>
      <p>${isReference ? 'Reference face on drawing — not confirmed usable. Please verify any assignments here.' : isUnmapped ? 'Rack code needs side / location review' : 'Live inventory assigned to this rack face'}</p>
      ${isLimited ? '<div class="zmwm-gallery-c-notice" role="note"><strong>⚠ LIMITED ACCESS · PROVISIONAL</strong><span>Not suitable for full slabs. This is a starting assumption; verify before placing material here.</span></div>' : ''}
      ${physicalTag ? `<div class="zmwm-gallery-b-notice" role="note"><strong>⚠ PHYSICAL TAG DOES NOT MATCH</strong><span>This location is ${esc(rack)} in Kintone, but the physical rack is currently labeled ${esc(physicalTag)}. Yard retagging is pending; verify the location before pulling material.</span></div>` : ''}
      ${needsLocationAudit ? '<div class="zmwm-gallery-b-notice audit" role="note"><strong>⚠ INVENTORY LOCATION UNVERIFIED</strong><span>Inventory assigned to LP-7A in Kintone has not been physically confirmed at this location. A yard audit is pending; do not assume the piece is here.</span></div>' : ''}
      ${noPhysicalRack ? '<div class="zmwm-gallery-b-notice audit" role="note"><strong>⚠ NO LP-9 STORAGE POSITION</strong><span>The former LP-9 A-frame was moved into the LP-7 position. Any records still assigned LP-9A/B require a location audit, not automatic reassignment.</span></div>' : ''}
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
      // Reusing the same root across Kintone view changes must not duplicate handlers.
      if (!root.dataset.zmwmClickBound) {
        root.dataset.zmwmClickBound = '1';
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
      }
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


  // Visual Search uses the same authenticated Inventory App 6 records as the
  // physical maps, but has its own image-first, read-only user interface.
  // It does not change any warehouse-map layout or write to Kintone.
  const VISUAL_PAGE_SIZE = 32;
  const VISUAL_FIELDS = ['$id','Record_number','color','color_combined','zmv_num',
    'type','length','width','shape','finish','thickness','rack','sale_status',
    'inventory_status','exact_picture','example_picture','job'];
  const visualState = {
    active:false, records:[], search:'', kind:'', sale:'', minLength:'', minWidth:'',
    photosOnly:false, shown:VISUAL_PAGE_SIZE, loading:false, error:'', updatedAt:null,
    token:0, urls:new Map(), failed:new Set(), pending:[], pendingKeys:new Set(),
    inflight:new Map(), observer:null
  };
  const visualDimension = value => toText(value) || '?';
  const visualNumericDimension = value => {
    const n = Number(toText(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };
  function visualPhotoKeys(record) {
    const found = [];
    for (const name of ['exact_picture', 'example_picture']) {
      const photos = field(record, name);
      const photo = Array.isArray(photos) ? photos.find(p =>
        p && p.fileKey && /^image\//i.test(str(p.contentType))) : null;
      if (photo && !found.includes(str(photo.fileKey))) found.push(str(photo.fileKey));
    }
    return found;
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
      field(record,'job'),field(record,'finish'),field(record,'shape')]
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
    const [primary, fallback] = visualPhotoKeys(record);
    const length = visualDimension(field(record,'length'));
    const width = visualDimension(field(record,'width'));
    const rack = toText(field(record,'rack')) || 'Location not set';
    const type = toText(field(record,'type')) || 'Stone';
    const shape = toText(field(record,'shape'));
    const sale = getSale(record);
    const label = sale === 'Avl' ? 'Available' : sale === 'SOLD' ? 'Sold' : sale === 'Hold' ? 'Hold' : '';
    return '<article class="zmwm-visual-card"><a class="zmwm-visual-link" href="' + url +
      '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(name) + ', ' + esc(length) +
      ' by ' + esc(width) + ' inches. Open Kintone record ' + esc(id) + '">' +
      '<div class="zmwm-visual-card-heading"><h3>' + esc(name) + '</h3></div>' +
      '<div class="zmwm-visual-photo"' +
      (primary ? ' data-visual-photo="' + esc(primary) + '"' : '') +
      (fallback ? ' data-visual-fallback="' + esc(fallback) + '"' : '') + '>' +
      (primary ? '<span class="zmwm-visual-photo-pending">Photo loading…</span>' :
        '<span class="zmwm-visual-no-photo">No photo available</span>') +
      (label ? '<span class="zmwm-visual-status ' + statusClass(sale) + '">' + esc(label) + '</span>' : '') +
      '</div><div class="zmwm-visual-card-details">' +
      '<div class="zmwm-visual-size">' + esc(length) + ' × ' + esc(width) + ' in</div>' +
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
    slot.textContent = '';
    const image = document.createElement('img');
    image.src = url;
    image.alt = 'Photo of inventory piece';
    image.loading = 'lazy';
    slot.appendChild(image);
    if (badge) slot.appendChild(badge);
  }
  function markVisualPhotoFailure(key) {
    visualState.failed.add(key);
    const root = document.getElementById('zmwm-visual-root');
    if (!root || !visualState.active) return;
    root.querySelectorAll('[data-visual-photo]').forEach(slot => {
      if (slot.dataset.visualPhoto !== key) return;
      const alternate = slot.dataset.visualFallback;
      if (alternate && alternate !== key) {
        slot.dataset.visualPhoto = alternate;
        delete slot.dataset.visualFallback;
        requestVisualPhoto(alternate);
      } else {
        const badge = slot.querySelector('.zmwm-visual-status');
        slot.textContent = '';
        const textNode = document.createElement('span');
        textNode.className = 'zmwm-visual-no-photo';
        textNode.textContent = 'Photo unavailable';
        slot.appendChild(textNode);
        if (badge) slot.appendChild(badge);
        delete slot.dataset.visualPhoto;
      }
    });
  }
  function requestVisualPhoto(key) {
    if (!visualState.active || !key) return;
    if (visualState.urls.has(key)) {
      const root = document.getElementById('zmwm-visual-root');
      if (root) root.querySelectorAll('[data-visual-photo]').forEach(slot => {
        if (slot.dataset.visualPhoto === key) fillVisualSlot(slot,visualState.urls.get(key));
      });
      return;
    }
    if (visualState.failed.has(key)) { markVisualPhotoFailure(key); return; }
    if (visualState.pendingKeys.has(key) || visualState.inflight.has(key)) return;
    visualState.pending.push(key);
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
      if (action === 'refresh') loadVisualSearch();
      if (action === 'reset') resetVisualFilters();
      if (action === 'more') {
        visualState.shown += VISUAL_PAGE_SIZE;
        renderVisualResults();
      }
    });
    loadVisualSearch();
  }

  if (typeof window.kintone === 'undefined' || !kintone.events) {
    // Only runs inside Kintone or a dedicated local demo mock.
    return;
  }

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], event => {
    const view = viewForName(event.viewName);
    const isCorrectView = Boolean(view) &&
      (event.viewType === 'custom' || event.viewType === 'CUSTOM' || !event.viewType);
    if (!isCorrectView) {
      stopVisualSearch();
      state.renderToken += 1; // Cancel any pending response from a previous view.
      if (state.initialized) { releasePhotos(); state.initialized = false; }
      return event;
    }
    if (!document.getElementById(ROOT_ID)) return event;
    if (view === 'visual-search') {
      state.renderToken += 1; // Cancel map loads while browsing Visual Search.
      releasePhotos();
      state.initialized = false;
      state.view = view;
      startVisualSearch();
      return event;
    }
    stopVisualSearch();
    releasePhotos();
    state.view = view;
    state.records = [];
    state.rackMeta = new Map();
    state.initialized = false;
    state.selected = null;
    state.search = '';
    state.sale = '';
    state.kind = '';
    state.zoom = 1;
    load();
    return event;
  });
})();