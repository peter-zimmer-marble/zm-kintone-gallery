/*
 * ZM Inventory - Visual Search v3.12 (v2 asset URL retained for Kintone compatibility)
 * Kintone Custom View for App 6 (only staging_status may be edited by authorized users).
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
  const getStage = r => toText(field(r,'staging_status'));
  const getInventoryStatus = r => toText(field(r,'inventory_status'));
  const isVisualOut = r => getInventoryStatus(r).toLowerCase() === 'out';
  // These fixed values are the only valid conditions for the inventory query.
  const VISUAL_SCOPE_CONDITIONS = Object.freeze({
    in:'inventory_status in ("In")',
    all:'inventory_status in ("In","Out")',
    out:'inventory_status in ("Out")'
  });
  function visualInventoryBadgeMarkup(record) {
    const status = getInventoryStatus(record);
    if (isVisualOut(record)) return '<span class="zmwm-visual-inventory-badge is-out">OUT</span>';
    if (status.toLowerCase() === 'in') return '<span class="zmwm-visual-inventory-badge is-in">IN</span>';
    return '<span class="zmwm-visual-table-blank">—</span>';
  }
  function visualOutNotice(record) {
    return isVisualOut(record) ?
      '<div class="zmwm-visual-out-notice">OUT — NOT CURRENTLY IN INVENTORY</div>' : '';
  }
  const getMaterial = r => toText(field(r,'material'));
  // This field is already used by the authenticated warehouse gallery in App 6.
  const getLot = r => toText(field(r,'lot_num'));
  const getPieceType = r => toText(field(r,'type'));
  const getNotes = r => toText(field(r,'in_out_note'));
  // Kintone Type is a specific inventory classification, not only Slab/Rem.
  // Keep a stable, named palette and preserve the type label as visible text.
  function visualPieceTypeClass(value) {
    const normalized = toText(value).toLowerCase().replace(/[^a-z0-9]/g,'');
    const classes = {
      stockslab:'type-stock-slab',
      soslab:'type-so-slab',
      cosignedslab:'type-consigned-slab',
      consignedslab:'type-consigned-slab',
      stockrem:'type-stock-rem',
      stanrem:'type-standard-rem'
    };
    return classes[normalized] ||
      (/rem/.test(normalized) ? 'type-remnant' :
        /slab/.test(normalized) ? 'type-slab' : 'type-other');
  }
  function visualStatusLabel(sale) {
    return sale === 'Avl' ? 'Available' :
      sale === 'SOLD' ? 'SOLD' : sale === 'Hold' ? 'ON HOLD' : '';
  }
  function visualStatusMarkup(sale) {
    const label = visualStatusLabel(sale);
    return label ? '<span class="zmwm-visual-status ' + statusClass(sale) +
      '">' + esc(label) + '</span>' : '';
  }
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
  const VISUAL_MAX_GROUP_PIECES = 75;
  const VISUAL_MAX_GROUP_TITLE = 80;
  const VISUAL_MAX_SAVED_GROUPS = 40;
  const VISUAL_SAVED_GROUPS_PREFIX = 'zmwm-visual-search-saved-groups-v1:';
  // Save only the display preference; inventory records and image blobs are never persisted.
  const VISUAL_LIST_PREFERENCE_KEY = 'zmwm-visual-search-list-view';
  function readVisualListPreference() {
    try { return window.localStorage.getItem(VISUAL_LIST_PREFERENCE_KEY) === 'true'; }
    catch (_error) { return false; }
  }
  function saveVisualListPreference(enabled) {
    try { window.localStorage.setItem(VISUAL_LIST_PREFERENCE_KEY,enabled ? 'true' : 'false'); }
    catch (_error) { /* Private browsing may disable preference storage. */ }
  }
  // Strict record-data allowlist: keep operational fields only. Never request
  // pricing, costs, margins, supplier information or unrelated inventory fields.
  // Job, material and In/Out Notes are displayed solely in this authenticated
  // internal view; Kintone itself enforces field and record permissions.
  // inventory_status is included to distinguish historical Out pieces.
  const VISUAL_FIELDS = Object.freeze([
    '$id', 'color', 'color_combined', 'zmv_num',
    'type', 'length', 'width', 'shape', 'rack', 'sale_status', 'inventory_status',
    'exact_picture', 'example_picture', 'job'
  ]);
  const visualState = {
    active:false, records:[], search:'', materials:new Set(), pieceTypes:new Set(),
    sale:'', inventoryScope:'in', minLength:'', minWidth:'', photosOnly:false, listView:false, sortKey:'color', sortDirection:'asc', shown:VISUAL_PAGE_SIZE,
    loading:false, error:'', updatedAt:null, materialAvailable:true, notesAvailable:true,
    lotAvailable:true, stageFieldAvailable:true,
    stageRights:new Map(), stageRightsPending:new Set(),
    stageSettings:null, stageSettingsPending:false, stageSettingsUnavailable:false,
    stageEditId:'', stageDraft:'', stageSavingId:'', stageMessages:new Map(),
    token:0, urls:new Map(), failed:new Set(), pending:[], pendingKeys:new Set(),
    inflight:new Map(), observer:null, lightbox:null, keydownHandler:null,
    touchStartX:null, extraDimensionFields:[],
    // Selection is tab-local only. Shared URLs contain IDs and optional title,
    // never protected inventory records, images, prices or account credentials.
    selectedIds:new Set(), selectedRecords:new Map(), groupName:'',
    groupViewIds:null, viewId:'', groupError:'', basketMessage:'',
    savedGroups:[], savedGroupsKey:'', savedGroupsError:'',
    savedGroupsStorageHandler:null
  };
  const visualDimension = value => toText(value) || '?';
  const visualNumericDimension = value => {
    const n = Number(toText(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };

  // Verified directly in ZM Inventory's Kintone field settings:
  // Length 2 (for L shapes) = length_2; Width 2 (for L shapes) = width_2.
  // Request only these explicit optional measurement fields, never a full record
  // or form schema, to preserve the strict exclusion of pricing and private data.
  const VISUAL_EXTRA_DIMENSION_FIELDS = Object.freeze([
    {name:'Length 2', code:'length_2'},
    {name:'Width 2', code:'width_2'}
  ]);
  function visualGeometry(record) {
    const length = visualDimension(field(record,'length'));
    const width = visualDimension(field(record,'width'));
    const shape = toText(field(record,'shape'));
    const nonRect = Boolean(shape && shape.toLowerCase() !== 'rectangle');
    const normalized = shape.toLowerCase().replace(/[\s_-]+/g, '');
    const lCode = /^(?:lefthandl|lhl)$/.test(normalized) ? 'LHL' :
      /^(?:righthandl|rhl)$/.test(normalized) ? 'RHL' : '';
    const extraLength = visualState.extraDimensionFields.some(dim => dim.code === 'length_2') ?
      toText(field(record,'length_2')) : '';
    const extraWidth = visualState.extraDimensionFields.some(dim => dim.code === 'width_2') ?
      toText(field(record,'width_2')) : '';
    const basic = length + ' × ' + width + ' in';
    // For L shapes, use one unified, four-dimension string followed by LHL/RHL.
    // If one value is absent, a dash makes the missing dimension explicit.
    // When neither additional field is available, retain the primary dimensions.
    const lParts = [length,width];
    if (lCode && (extraLength !== '' || extraWidth !== ''))
      lParts.push(extraLength || '—', extraWidth || '—');
    const display = lCode ? lParts.join(' × ') + ' in · ' + lCode : basic;
    const extras = nonRect && !lCode ? visualState.extraDimensionFields
      .map(dim => ({name:dim.name,value:toText(field(record,dim.code))}))
      .filter(dim => dim.value !== '') : [];
    return {
      basic, display, lCode,
      shape:nonRect ? shape : '',
      extras:extras.map(dim => dim.name + ': ' + dim.value + ' in').join(' · '),
      nonRect
    };
  }


  // Geometry-only rectangle fits; no material condition/kerf/vein allowance.
  // Zimmer's L dimensions are A x B x C x D (LHL/RHL):
  //   full long section = A x B;
  //   widened section   = C x (B + D).
  // Keep BOTH candidates. Picking max length and max width independently
  // would wrongly claim that an 89 x 27 rectangle fits 89x16x63x12.
  // LHL vs RHL changes handedness but not the candidate rectangles.
  function visualRectDimension(n) {
    return String(Math.round(n * 1000) / 1000);
  }
  function visualRectText(rect) {
    return visualRectDimension(rect.length) + ' × ' +
      visualRectDimension(rect.width);
  }
  function visualRectCandidates(record) {
    const lCode = visualGeometry(record).lCode;
    const isL = Boolean(lCode);
    const length = visualNumericDimension(field(record,'length'));
    const width = visualNumericDimension(field(record,'width'));
    const primaryValid = Number.isFinite(length) && length > 0 &&
      Number.isFinite(width) && width > 0;
    const rectangles = primaryValid ? [{length,width,area:length*width}] : [];
    let completeL = false;
    let issue = '';
    if (isL) {
      const canReadExtras = VISUAL_EXTRA_DIMENSION_FIELDS.every(dim =>
        visualState.extraDimensionFields.some(item => item.code === dim.code));
      const secondaryLength = canReadExtras ?
        visualNumericDimension(field(record,'length_2')) : NaN;
      const addedWidth = canReadExtras ?
        visualNumericDimension(field(record,'width_2')) : NaN;
      if (!primaryValid) issue = 'Primary length/width missing or invalid';
      else if (!canReadExtras ||
          !Number.isFinite(secondaryLength) || secondaryLength <= 0 ||
          !Number.isFinite(addedWidth) || addedWidth <= 0) {
        issue = 'Enter valid Length 2 and Width 2 to calculate';
      } else if (secondaryLength > length) {
        issue = 'Review L measurements: Length 2 exceeds Length';
      } else {
        const expandedWidth = Math.round((width + addedWidth) * 1000) / 1000;
        if (Number.isFinite(expandedWidth) && expandedWidth > width) {
          rectangles.push({length:secondaryLength,width:expandedWidth,
            area:secondaryLength*expandedWidth});
          completeL = true;
        } else issue = 'Review L measurements';
      }
    }
    // Largest means the rectangle with the greatest area, breaking an equal
    // area tie in favor of wider usable width, then greater length.
    rectangles.sort((a,b) =>
      b.area-a.area || b.width-a.width || b.length-a.length);
    return {isL,completeL,issue,rectangles,
      largest:rectangles.length ? rectangles[0] : null};
  }
  function visualRectSearchText(record) {
    return visualRectCandidates(record).rectangles.map(rect => {
      const a = visualRectDimension(rect.length);
      const b = visualRectDimension(rect.width);
      return a + 'x' + b + ' ' + a + '×' + b + ' ' + a + ' x ' + b;
    }).join(' ');
  }
  function visualMaxRectangleMarkup(record) {
    const calc = visualRectCandidates(record);
    if (!calc.isL) return '';
    if (!calc.completeL)
      return '<div class="zmwm-visual-max-rect is-incomplete">' +
        '<span class="zmwm-visual-max-rect-heading">AUTO RECTANGLE</span>' +
        '<span class="zmwm-visual-max-rect-warning">' +
          esc(calc.issue || 'L measurements incomplete') +
        '</span></div>';
    const alternate = calc.rectangles[1];
    return '<div class="zmwm-visual-max-rect"' +
      ' title="Geometric fit from the four L measurements. Confirm dimensions, ' +
        'stone condition, vein direction and cutting allowance before use.">' +
      '<span class="zmwm-visual-max-rect-heading">LARGEST RECTANGLE · AUTO</span>' +
      '<strong class="zmwm-visual-max-rect-value">' +
        esc(visualRectText(calc.largest)) + ' in</strong>' +
      (alternate ? '<span class="zmwm-visual-max-rect-alternate">' +
        'Also fits: ' + esc(visualRectText(alternate)) + ' in</span>' : '') +
      '</div>';
  }
  function visualMaxRectangleCell(record) {
    const calc = visualRectCandidates(record);
    if (calc.isL && !calc.completeL)
      return '<span class="zmwm-visual-max-rect-unavailable" title="' +
        esc(calc.issue) + '">Incomplete L dims</span>';
    if (!calc.largest) return '<span class="zmwm-visual-table-blank">—</span>';
    const isRectangle = toText(field(record,'shape')).trim().toLowerCase() === 'rectangle';
    if (!calc.isL && !isRectangle)
      return '<span class="zmwm-visual-table-blank" title="Only L shapes and ' +
        'rectangles have an automatic rectangle calculation">—</span>';
    const alternate = calc.isL && calc.rectangles[1] ?
      '<span class="zmwm-visual-table-max-rect-alt">Also ' +
        esc(visualRectText(calc.rectangles[1])) + '</span>' : '';
    return '<span class="zmwm-visual-table-max-rect">' +
      esc(visualRectText(calc.largest)) + ' in' +
      (calc.isL ? ' <small>Auto L</small>' : '') + '</span>' + alternate;
  }
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
    if (visualState.materials.size && !visualState.materials.has(getMaterial(record))) return false;
    if (visualState.pieceTypes.size && !visualState.pieceTypes.has(getPieceType(record))) return false;
    if (visualState.sale && getSale(record) !== visualState.sale) return false;
    if (visualState.photosOnly && !visualPhotoKeys(record).length) return false;
    if (visualState.minLength !== '' &&
      !(visualNumericDimension(field(record,'length')) >= Number(visualState.minLength))) return false;
    if (visualState.minWidth !== '' &&
      !(visualNumericDimension(field(record,'width')) >= Number(visualState.minWidth))) return false;
    const terms = visualState.search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const haystack = [
      getId(record), getColor(record), getRack(record), getMaterial(record),
      getPieceType(record), field(record,'color'), field(record,'zmv_num'),
      field(record,'shape'), field(record,'job'), getInventoryStatus(record),
      visualState.lotAvailable ? getLot(record) : ''
    ].map(value => str(value).toLocaleLowerCase()).join(' ');
    return terms.every(term => haystack.includes(term));
  }

  // All list columns sort on underlying Kintone values, never on rendered HTML.
  // Gallery mode deliberately retains its original alphabetical ordering.
  const VISUAL_TABLE_COLUMNS = Object.freeze([
    {key:'select',label:'Select'}, {key:'photo',label:'Photos'}, {key:'color',label:'Color'},
    {key:'inventory',label:'In / Out'}, {key:'type',label:'Piece Type'}, {key:'material',label:'Material'},
    {key:'rack',label:'Rack'}, {key:'staging',label:'Staging'}, {key:'lot',label:'Lot #'}, {key:'length',label:'Length (in)'},
    {key:'width',label:'Width (in)'}, {key:'shape',label:'Shape / Extra'},
    {key:'status',label:'Status'}, {key:'job',label:'Job'},
    {key:'notes',label:'In / Out Notes'}, {key:'id',label:'Record #'}
  ]);
  const VISUAL_NUMERIC_SORTS = new Set(['photo','length','width','id']);
  const visualSortCollator = new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  function visualSortValue(record,key) {
    switch(key) {
      case 'photo': return visualImages(record).length;
      case 'color': return getColorCombined(record);
      case 'inventory': return getInventoryStatus(record);
      case 'type': return getPieceType(record);
      case 'material': return visualState.materialAvailable ? getMaterial(record) : '';
      case 'rack': return getRack(record);
      case 'staging': return visualState.stageFieldAvailable ? getStage(record) : '';
      case 'lot': return visualState.lotAvailable ? getLot(record) : '';
      case 'length':
      case 'width': {
        const value = toText(field(record,key));
        return value ? visualNumericDimension(value) : NaN;
      }
      case 'shape': return toText(field(record,'shape'));
      case 'status': {
        const sale = getSale(record);
        return sale === 'Avl' ? 'Available' : sale === 'Hold' ? 'Hold' :
          sale === 'SOLD' ? 'Sold' : sale;
      }
      case 'job': return toText(field(record,'job'));
      case 'notes': return visualState.notesAvailable ? getNotes(record) : '';
      case 'id': return num(getId(record));
      default: return getColorCombined(record);
    }
  }
  function visualCompareSortValues(left,right,numeric) {
    const missing = value => value == null || (typeof value === 'number' && !Number.isFinite(value)) ||
      (typeof value === 'string' && !value.trim());
    const aMissing = missing(left), bMissing = missing(right);
    if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
    return numeric ? left - right : visualSortCollator.compare(str(left),str(right));
  }
  function visualMatchesSorted() {
    const results = visualState.records.filter(visualMatches);
    if (!visualState.listView) {
      return results.sort((a,b) =>
        getColorCombined(a).localeCompare(getColorCombined(b),undefined,{sensitivity:'base'}) ||
        num(getId(a)) - num(getId(b)));
    }
    const key = visualState.sortKey;
    const numeric = VISUAL_NUMERIC_SORTS.has(key);
    const direction = visualState.sortDirection === 'desc' ? -1 : 1;
    return results.sort((a,b) => {
      const primary = visualCompareSortValues(
        visualSortValue(a,key),visualSortValue(b,key),numeric);
      if (primary) {
        // Keep unassigned fields last in both directions.
        const left = visualSortValue(a,key), right = visualSortValue(b,key);
        const missing = value => value == null ||
          (typeof value === 'number' && !Number.isFinite(value)) ||
          (typeof value === 'string' && !value.trim());
        return missing(left) || missing(right) ? primary : primary * direction;
      }
      return visualSortCollator.compare(getColorCombined(a),getColorCombined(b)) ||
        num(getId(a)) - num(getId(b));
    });
  }
  // The same markup is used in cards and in the enlarged-photo detail pane,
  // ensuring the piece-type colors, material, rack, dimensions, job and notes
  // are never missing or visually downgraded in the viewer.

  function visualJobMarkup(record) {
    const job = toText(field(record,'job'));
    if (!job) return '';
    const sale = getSale(record);
    const cardStatus = sale === 'SOLD' ? ' is-sold' : sale === 'Hold' ? ' is-hold' : '';
    const allocationLabel = sale === 'SOLD' ? 'SOLD TO / JOB' :
      sale === 'Hold' ? 'ON HOLD FOR / JOB' : 'JOB';
    return '<div class="zmwm-visual-job' + cardStatus + '">' +
      '<span class="zmwm-visual-job-label">' + allocationLabel + '</span>' +
      '<span class="zmwm-visual-job-value">' + esc(job) + '</span></div>';
  }
  function visualNoteMarkup(record) {
    const note = visualState.notesAvailable ? getNotes(record) : '';
    return note ? '<div class="zmwm-visual-note">' +
      '<span class="zmwm-visual-note-label">IN / OUT NOTES</span>' +
      '<p>' + esc(note) + '</p></div>' : '';
  }
  function visualDetailMarkup(record) {
    const id = getId(record);
    const geometry = visualGeometry(record);
    const type = getPieceType(record) || 'Type not set';
    const material = visualState.materialAvailable ? getMaterial(record) : '';
    const rack = toText(field(record,'rack')) || 'Location not set';
    const lot = visualState.lotAvailable ? getLot(record) : '';
    return visualOutNotice(record) +
      '<div class="zmwm-visual-classifications">' +
        '<span class="zmwm-visual-piece-type ' + visualPieceTypeClass(type) +
          '">' + esc(type) + '</span>' +
        (material ? '<span class="zmwm-visual-material">' + esc(material) + '</span>' : '') +
        '<span class="zmwm-visual-rack">Rack: ' + esc(rack) + '</span>' +
        (lot ? '<span class="zmwm-visual-lot">Lot #: ' + esc(lot) + '</span>' : '') +
      '</div>' +
      '<div class="zmwm-visual-size' + (geometry.lCode ? ' zmwm-visual-size-l' : '') +
        '"' + (geometry.lCode ? ' title="' + esc(geometry.display) + '"' : '') +
        '>' + esc(geometry.display) + '</div>' +
      (geometry.nonRect && !geometry.lCode ? '<div class="zmwm-visual-geometry">' +
        '<span class="zmwm-visual-shape">' + esc(geometry.shape) + '</span>' +
        (geometry.extras ? '<span class="zmwm-visual-extras">' +
          esc(geometry.extras) + '</span>' : '') + '</div>' : '') +
      visualJobMarkup(record) +
      visualNoteMarkup(record) +
      '<div class="zmwm-visual-card-meta"><span>Record #' + esc(id) + '</span></div>';
  }

  // This exact photo-button HTML is shared by gallery cards and table cells,
  // so both launch the same authenticated enlarged-photo viewer.
  function visualPhotoMarkup(record) {
    const id = getId(record);
    const name = getColorCombined(record);
    const images = visualImages(record);
    const primary = images[0] ? images[0].key : '';
    const fallback = images[1] ? images[1].key : '';
    const statusBadge = visualStatusMarkup(getSale(record));
    const outOverlay = isVisualOut(record) ?
      '<span class="zmwm-visual-out-overlay">OUT</span>' : '';
    const countBadge = '<span class="zmwm-visual-photo-count">' +
      '<span class="zmwm-visual-photo-count-full">' +
        (images.length > 1 ? images.length + ' photos · Enlarge' : 'Enlarge photo') +
      '</span><span class="zmwm-visual-photo-count-short">' +
        images.length + ' photo' + (images.length === 1 ? '' : 's') +
      '</span></span>';
    return primary ?
      '<button type="button" class="zmwm-visual-photo zmwm-visual-photo-action"' +
        ' data-visual-action="open-photo" data-visual-id="' + esc(id) + '"' +
        ' data-visual-photo="' + esc(primary) + '"' +
        (fallback ? ' data-visual-fallback="' + esc(fallback) + '"' : '') +
        ' aria-label="Enlarge ' + images.length + ' photo' + (images.length === 1 ? '' : 's') +
        ' of ' + esc(name) + '">' +
        '<span class="zmwm-visual-photo-pending">Photo loading…</span>' +
        statusBadge + outOverlay + countBadge + '</button>' :
      '<div class="zmwm-visual-photo"><span class="zmwm-visual-no-photo">No photo available</span>' +
        statusBadge + outOverlay + '</div>';
  }

  // Staging is display-only until Kintone explicitly grants BOTH record edit
  // and staging_status field edit for this exact record. Never infer rights from
  // username, admin status, staging value, or ability to read a record.
  function visualStageHasUnsavedChoice(record) {
    return visualState.stageEditId === getId(record) &&
      visualState.stageDraft !== getStage(record);
  }
  function visualStageSelectedValue(record) {
    return visualStageHasUnsavedChoice(record) ?
      visualState.stageDraft : getStage(record);
  }
  function visualStageActionsMarkup(record) {
    const id = getId(record);
    if (visualState.stageRights.get(id) !== true || !visualState.stageSettings) return '';
    if (visualState.stageSavingId === id)
      return '<span class="zmwm-visual-stage-busy" role="status">Saving…</span>';
    if (!visualStageHasUnsavedChoice(record)) return '';
    // Keep the existing, revision-protected explicit Save/Cancel operation.
    // The select now lives INSIDE the colored badge, not in this action area.
    return '<span class="zmwm-visual-stage-editor">' +
      '<span class="zmwm-visual-stage-unsaved">Unsaved</span>' +
      '<button type="button" data-visual-action="save-staging"' +
        ' data-visual-stage-id="' + esc(id) + '">Save</button>' +
      '<button type="button" class="zmwm-visual-stage-cancel"' +
        ' data-visual-action="cancel-staging"' +
        ' data-visual-stage-id="' + esc(id) + '">Cancel</button>' +
      '</span>';
  }
  // Color reflects STAGING ONLY, separate from SOLD/HOLD/OUT badges.
  // Unknown future form options receive the same restrained teal fallback;
  // the actual status text is always shown so colors never carry meaning alone.
  function visualStageTone(value) {
    const stage = toText(value).toLocaleLowerCase();
    if (!stage) return 'is-unset';
    if (stage === 'rts') return 'is-rts';
    if (stage === 'view staging') return 'is-view-staging';
    return 'is-other';
  }
  function visualStageCanSelect(record) {
    return visualState.stageFieldAvailable &&
      visualState.stageRights.get(getId(record)) === true &&
      !!visualState.stageSettings;
  }
  function visualStageValueMarkup(record) {
    const saved = getStage(record);
    if (!visualStageCanSelect(record)) return esc(saved || 'Not staged');
    const id = getId(record);
    const current = visualStageSelectedValue(record);
    const settings = visualState.stageSettings;
    // Represent unset/legacy values faithfully; never silently replace them
    // with the first configured option when a select is first displayed.
    const blank = '<option value=""' +
      (current === '' ? ' selected' : '') +
      (settings.required ? ' disabled' : '') + '>Not staged</option>';
    const legacy = saved && !settings.choices.includes(saved) ?
      '<option value="' + esc(saved) + '"' +
        (current === saved ? ' selected' : '') +
        ' disabled>' + esc(saved) + ' (legacy)</option>' : '';
    const options = settings.choices.map(value =>
      '<option value="' + esc(value) + '"' +
        (value === current ? ' selected' : '') +
        '>' + esc(value) + '</option>').join('');
    return '<select class="zmwm-visual-stage-pill-select"' +
      ' data-visual-stage-choice="' + esc(id) + '"' +
      (visualState.stageSavingId ? ' disabled' : '') +
      ' aria-label="Staging status for ' + esc(getColorCombined(record)) + '"' +
      ' title="Select a staging status; save to apply">' +
      blank + legacy + options + '</select>';
  }
  function visualStageMarkup(record) {
    if (!visualState.stageFieldAvailable) return '';
    const id = getId(record);
    const stage = visualStageSelectedValue(record);
    const pending = visualStageHasUnsavedChoice(record);
    const message = visualState.stageMessages.get(id) || '';
    return '<div class="zmwm-visual-staging ' + visualStageTone(stage) +
      (pending ? ' is-pending' : '') +
      '" data-visual-staging-record="' + esc(id) + '">' +
      '<span class="zmwm-visual-stage-label">STAGING</span>' +
      '<span class="zmwm-visual-stage-value' +
        (visualStageCanSelect(record) ? ' is-clickable' : '') +
        '" data-visual-stage-value>' + visualStageValueMarkup(record) + '</span>' +
      '<span class="zmwm-visual-stage-actions" data-visual-stage-actions>' +
        visualStageActionsMarkup(record) + '</span>' +
      '<span class="zmwm-visual-stage-feedback" data-visual-stage-feedback' +
        ' role="status" aria-live="polite">' + esc(message) + '</span>' +
      '</div>';
  }
  function visualRefreshStageControls() {
    if (!visualState.active) return;
    const root = document.getElementById('zmwm-visual-root');
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-visual-staging-record]').forEach(host => {
      const record = visualState.records.find(r =>
        getId(r) === str(host.dataset.visualStagingRecord));
      if (!record) return;
      const status = host.querySelector('[data-visual-stage-value]');
      const actions = host.querySelector('[data-visual-stage-actions]');
      const note = host.querySelector('[data-visual-stage-feedback]');
      if (host.classList) {
        const tone = visualStageTone(visualStageSelectedValue(record));
        for (const option of ['is-rts','is-view-staging','is-other','is-unset'])
          host.classList.toggle(option,option === tone);
        host.classList.toggle('is-pending',visualStageHasUnsavedChoice(record));
      }
      if (status) {
        status.innerHTML = visualStageValueMarkup(record);
        if (status.classList)
          status.classList.toggle('is-clickable',visualStageCanSelect(record));
      }
      if (actions) actions.innerHTML = visualStageActionsMarkup(record);
      if (note) note.textContent = visualState.stageMessages.get(getId(record)) || '';
    });
  }
  function visualParseStagePermissions(response,ids) {
    const entries = Array.isArray(response && response.rights) ? response.rights : [];
    const known = new Map();
    for (const entry of entries) {
      const id = visualNormalizeGroupId(entry && entry.id);
      if (!id || !ids.includes(id)) continue;
      const right = entry && entry.fields && entry.fields.staging_status;
      known.set(id,entry.record && entry.record.editable === true &&
        right && right.viewable === true && right.editable === true);
    }
    // Fail closed: missing fields/records have no permission.
    return new Map(ids.map(id => [id,known.get(id) === true]));
  }
  async function visualEvaluateStagePermissions(ids) {
    const values = ids.map(visualNormalizeGroupId).filter(Boolean);
    if (!values.length || values.length > 100) return new Map();
    const response = await kintone.api(
      kintone.api.url('/k/v1/records/acl/evaluate.json',true),'GET',
      {app:SETTINGS.INVENTORY_APP_ID,ids:values.map(Number)});
    return visualParseStagePermissions(response,values);
  }
  async function visualLoadStageSettings() {
    if (visualState.stageSettings || visualState.stageSettingsPending ||
        visualState.stageSettingsUnavailable || !visualState.active) return;
    const token = visualState.token;
    visualState.stageSettingsPending = true;
    try {
      const form = await kintone.api(
        kintone.api.url('/k/v1/app/form/fields.json',true),'GET',
        {app:SETTINGS.INVENTORY_APP_ID});
      if (!visualState.active || token !== visualState.token) return;
      const property = form && form.properties && form.properties.staging_status;
      if (!property || !['DROP_DOWN','RADIO_BUTTON'].includes(property.type) ||
          !property.options || typeof property.options !== 'object')
        throw new Error('Staging is not a supported choice field');
      const choices = Object.entries(property.options)
        .filter(([value]) => typeof value === 'string' && value !== '')
        .sort((a,b) => Number(a[1].index) - Number(b[1].index))
        .map(([value]) => value);
      if (!choices.length) throw new Error('Staging has no configured options');
      visualState.stageSettings = {
        required:property.required === true,choices
      };
    } catch (_error) {
      if (visualState.active && token === visualState.token) {
        // Never make up allowed values or show edit controls if form metadata
        // cannot be read or field type unexpectedly changes.
        visualState.stageSettingsUnavailable = true;
      }
    } finally {
      if (visualState.active && token === visualState.token) {
        visualState.stageSettingsPending = false;
        visualRefreshStageControls();
      }
    }
  }
  function visualRequestStagePermissions(records) {
    if (!visualState.active || visualState.loading ||
        !visualState.stageFieldAvailable || !records || !records.length) return;
    const ids = [...new Set(records.map(getId).map(visualNormalizeGroupId)
      .filter(id => id && !visualState.stageRights.has(id) &&
        !visualState.stageRightsPending.has(id)))];
    if (!ids.length) return;
    const token = visualState.token;
    for(let start=0;start<ids.length;start+=100) {
      const batch = ids.slice(start,start+100);
      batch.forEach(id => visualState.stageRightsPending.add(id));
      visualEvaluateStagePermissions(batch).then(rights => {
        if (!visualState.active || token !== visualState.token) return;
        for (const id of batch)
          visualState.stageRights.set(id,rights.get(id) === true);
        if (batch.some(id => rights.get(id) === true))
          visualLoadStageSettings();
        visualRefreshStageControls();
      }).catch(() => {
        if (!visualState.active || token !== visualState.token) return;
        // A failed permission check never exposes edit controls.
        for (const id of batch) visualState.stageRights.set(id,false);
      }).finally(() => {
        if (!visualState.active || token !== visualState.token) return;
        batch.forEach(id => visualState.stageRightsPending.delete(id));
      });
    }
  }
  function visualCancelStage(id) {
    if (visualState.stageSavingId || visualState.stageEditId !== id) return;
    visualState.stageEditId = '';
    visualState.stageDraft = '';
    visualRefreshStageControls();
  }
  async function visualSaveStage(id) {
    if (!visualState.active || visualState.stageSavingId ||
        visualState.stageEditId !== id || visualState.stageRights.get(id) !== true ||
        !visualState.stageSettings || !visualState.stageFieldAvailable) return;
    const record = visualState.records.find(r => getId(r) === id);
    if (!record) return;
    const choice = visualState.stageDraft;
    const allowed = visualState.stageSettings.choices.includes(choice) ||
      (choice === '' && !visualState.stageSettings.required);
    if (!allowed) {
      visualState.stageMessages.set(id,'Choose a valid staging status.');
      visualRefreshStageControls();
      return;
    }
    if (choice === getStage(record)) {
      visualCancelStage(id);
      return;
    }
    visualState.stageSavingId = id;
    visualState.stageMessages.delete(id);
    visualRefreshStageControls();
    const token = visualState.token;
    try {
      // Permissions are checked again immediately before attempting to write.
      const rights = await visualEvaluateStagePermissions([id]);
      if (!visualState.active || token !== visualState.token) return;
      if (rights.get(id) !== true) {
        visualState.stageRights.set(id,false);
        visualState.stageEditId = '';
        throw new Error('Kintone no longer permits editing staging for this piece.');
      }
      const result = await readOnlyApi(SETTINGS.INVENTORY_APP_ID,
        ['$id','$revision','staging_status'],
        '$id = "' + id + '" limit 1');
      if (!visualState.active || token !== visualState.token) return;
      const latest = result && Array.isArray(result.records) ? result.records[0] : null;
      if (!latest || getId(latest) !== id)
        throw new Error('The inventory record could not be loaded. No changes were made.');
      const latestRevision = toText(field(latest,'$revision'));
      if (!/^\d+$/.test(latestRevision))
        throw new Error('Could not verify the record revision. No changes were made.');
      if (getStage(latest) !== getStage(record)) {
        if (!record.staging_status) record.staging_status = {value:getStage(latest)};
        else record.staging_status.value = getStage(latest);
        visualState.stageEditId = '';
        throw new Error('Staging changed since this page loaded. Review the new value and try again.');
      }
      // Exactly one field is written. Revision checking prevents overwriting a
      // concurrent Kintone update between the last read and this save.
      await kintone.api(kintone.api.url('/k/v1/record.json',true),'PUT',{
        app:SETTINGS.INVENTORY_APP_ID,id,
        revision:latestRevision,
        record:{staging_status:{value:choice}}
      });
      if (!visualState.active || token !== visualState.token) return;
      if (!record.staging_status) record.staging_status = {value:choice};
      else record.staging_status.value = choice;
      visualState.stageEditId = '';
      visualState.stageDraft = '';
      visualState.stageMessages.set(id,'Saved: ' + (choice || 'Not staged'));
    } catch (error) {
      if (!visualState.active || token !== visualState.token) return;
      visualState.stageMessages.set(id,describeError(error));
    } finally {
      if (visualState.active && token === visualState.token) {
        visualState.stageSavingId = '';
        renderVisualResults();
        if (visualState.lightbox) renderVisualLightbox();
      }
    }
  }
  function visualCard(record) {
    const id = getId(record);
    const name = getColorCombined(record);
    const url = '/k/' + SETTINGS.INVENTORY_APP_ID + '/show#record=' + encodeURIComponent(id);
    const geometry = visualGeometry(record);
    const type = getPieceType(record) || 'Type not set';
    const sale = getSale(record);
    const cardStatus = sale === 'SOLD' ? ' is-sold' : sale === 'Hold' ? ' is-hold' : '';
    const statusBadge = visualStatusMarkup(sale);
    const photo = visualPhotoMarkup(record);
    const selected = visualState.selectedIds.has(id);
    // The gallery checkbox is a sibling of the photo button and record link.
    // It only changes the existing tab-local share basket, never the inventory.
    const selectMarkup =
      '<label class="zmwm-visual-card-select" title="Include in shareable group">' +
        '<input type="checkbox" data-visual-select-id="' + esc(id) + '"' +
          (selected ? ' checked' : '') +
          ' aria-label="Include ' + esc(name) + ' in shared group">' +
        '<span class="zmwm-visual-select-off">Select</span>' +
        '<span class="zmwm-visual-select-on">Selected</span>' +
      '</label>';
    return '<article class="zmwm-visual-card' + cardStatus +
      (isVisualOut(record) ? ' is-out' : '') +
      (selected ? ' is-selected' : '') + '">' +
      '<div class="zmwm-visual-gallery-media">' + photo + selectMarkup + '</div>' +
      '<a class="zmwm-visual-link" href="' + url +
      '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(name) +
      ', ' + esc(type) + ', ' + esc(geometry.display) +
      (visualStatusLabel(sale) ? ', ' + esc(visualStatusLabel(sale)) : '') +
      (isVisualOut(record) ? ', OUT OF INVENTORY' : '') +
      '. Open Kintone record ' + esc(id) + '">' +
      '<div class="zmwm-visual-card-details">' +
        '<div class="zmwm-visual-list-heading">' +
          '<h3 class="zmwm-visual-color">' + esc(name) + '</h3>' +
          '<div class="zmwm-visual-list-status">' + statusBadge + '</div></div>' +
        visualDetailMarkup(record) +
      '</div></a>' + visualStageMarkup(record) + '</article>';
  }

  function visualTableHeader(column) {
    if (column.key === 'select') {
      return '<th scope="col" class="zmwm-visual-table-select-header">' +
        '<span>Select</span></th>';
    }
    const selected = visualState.sortKey === column.key;
    const ascending = visualState.sortDirection === 'asc';
    const nextDirection = selected && ascending ? 'descending' : 'ascending';
    const ariaSort = selected ? (ascending ? 'ascending' : 'descending') : 'none';
    const arrow = selected ? (ascending ? '▲' : '▼') : '↕';
    return '<th scope="col" aria-sort="' + ariaSort + '">' +
      '<button type="button" class="zmwm-visual-table-sort' + (selected ? ' is-sorted' : '') +
      '" data-visual-action="sort" data-visual-sort="' + esc(column.key) + '"' +
      ' aria-label="Sort by ' + esc(column.label) + ', ' + nextDirection + '">' +
      esc(column.label) + '<span aria-hidden="true" class="zmwm-visual-sort-arrow">' +
      arrow + '</span></button></th>';
  }
  function visualTableRow(record) {
    const id = getId(record);
    const name = getColorCombined(record);
    const url = '/k/' + SETTINGS.INVENTORY_APP_ID + '/show#record=' + encodeURIComponent(id);
    const sale = getSale(record);
    const type = getPieceType(record) || 'Type not set';
    const material = visualState.materialAvailable ? getMaterial(record) : '';
    const rack = toText(field(record,'rack')) || 'Location not set';
    const lot = visualState.lotAvailable ? getLot(record) : '';
    const shape = toText(field(record,'shape'));
    const geometry = visualGeometry(record);
    const extras = visualState.extraDimensionFields.filter(dim =>
      toText(field(record,dim.code)) !== '').map(dim =>
      (dim.code === 'length_2' ? 'L2' : 'W2') + ': ' + toText(field(record,dim.code)) + ' in');
    const extraLabel = extras.length ? extras.join(' · ') : geometry.extras;
    const linkAttrs = ' href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"';
    return '<tr class="zmwm-visual-table-row' +
      (sale === 'SOLD' ? ' is-sold' : sale === 'Hold' ? ' is-hold' : '') +
      (isVisualOut(record) ? ' is-out' : '') + '">' +
      '<td class="zmwm-visual-table-select-cell"><label title="Add to shareable group">' +
        '<input type="checkbox" data-visual-select-id="' + esc(id) + '"' +
          (visualState.selectedIds.has(id) ? ' checked' : '') +
          ' aria-label="Add ' + esc(name) + ' to group">' +
        '</label></td>' +
      '<td class="zmwm-visual-table-photo-cell">' + visualPhotoMarkup(record) + '</td>' +
      '<td class="zmwm-visual-table-color-cell"><a class="zmwm-visual-table-record-link"' +
        linkAttrs + '>' + esc(name) + '</a>' +
        (isVisualOut(record) ? '<span class="zmwm-visual-table-out-caption">OUT OF INVENTORY</span>' : '') +
        '</td>' +
      '<td class="zmwm-visual-table-inventory-cell">' +
        visualInventoryBadgeMarkup(record) + '</td>' +
      '<td><span class="zmwm-visual-piece-type ' + visualPieceTypeClass(type) +
        '">' + esc(type) + '</span></td>' +
      '<td>' + (material ? '<span class="zmwm-visual-material">' + esc(material) +
        '</span>' : '<span class="zmwm-visual-table-blank">—</span>') + '</td>' +
      '<td><span class="zmwm-visual-rack">' + esc(rack) + '</span></td>' +
      '<td class="zmwm-visual-table-stage">' + visualStageMarkup(record) + '</td>' +
      '<td class="zmwm-visual-table-lot">' +
        (lot ? '<span class="zmwm-visual-lot">Lot #: ' + esc(lot) + '</span>' :
          '<span class="zmwm-visual-table-blank">—</span>') + '</td>' +
      '<td class="zmwm-visual-table-number">' +
        esc(toText(field(record,'length')) || '—') + '</td>' +
      '<td class="zmwm-visual-table-number">' +
        esc(toText(field(record,'width')) || '—') + '</td>' +
      '<td><span class="zmwm-visual-table-shape">' + esc(shape || '—') + '</span>' +
        (extraLabel ? '<span class="zmwm-visual-table-extra">' + esc(extraLabel) +
        '</span>' : '') + '</td>' +
      '<td class="zmwm-visual-table-status-cell">' +
        (visualStatusMarkup(sale) || '<span class="zmwm-visual-table-blank">—</span>') + '</td>' +
      '<td>' + (visualJobMarkup(record) || '<span class="zmwm-visual-table-blank">—</span>') +
        '</td>' +
      '<td>' + (visualNoteMarkup(record) || '<span class="zmwm-visual-table-blank">—</span>') +
        '</td>' +
      '<td><a class="zmwm-visual-table-id-link"' + linkAttrs + '>' +
        esc(id) + '</a></td></tr>';
  }
  function visualTable(records) {
    return '<div class="zmwm-visual-table-scroll" role="region" tabindex="0"' +
      ' aria-label="Inventory list. Scroll horizontally for more columns.">' +
      '<table class="zmwm-visual-table">' +
      '<thead><tr>' + VISUAL_TABLE_COLUMNS.map(visualTableHeader).join('') +
      '</tr></thead><tbody>' + records.map(visualTableRow).join('') +
      '</tbody></table></div>';
  }
  function visualShell() {
    return '<main class="zmwm-visual-app" id="zmwm-visual-root" data-visual-version="3.12">' +
      '<header class="zmwm-visual-header"><div><div class="zmwm-visual-eyebrow">ZM / INVENTORY</div>' +
      '<h1>Visual Search</h1><p>Browse pieces by photo, material, size and job.</p></div>' +
      '<div class="zmwm-visual-header-actions"><span>LIVE INVENTORY</span>' +
      '<button type="button" data-visual-action="refresh">↻ Refresh</button></div></header>' +
      '<div class="zmwm-visual-toolbar" role="search" aria-label="Photo inventory filters">' +
      '<label class="zmwm-visual-field zmwm-visual-search-field"><span>SEARCH</span>' +
      '<input id="zmwm-visual-search" type="search" placeholder="Color, lot #, job, record #, rack…" autocomplete="off"></label>' +
      '<div class="zmwm-visual-field zmwm-visual-multifield"><span>MATERIAL TYPE</span>' +
        '<details class="zmwm-visual-multi" id="zmwm-visual-material-filter">' +
          '<summary><span id="zmwm-visual-material-summary">All materials</span>' +
            '<span class="zmwm-visual-chevron" aria-hidden="true">▾</span></summary>' +
          '<div class="zmwm-visual-multi-options" id="zmwm-visual-material-options">' +
            '<div class="zmwm-visual-filter-empty">Loading materials…</div></div>' +
        '</details></div>' +
      '<div class="zmwm-visual-field zmwm-visual-multifield"><span>PIECE TYPE</span>' +
        '<details class="zmwm-visual-multi" id="zmwm-visual-type-filter">' +
          '<summary><span id="zmwm-visual-type-summary">All piece types</span>' +
            '<span class="zmwm-visual-chevron" aria-hidden="true">▾</span></summary>' +
          '<div class="zmwm-visual-multi-options" id="zmwm-visual-type-options">' +
            '<div class="zmwm-visual-filter-empty">Loading piece types…</div></div>' +
        '</details></div>' +
      '<label class="zmwm-visual-field zmwm-visual-inventory-filter"><span>IN / OUT STATUS</span>' +
        '<select id="zmwm-visual-inventory-scope" aria-label="Inventory status">' +
          '<option value="in" selected>In only (default)</option>' +
          '<option value="all">In + Out</option>' +
          '<option value="out">Out only</option>' +
        '</select></label>' +
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
      '<div id="zmwm-visual-group-banner"></div>' +
      '<div id="zmwm-visual-basket"></div>' +
      '<div id="zmwm-visual-results"></div>' +
      '<div id="zmwm-visual-lightbox" class="zmwm-visual-lightbox" role="dialog"' +
        ' aria-modal="true" aria-label="Inventory photo viewer" hidden>' +
        '<div class="zmwm-visual-lightbox-backdrop" data-visual-action="close-photo"></div>' +
        '<section class="zmwm-visual-lightbox-panel">' +
          '<header class="zmwm-visual-lightbox-header">' +
            '<div class="zmwm-visual-lightbox-heading">' +
              '<div class="zmwm-visual-lightbox-eyebrow">INVENTORY PHOTOS</div>' +
              '<div class="zmwm-visual-lightbox-title-row">' +
                '<a class="zmwm-visual-lightbox-record-link" id="zmwm-visual-lightbox-record-link"' +
                  ' target="_blank" rel="noopener noreferrer" href="#">' +
                  '<h2 id="zmwm-visual-lightbox-title"></h2>' +
                  '<span class="zmwm-visual-lightbox-record-hint">Open inventory record ↗</span>' +
                '</a>' +
                '<span class="zmwm-visual-lightbox-status" id="zmwm-visual-lightbox-status"></span>' +
                '<span class="zmwm-visual-lightbox-inventory" id="zmwm-visual-lightbox-inventory"></span>' +
              '</div>' +
              '<p id="zmwm-visual-lightbox-meta"></p>' +
            '</div>' +
            '<button type="button" class="zmwm-visual-lightbox-close"' +
              ' data-visual-action="close-photo" aria-label="Close photo viewer">×</button>' +
          '</header>' +
          '<div class="zmwm-visual-lightbox-content">' +
            '<div class="zmwm-visual-lightbox-gallery">' +
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
            '</div>' +
            '<aside class="zmwm-visual-lightbox-info" aria-label="Inventory piece details">' +
              '<div id="zmwm-visual-lightbox-details"></div>' +
              '<div id="zmwm-visual-lightbox-staging"></div>' +
            '</aside>' +
          '</div>' +
        '</section></div>' +
      '<footer class="zmwm-visual-footer">Shows pieces marked In by default. ' +
      'Use the In / Out Status filter to find historical Out pieces and photos. ' +
      'Inventory is unchanged unless an authorized user explicitly saves a staging status.</footer>' +
      mapSignature() + '</main>';
  }
  // Options come from the currently selected In/Out scope. Show exact Kintone piece-type
  // values rather than collapsing Stock/SO/Consigned or remnant distinctions.
  function visualChoiceHTML(code, filter, selected) {
    const counts = new Map();
    for (const record of visualState.records) {
      const value = toText(field(record,code));
      if (value) counts.set(value,(counts.get(value) || 0) + 1);
    }
    if (!counts.size) return '<div class="zmwm-visual-filter-empty">No options in current inventory.</div>';
    return '<div class="zmwm-visual-filter-hint">Select one or more</div>' +
      [...counts.keys()].sort((a,b) => a.localeCompare(b,undefined,{sensitivity:'base'}))
        .map(value => '<label class="zmwm-visual-option">' +
          '<input type="checkbox" data-visual-filter="' + filter + '" value="' + esc(value) + '"' +
            (selected.has(value) ? ' checked' : '') + '>' +
          '<span>' + esc(value) + '</span><small>' + counts.get(value) + '</small>' +
        '</label>').join('');
  }
  function updateVisualFilterSummaries() {
    for (const config of [
      {name:'material',values:visualState.materials,defaultText:'All materials'},
      {name:'type',values:visualState.pieceTypes,defaultText:'All piece types'}
    ]) {
      const summary = document.getElementById('zmwm-visual-' + config.name + '-summary');
      const details = document.getElementById('zmwm-visual-' + config.name + '-filter');
      if (summary) {
        summary.textContent = config.name === 'material' && !visualState.materialAvailable ?
          'Unavailable' : config.values.size === 0 ? config.defaultText :
          config.values.size === 1 ? [...config.values][0] : config.values.size + ' selected';
      }
      if (details) details.classList.toggle('is-filtered',config.values.size > 0);
    }
  }
  function renderVisualFilterChoices() {
    const materials = document.getElementById('zmwm-visual-material-options');
    const types = document.getElementById('zmwm-visual-type-options');
    if (materials) {
      materials.innerHTML = visualState.materialAvailable ?
        visualChoiceHTML('material','material',visualState.materials) :
        '<div class="zmwm-visual-filter-empty">Material field unavailable for this Kintone user.</div>';
    }
    if (types) types.innerHTML = visualChoiceHTML('type','type',visualState.pieceTypes);
    updateVisualFilterSummaries();
  }
  function renderVisualFeedback() {
    const node = document.getElementById('zmwm-visual-feedback');
    if (!node) return;
    if (visualState.loading) {
      node.textContent = visualState.groupViewIds ?
        'Loading selected Kintone records…' :
        visualState.inventoryScope === 'out' ?
        'Loading historical Out pieces from Kintone…' :
        visualState.inventoryScope === 'all' ?
          'Loading In + Out inventory from Kintone…' :
          'Loading current Kintone inventory…';
    } else if (visualState.error) {
      node.textContent = 'Could not load inventory: ' + visualState.error;
    } else {
      node.textContent = 'LIVE KINTONE DATA · ' + visualState.records.length.toLocaleString() +
        (visualState.groupViewIds ? ' pieces in shared group' :
         visualState.inventoryScope === 'out' ? ' pieces marked Out' :
          visualState.inventoryScope === 'all' ? ' pieces (In + Out)' : ' pieces in shop') +
        ' · Refreshed ' + (visualState.updatedAt ?
          visualState.updatedAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) : '—') +
        (!visualState.notesAvailable ? ' · In/Out Notes unavailable (Kintone permissions).' : '') +
        (!visualState.materialAvailable ? ' · Material filter unavailable (Kintone permissions).' : '') +
        (!visualState.lotAvailable ? ' · Lot # unavailable (Kintone permissions).' : '');
    }
  }

  function visualNormalizeGroupId(value) {
    const raw = toText(value);
    if (!/^[1-9][0-9]{0,14}$/.test(raw)) return '';
    const number = Number(raw);
    return Number.isSafeInteger(number) && number > 0 ? String(number) : '';
  }
  function readVisualGroupLink() {
    const hash = str(window.location && window.location.hash).replace(/^#/,'');
    if (!/(^|&)zmgroup=/.test(hash)) return null;
    const values = new Map();
    for (const part of hash.split('&')) {
      const equals = part.indexOf('=');
      if (equals >= 0) values.set(part.slice(0,equals),part.slice(equals+1));
    }
    const raw = values.get('zmgroup') || '';
    const tokens = raw.split('.');
    if (!raw || raw.length > 1400 || tokens.length > VISUAL_MAX_GROUP_PIECES ||
        tokens.some(id => !visualNormalizeGroupId(id))) {
      return {error:'This group link contains invalid or too many record IDs.'};
    }
    const ids = [...new Set(tokens.map(visualNormalizeGroupId))];
    let name = '';
    try { name = decodeURIComponent((values.get('zmname') || '').replace(/\+/g,'%20')); }
    catch (_error) { return {error:'This group link has an invalid name.'}; }
    return {ids,name:name.trim().slice(0,VISUAL_MAX_GROUP_TITLE)};
  }
  function visualGroupUrlForIds(pieceIds,groupName) {
    const origin = toText(window.location && window.location.origin);
    const viewId = visualNormalizeGroupId(visualState.viewId);
    const ids = Array.isArray(pieceIds) ? pieceIds.map(visualNormalizeGroupId) : [];
    if (!origin || !/^https?:\/\//.test(origin) || !viewId || !ids.length ||
        ids.length > VISUAL_MAX_GROUP_PIECES ||
        ids.some(id => !id) || new Set(ids).size !== ids.length) return '';
    // A link contains IDs and a title, not photos, inventory data or credentials.
    const name = toText(groupName).trim().slice(0,VISUAL_MAX_GROUP_TITLE);
    const fragment = '#zmgroup=' + ids.join('.') +
      (name ? '&zmname=' + encodeURIComponent(name) : '');
    return origin + '/k/' + SETTINGS.INVENTORY_APP_ID + '/?view=' + viewId + fragment;
  }
  function visualGroupShareUrl() {
    return visualGroupUrlForIds([...visualState.selectedIds],visualState.groupName);
  }
  // Saved groups store only name, record IDs and timestamps; never record
  // details or photo keys. Each Kintone user has a separate browser-local key.
  function visualSavedGroupsStorageKey() {
    try {
      const user = typeof kintone.getLoginUser === 'function' ?
        kintone.getLoginUser() : null;
      const code = user && toText(user.code).trim();
      return code ? VISUAL_SAVED_GROUPS_PREFIX + encodeURIComponent(code) : '';
    } catch (_error) { return ''; }
  }
  function visualValidateSavedGroup(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        typeof entry.id !== 'string' || !/^[a-zA-Z0-9_-]{5,80}$/.test(entry.id) ||
        typeof entry.name !== 'string' ||
        !entry.name.trim() || entry.name.trim().length > VISUAL_MAX_GROUP_TITLE ||
        !Array.isArray(entry.pieceIds) || !entry.pieceIds.length ||
        entry.pieceIds.length > VISUAL_MAX_GROUP_PIECES) return null;
    const ids = entry.pieceIds.map(visualNormalizeGroupId);
    if (ids.some(id => !id) || new Set(ids).size !== ids.length) return null;
    const createdAt = typeof entry.createdAt === 'string' &&
      Number.isFinite(Date.parse(entry.createdAt)) ? entry.createdAt : '';
    const updatedAt = typeof entry.updatedAt === 'string' &&
      Number.isFinite(Date.parse(entry.updatedAt)) ? entry.updatedAt : createdAt;
    if (!createdAt) return null;
    return {
      id:entry.id, name:entry.name.trim(), pieceIds:ids,
      createdAt, updatedAt
    };
  }
  function visualLoadSavedGroups() {
    visualState.savedGroups = [];
    visualState.savedGroupsKey = visualSavedGroupsStorageKey();
    visualState.savedGroupsError = '';
    if (!visualState.savedGroupsKey) {
      visualState.savedGroupsError = 'Saved groups require a signed-in Kintone user. ' +
        'You can still copy and share links.';
      return;
    }
    try {
      const value = window.localStorage.getItem(visualState.savedGroupsKey);
      if (!value) return;
      // Fail closed on unreadable storage; do not overwrite a damaged library.
      if (value.length > 90000) throw new Error('Saved group data is too large');
      const raw = JSON.parse(value);
      if (!Array.isArray(raw) || raw.length > VISUAL_MAX_SAVED_GROUPS)
        throw new Error('Invalid saved group collection');
      const groups = raw.map(visualValidateSavedGroup);
      if (groups.some(item => !item) ||
          new Set(groups.map(item => item.id)).size !== groups.length)
        throw new Error('Invalid saved group data');
      visualState.savedGroups = groups.sort((a,b) =>
        b.updatedAt.localeCompare(a.updatedAt));
    } catch (_error) {
      visualState.savedGroupsError = 'Saved groups could not be read in this browser. ' +
        'No saved data has been overwritten. You can still copy links.';
    }
  }
  function visualPersistSavedGroups(groups) {
    if (!visualState.savedGroupsKey || visualState.savedGroupsError) {
      visualState.basketMessage = visualState.savedGroupsError ||
        'Saved groups are unavailable. You can still copy the group link.';
      return false;
    }
    try {
      if (!Array.isArray(groups) || groups.length > VISUAL_MAX_SAVED_GROUPS ||
          groups.some(group => !visualValidateSavedGroup(group)))
        throw new Error('Saved group is invalid');
      const json = JSON.stringify(groups);
      if (json.length > 90000) throw new Error('Saved groups exceed browser capacity');
      window.localStorage.setItem(visualState.savedGroupsKey,json);
      if (window.localStorage.getItem(visualState.savedGroupsKey) !== json)
        throw new Error('Saved groups were not stored');
      visualState.savedGroups = groups;
      return true;
    } catch (_error) {
      visualState.basketMessage = 'This browser could not save your group. ' +
        'Copy its shareable link to keep it instead.';
      return false;
    }
  }
  function visualSavedGroupsMarkup() {
    const groups = visualState.savedGroups;
    const items = groups.map(item => {
      const link = visualGroupUrlForIds(item.pieceIds,item.name);
      const date = new Date(item.updatedAt).toLocaleDateString(undefined,{
        year:'numeric',month:'short',day:'numeric'
      });
      return '<div class="zmwm-visual-saved-item">' +
        '<div class="zmwm-visual-saved-info"><strong>' + esc(item.name) + '</strong>' +
          '<span>' + item.pieceIds.length + ' piece' +
            (item.pieceIds.length === 1 ? '' : 's') +
            ' · Saved ' + esc(date) + '</span></div>' +
        '<div class="zmwm-visual-saved-actions">' +
          (link ? '<a href="' + esc(link) +
            '" class="zmwm-visual-saved-open">Open</a>' :
            '<span class="zmwm-visual-saved-disabled">Open unavailable</span>') +
          '<button type="button" data-visual-action="copy-saved-group"' +
            ' data-visual-saved-id="' + esc(item.id) + '"' +
            (link ? '' : ' disabled') + '>Copy link</button>' +
          '<button type="button" class="zmwm-visual-saved-delete"' +
            ' data-visual-action="delete-saved-group"' +
            ' data-visual-saved-id="' + esc(item.id) + '">' +
            'Delete</button></div></div>';
    }).join('');
    return '<section class="zmwm-visual-saved-groups" aria-label="My saved groups">' +
      '<div class="zmwm-visual-saved-head"><strong>My saved groups</strong>' +
        '<span>' + groups.length + ' saved</span></div>' +
      (visualState.savedGroupsError ?
        '<p class="zmwm-visual-saved-error" role="alert">' +
          esc(visualState.savedGroupsError) + '</p>' :
        groups.length ? '<div class="zmwm-visual-saved-list">' + items + '</div>' :
          '<p class="zmwm-visual-saved-empty">No saved groups yet. ' +
            'Build a selection, give it a name, then choose Save group.</p>') +
      '<p class="zmwm-visual-saved-footnote">Stored only in this browser for your ' +
        'Kintone login. Clearing browser data may remove these saved groups. ' +
        'Previously shared links continue to work even after deletion.</p>' +
      '</section>';
  }
  function visualSaveCurrentGroup() {
    const name = toText(visualState.groupName).trim().slice(0,VISUAL_MAX_GROUP_TITLE);
    const ids = [...visualState.selectedIds];
    if (!ids.length) {
      visualState.basketMessage = 'Select at least one piece before saving.';
      renderVisualBasket();
      return;
    }
    if (!name) {
      visualState.basketMessage = 'Enter a group name before saving it.';
      renderVisualBasket();
      return;
    }
    const existing = visualState.savedGroups.find(item =>
      item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const now = new Date().toISOString();
    let next;
    if (existing) {
      if (existing.pieceIds.join('.') === ids.join('.')) {
        visualState.basketMessage = 'This group is already saved in this browser.';
        renderVisualBasket();
        return;
      }
      const prompt = 'Replace saved group "' + existing.name +
        '" with these ' + ids.length + ' selected pieces? This does not change inventory records.';
      if (typeof window.confirm !== 'function' || !window.confirm(prompt)) return;
      next = visualState.savedGroups.map(item =>
        item.id === existing.id ?
          {...item,name,pieceIds:ids,updatedAt:now} : item);
    } else {
      if (visualState.savedGroups.length >= VISUAL_MAX_SAVED_GROUPS) {
        visualState.basketMessage = 'This browser holds the maximum of ' +
          VISUAL_MAX_SAVED_GROUPS + ' saved groups. Delete an old one first.';
        renderVisualBasket();
        return;
      }
      const key = 'sg_' + Date.now().toString(36) +
        Math.random().toString(36).slice(2,9);
      next = [{
        id:key,name,pieceIds:ids,createdAt:now,updatedAt:now
      },...visualState.savedGroups];
    }
    next.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
    if (visualPersistSavedGroups(next)) {
      visualState.groupName = name;
      visualState.basketMessage = existing ?
        'Saved group updated in this browser.' :
        'Group saved in this browser. Reopen it anytime from My saved groups.';
    }
    renderVisualBasket();
  }
  function visualDeleteSavedGroup(id) {
    const group = visualState.savedGroups.find(item => item.id === id);
    if (!group) return;
    const question = 'Delete saved group "' + group.name +
      '" from this browser? This cannot be undone here. ' +
      'Previously shared links will still work.';
    if (typeof window.confirm !== 'function' || !window.confirm(question)) return;
    if (visualPersistSavedGroups(visualState.savedGroups.filter(item =>
      item.id !== id))) {
      visualState.basketMessage = '"' + group.name +
        '" deleted from your saved groups. Shared links are unchanged.';
    }
    renderVisualBasket();
  }
  function visualCopySavedGroup(id) {
    const group = visualState.savedGroups.find(item => item.id === id);
    if (!group) return;
    const link = visualGroupUrlForIds(group.pieceIds,group.name);
    if (!link) {
      visualState.basketMessage = 'Could not generate a group link from this view.';
      renderVisualBasket();
      return;
    }
    const clipboard = window.navigator && window.navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      visualState.basketMessage = 'Clipboard access is unavailable. Open the saved ' +
        'group and copy its URL from the address bar.';
      renderVisualBasket();
      return;
    }
    clipboard.writeText(link).then(() => {
      if (!visualState.active) return;
      visualState.basketMessage = 'Saved group link copied for "' + group.name + '".';
      renderVisualBasket();
    }).catch(() => {
      if (!visualState.active) return;
      visualState.basketMessage = 'Copy failed. Open the saved group and copy the URL.';
      renderVisualBasket();
    });
  }
  function renderVisualBasket() {
    const basket = document.getElementById('zmwm-visual-basket');
    const banner = document.getElementById('zmwm-visual-group-banner');
    if (!visualState.active) return;
    const ids = [...visualState.selectedIds];
    const shareUrl = visualGroupShareUrl();
    const groupIds = visualState.groupViewIds;
    if (banner) {
      const visible = new Set(visualState.records.map(getId));
      const unavailable = groupIds ? groupIds.filter(id => !visible.has(id)).length : 0;
      banner.innerHTML = groupIds ?
        '<section class="zmwm-visual-shared-banner">' +
          '<div><strong>' + esc(visualState.groupName || 'Shared inventory group') +
          '</strong><span> ' + groupIds.length + ' selected piece' +
          (groupIds.length === 1 ? '' : 's') +
          ' · Live Kintone records, including In and Out</span>' +
          (unavailable && !visualState.loading && !visualState.error ?
            '<p class="zmwm-visual-group-warning">' + unavailable +
            ' piece' + (unavailable===1?' is':'s are') +
            ' missing or not accessible with your permissions.</p>' : '') +
          '</div><button type="button" data-visual-action="leave-group">' +
            'Back to inventory</button></section>' :
        visualState.groupError ?
          '<div class="zmwm-visual-group-warning" role="alert">' +
            esc(visualState.groupError) + '</div>' : '';
    }
    if (!basket) return;
    const chips = ids.map(id => {
      const item = visualState.selectedRecords.get(id);
      const name = item ? getColorCombined(item) : 'Record #' + id + ' (unavailable)';
      return '<button type="button" class="zmwm-visual-group-chip"' +
        ' data-visual-action="remove-group" data-visual-id="' + esc(id) + '"' +
        ' aria-label="Remove ' + esc(name) + ' from group">' +
        '<span>' + esc(name) + '</span><span aria-hidden="true">×</span></button>';
    }).join('');
    basket.innerHTML = '<section class="zmwm-visual-basket' +
      (ids.length ? ' has-selection' : '') + '">' +
      '<div class="zmwm-visual-basket-head">' +
        '<div><strong>Custom group</strong><span>' + ids.length +
        ' piece' + (ids.length===1?'':'s') + ' selected</span></div>' +
        (ids.length ? '<button type="button" class="zmwm-visual-basket-clear"' +
          ' data-visual-action="clear-group">Clear selection</button>' : '') +
      '</div>' +
      (ids.length ?
        '<div class="zmwm-visual-basket-chips">' + chips + '</div>' +
        '<div class="zmwm-visual-basket-share">' +
          '<label>Group name (required to save)<input id="zmwm-visual-group-name" type="text"' +
          ' maxlength="' + VISUAL_MAX_GROUP_TITLE + '"' +
          ' placeholder="e.g., Kitchen options for Smith" value="' +
          esc(visualState.groupName) + '"></label>' +
          '<label>Shareable internal link<input id="zmwm-visual-group-link" type="text"' +
          ' readonly value="' + esc(shareUrl) + '"' +
          ' aria-label="Shareable Kintone group link"></label>' +
          '<div class="zmwm-visual-basket-actions">' +
            '<button type="button" data-visual-action="save-group"' +
              ' class="zmwm-visual-save-group">Save group</button>' +
            '<button type="button" data-visual-action="copy-group"' +
              (shareUrl ? '' : ' disabled') + '>Copy group link</button>' +
            (shareUrl ? '<a href="' + esc(shareUrl) +
              '" target="_blank" rel="noopener noreferrer">Open group</a>' : '') +
          '</div></div>' +
          '<p class="zmwm-visual-basket-disclaimer">Recipients must sign in to Kintone.' +
          ' They will see the latest status and photos of records they can access.</p>' :
        '<p class="zmwm-visual-basket-empty">' +
        'Check pieces in Gallery or List view to collect options across searches.</p>') +
      (visualState.basketMessage ?
        '<p class="zmwm-visual-basket-message" role="status">' +
          esc(visualState.basketMessage) + '</p>' : '') +
      '</section>' + visualSavedGroupsMarkup();
  }
  function visualSyncSelectedCheckboxes() {
    const root = document.getElementById('zmwm-visual-root');
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('input[data-visual-select-id]').forEach(box => {
      box.checked = visualState.selectedIds.has(str(box.dataset.visualSelectId));
      // Update the gallery selection highlight without rebuilding photo nodes.
      const card = typeof box.closest === 'function' ?
        box.closest('.zmwm-visual-card') : null;
      if (card && card.classList) card.classList.toggle('is-selected',box.checked);
    });
  }
  function visualUpdateGroupSelection(id,checked) {
    const normalized = visualNormalizeGroupId(id);
    if (!normalized) return;
    if (checked) {
      if (!visualState.selectedIds.has(normalized) &&
          visualState.selectedIds.size >= VISUAL_MAX_GROUP_PIECES) {
        visualState.basketMessage = 'Groups are limited to ' +
          VISUAL_MAX_GROUP_PIECES + ' pieces per link.';
        visualSyncSelectedCheckboxes();
        renderVisualBasket();
        return;
      }
      visualState.selectedIds.add(normalized);
      const record = visualState.records.find(r => getId(r) === normalized);
      if (record) visualState.selectedRecords.set(normalized,record);
    } else {
      visualState.selectedIds.delete(normalized);
      visualState.selectedRecords.delete(normalized);
    }
    visualState.basketMessage = '';
    visualSyncSelectedCheckboxes();
    renderVisualBasket();
  }
  function visualUpdateShareLinkField() {
    const field = document.getElementById('zmwm-visual-group-link');
    if (field) field.value = visualGroupShareUrl();
    const open = document.getElementById('zmwm-visual-basket');
    if (open && open.querySelector) {
      const link = open.querySelector('.zmwm-visual-basket-actions a');
      if (link) link.href = visualGroupShareUrl();
    }
  }
  function visualCopyGroupLink() {
    const value = visualGroupShareUrl();
    if (!value) {
      visualState.basketMessage = 'Unable to generate a link. Open Visual Search through its Kintone view first.';
      renderVisualBasket();
      return;
    }
    const done = () => {
      if (!visualState.active) return;
      visualState.basketMessage = 'Link copied. Paste it into an internal message.';
      renderVisualBasket();
    };
    const fallback = () => {
      const field = document.getElementById('zmwm-visual-group-link');
      if (field && field.select) {
        field.focus();
        field.select();
        try {
          if (document.execCommand && document.execCommand('copy')) {
            done();
            return;
          }
        } catch (_error) { /* Manual copy remains available in the text box. */ }
      }
      visualState.basketMessage = 'Select and copy the link from the text box.';
      // Do not replace a selected text box before the user can copy it manually.
      const notice = document.querySelector &&
        document.querySelector('#zmwm-visual-basket .zmwm-visual-basket-message');
      if (notice) notice.textContent = visualState.basketMessage;
    };
    const clipboard = window.navigator && window.navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === 'function') {
      clipboard.writeText(value).then(done).catch(fallback);
    } else fallback();
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
    const tableBefore = container.querySelector &&
      container.querySelector('.zmwm-visual-table-scroll');
    const oldHorizontalScroll = tableBefore ? tableBefore.scrollLeft : 0;
    const results = visualMatchesSorted();
    const visible = results.slice(0,visualState.shown);
    renderVisualBasket();
    container.innerHTML = '<div class="zmwm-visual-results-heading">' +
      '<div class="zmwm-visual-count">' + results.length.toLocaleString() +
      ' matching ' + (results.length === 1 ? 'piece' : 'pieces') +
      ' <span>· Showing ' + visible.length.toLocaleString() + '</span></div>' +
      '<label class="zmwm-visual-layout-toggle' + (visualState.listView ? ' is-active' : '') + '">' +
        '<input id="zmwm-visual-list-view" type="checkbox"' +
          (visualState.listView ? ' checked' : '') + '><span>List view</span></label></div>' +
      (results.length ? (visualState.listView ? visualTable(visible) :
        '<div class="zmwm-visual-grid">' + visible.map(visualCard).join('') + '</div>') :
        '<div class="zmwm-visual-empty">No pieces match those filters.</div>') +
      (visible.length < results.length ? '<div class="zmwm-visual-more-wrap"><button type="button" ' +
        'data-visual-action="more">Show more pieces</button></div>' : '');
    const tableAfter = container.querySelector &&
      container.querySelector('.zmwm-visual-table-scroll');
    if (tableAfter) tableAfter.scrollLeft = oldHorizontalScroll;
    prepareVisualPhotos();
    // Only displayed rows are evaluated (batch <= 100), never every inventory
    // record. Until confirmed by Kintone, every staging control is hidden.
    visualRequestStagePermissions(visible);
  }
  function fillVisualSlot(slot, url) {
    if (!slot) return;
    const badge = slot.querySelector('.zmwm-visual-status');
    const outOverlay = slot.querySelector('.zmwm-visual-out-overlay');
    const count = slot.querySelector('.zmwm-visual-photo-count');
    slot.textContent = '';
    const image = document.createElement('img');
    image.src = url;
    image.alt = 'Photo of inventory piece';
    image.loading = 'lazy';
    slot.appendChild(image);
    if (badge) slot.appendChild(badge);
    if (outOverlay) slot.appendChild(outOverlay);
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
        const outOverlay = slot.querySelector('.zmwm-visual-out-overlay');
        const count = slot.querySelector('.zmwm-visual-photo-count');
        slot.textContent = '';
        const textNode = document.createElement('span');
        textNode.className = 'zmwm-visual-no-photo';
        textNode.textContent = 'Photo unavailable';
        slot.appendChild(textNode);
        if (badge) slot.appendChild(badge);
        if (outOverlay) slot.appendChild(outOverlay);
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
  function visualDownloadFilename(record, image) {
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
    return name + ' - ' + dims + ' - Record ' + recNumber + '.' + ext;
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
    const recordLink = root.querySelector('#zmwm-visual-lightbox-record-link');
    const details = root.querySelector('#zmwm-visual-lightbox-details');
    const status = root.querySelector('#zmwm-visual-lightbox-status');
    const inventoryStatus = root.querySelector('#zmwm-visual-lightbox-inventory');
    const stage = root.querySelector('#zmwm-visual-lightbox-image');
    const caption = root.querySelector('#zmwm-visual-lightbox-caption');
    const download = root.querySelector('[data-visual-action="download-photo"]');
    const previous = root.querySelector('[data-visual-action="previous-photo"]');
    const next = root.querySelector('[data-visual-action="next-photo"]');
    const thumbnails = root.querySelector('#zmwm-visual-lightbox-thumbnails');
    if (!title || !meta || !details || !status || !stage || !caption || !download || !thumbnails) return;
    const name = getColorCombined(current.record);
    title.textContent = name;
    meta.textContent = 'Record #' + getId(current.record) +
      (isVisualOut(current.record) ? ' · OUT OF INVENTORY' : '');
    // Match the card's colored piece-type, material, rack, measurements,
    // job allocation and staff notes while retaining the large photo.
    details.innerHTML = visualDetailMarkup(current.record);
    const stageInfo = root.querySelector('#zmwm-visual-lightbox-staging');
    if (stageInfo) stageInfo.innerHTML = visualStageMarkup(current.record);
    visualRefreshStageControls();
    status.innerHTML = visualStatusMarkup(getSale(current.record));
    if (inventoryStatus) inventoryStatus.innerHTML = isVisualOut(current.record) ?
      '<span class="zmwm-visual-inventory-badge is-out">OUT — NOT IN INVENTORY</span>' : '';
    const panel = root.querySelector('.zmwm-visual-lightbox-panel');
    if (panel) {
      panel.classList.toggle('is-sold',getSale(current.record) === 'SOLD');
      panel.classList.toggle('is-hold',getSale(current.record) === 'Hold');
      panel.classList.toggle('is-out',isVisualOut(current.record));
    }
    if (recordLink) recordLink.href = '/k/' + SETTINGS.INVENTORY_APP_ID +
      '/show#record=' + encodeURIComponent(getId(current.record));
    const number = current.index + 1;
    const total = current.images.length;
    caption.textContent = image.kind + ' · Photo ' + number + ' of ' + total;
    download.disabled = !blobUrl;
    download.title = blobUrl ? visualDownloadFilename(current.record,image) :
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
    const selectedThumbnail = thumbnails.querySelector('.is-current');
    if (selectedThumbnail && selectedThumbnail.scrollIntoView)
      selectedThumbnail.scrollIntoView({block:'nearest',inline:'nearest'});
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
      const focusable = [...root.querySelectorAll('a[href],button:not([disabled])')];
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
    link.download = visualDownloadFilename(current.record,image);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Keyset pagination avoids Kintone's 10,000-record offset limit. All reads
  // are GETs from the inventory app; no cursor resources or writes are created.
  async function fetchVisualRecords(scope,groupIds) {
    const inventoryCondition = VISUAL_SCOPE_CONDITIONS[scope] ||
      VISUAL_SCOPE_CONDITIONS.in;
    const ids = Array.isArray(groupIds) ?
      groupIds.map(visualNormalizeGroupId).filter(Boolean) : [];
    // Group links bypass the default In-only condition, but never permissions.
    // All IDs are numeric and capped; read only exactly these records.
    const groupCondition = ids.length ?
      '$id in (' + ids.map(id => '"' + id + '"').join(',') + ')' : '';
    async function getRecords(fields) {
      if (groupCondition) {
        const data = await readOnlyApi(SETTINGS.INVENTORY_APP_ID,fields,
          groupCondition + ' order by $id asc limit ' + SETTINGS.PAGE_SIZE);
        return Array.isArray(data.records) ? data.records : [];
      }
      const records = [];
      let last = 0;
      for (let page=0;page<80;page++) {
        const cond = inventoryCondition + (last ? ' and $id > ' + last : '');
        const data = await readOnlyApi(SETTINGS.INVENTORY_APP_ID,fields,
          cond + ' order by $id asc limit ' + SETTINGS.PAGE_SIZE);
        const batch = Array.isArray(data.records) ? data.records : [];
        records.push(...batch);
        if (batch.length < SETTINGS.PAGE_SIZE) return records;
        const id = Number(getId(batch[batch.length-1]));
        if (!Number.isSafeInteger(id) || id <= last)
          throw new Error('Unable to page inventory record IDs.');
        last = id;
      }
      throw new Error('Too many records for this view. Narrow the query before retrying.');
    }
    const dimensions = VISUAL_EXTRA_DIMENSION_FIELDS.map(dim => dim.code);
    const optional = ['material','in_out_note','lot_num','staging_status',...dimensions];
    try {
      return await getRecords([...VISUAL_FIELDS,...optional]);
    } catch (initialError) {
      // Field-level permissions differ among Kintone users. Probe only the
      // five explicit optional groups, with no inventory data exported,
      // then retry without fields that the signed-in user cannot access.
      const probe = async fields => {
        try {
          await readOnlyApi(SETTINGS.INVENTORY_APP_ID,['$id',...fields],
            (groupCondition || inventoryCondition) + ' order by $id asc limit 1');
          return true;
        } catch (error) { return false; }
      };
      const [materialOK,notesOK,dimensionsOK,lotOK,stageOK] = await Promise.all([
        probe(['material']),probe(['in_out_note']),probe(dimensions),
        probe(['lot_num']),probe(['staging_status'])
      ]);
      visualState.materialAvailable = materialOK;
      visualState.notesAvailable = notesOK;
      visualState.lotAvailable = lotOK;
      visualState.stageFieldAvailable = stageOK;
      visualState.extraDimensionFields = dimensionsOK ?
        VISUAL_EXTRA_DIMENSION_FIELDS : [];
      const allowed = [
        ...(materialOK ? ['material'] : []),
        ...(notesOK ? ['in_out_note'] : []),
        ...(lotOK ? ['lot_num'] : []),
        ...(stageOK ? ['staging_status'] : []),
        ...(dimensionsOK ? dimensions : [])
      ];
      return getRecords([...VISUAL_FIELDS,...allowed]);
    }
  }
  async function loadVisualSearch() {
    if (!visualState.active) return;
    closeVisualLightbox();
    const token = ++visualState.token;
    visualState.loading = true;
    visualState.error = '';
    renderVisualFeedback();
    renderVisualBasket();
    renderVisualResults();
    try {
      // The exact field codes are supplied by ZM Inventory's field settings.
      visualState.extraDimensionFields = VISUAL_EXTRA_DIMENSION_FIELDS;
      visualState.materialAvailable = true;
      visualState.notesAvailable = true;
      visualState.lotAvailable = true;
      visualState.stageFieldAvailable = true;
      // Drop cached edit rights on every refresh; the next page is checked anew.
      visualState.stageRights.clear();
      visualState.stageRightsPending.clear();
      visualState.stageEditId = '';
      visualState.stageDraft = '';
      visualState.stageSavingId = '';
      visualState.stageMessages.clear();
      // Obsolete settings requests may still resolve; a new refresh can retry.
      visualState.stageSettingsPending = false;
      if (token !== visualState.token || !visualState.active) return;
      const groupIds = visualState.groupViewIds ? [...visualState.groupViewIds] : null;
      const records = await fetchVisualRecords(visualState.inventoryScope,groupIds);
      if (token !== visualState.token || !visualState.active) return;
      visualState.records = groupIds ?
        groupIds.map(id => records.find(record => getId(record) === id)).filter(Boolean) :
        records;
      for (const record of visualState.records) {
        const id = getId(record);
        if (visualState.selectedIds.has(id)) visualState.selectedRecords.set(id,record);
      }
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
        renderVisualFilterChoices();
        renderVisualResults();
      }
    }
  }
  function resetVisualFilters() {
    for (const prop of ['search','sale','minLength','minWidth']) visualState[prop] = '';
    visualState.materials.clear();
    visualState.pieceTypes.clear();
    visualState.photosOnly = false;
    const restoreInOnly = visualState.inventoryScope !== 'in';
    visualState.inventoryScope = 'in';
    visualState.shown = VISUAL_PAGE_SIZE;
    const root = document.getElementById('zmwm-visual-root');
    if (!root) return;
    for (const id of ['search','sale','min-length','min-width']) {
      const node = root.querySelector('#zmwm-visual-' + id);
      if (node) node.value = '';
    }
    const checkbox = root.querySelector('#zmwm-visual-photos-only');
    if (checkbox) checkbox.checked = false;
    const statusSelect = root.querySelector('#zmwm-visual-inventory-scope');
    if (statusSelect) statusSelect.value = 'in';
    if (restoreInOnly) loadVisualSearch();
    else {
      renderVisualFilterChoices();
      renderVisualResults();
    }
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
    visualState.extraDimensionFields = [];
    visualState.materials.clear();
    visualState.pieceTypes.clear();
    visualState.selectedIds.clear();
    visualState.selectedRecords.clear();
    visualState.groupName = '';
    visualState.groupViewIds = null;
    visualState.groupError = '';
    visualState.basketMessage = '';
    visualState.stageRights.clear();
    visualState.stageRightsPending.clear();
    visualState.stageSettings = null;
    visualState.stageSettingsPending = false;
    visualState.stageSettingsUnavailable = false;
    visualState.stageEditId = '';
    visualState.stageDraft = '';
    visualState.stageSavingId = '';
    visualState.stageMessages.clear();
    visualState.savedGroups = [];
    visualState.savedGroupsKey = '';
    visualState.savedGroupsError = '';
    if (visualState.savedGroupsStorageHandler &&
        typeof window.removeEventListener === 'function') {
      window.removeEventListener('storage',visualState.savedGroupsStorageHandler);
    }
    visualState.savedGroupsStorageHandler = null;
  }
  function startVisualSearch(event) {
    stopVisualSearch();
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    visualState.active = true;
    visualState.records = [];
    visualState.updatedAt = null;
    visualState.error = '';
    for (const name of ['search','sale','minLength','minWidth']) visualState[name] = '';
    visualState.materials.clear();
    visualState.pieceTypes.clear();
    visualState.photosOnly = false;
    visualState.inventoryScope = 'in'; // Never persist Out visibility across visits.
    visualState.listView = readVisualListPreference();
    visualState.sortKey = 'color';
    visualState.sortDirection = 'asc';
    visualState.shown = VISUAL_PAGE_SIZE;
    const locationSearch = str(window.location && window.location.search);
    const viewFromQuery = locationSearch.match(/[?&]view=([0-9]+)/);
    visualState.viewId = visualNormalizeGroupId(event && event.viewId) ||
      visualNormalizeGroupId(viewFromQuery && viewFromQuery[1]);
    visualLoadSavedGroups();
    // A different tab may save or delete a group on the same signed-in account.
    if (typeof window.addEventListener === 'function') {
      visualState.savedGroupsStorageHandler = storageEvent => {
        if (!visualState.active ||
            storageEvent.key !== visualState.savedGroupsKey) return;
        visualLoadSavedGroups();
        renderVisualBasket();
      };
      window.addEventListener('storage',visualState.savedGroupsStorageHandler);
    }
    const shared = readVisualGroupLink();
    if (shared && shared.error) visualState.groupError = shared.error;
    else if (shared && shared.ids) {
      visualState.groupViewIds = shared.ids;
      visualState.selectedIds = new Set(shared.ids);
      visualState.groupName = shared.name;
      visualState.inventoryScope = 'all'; // Groups can include historical Out pieces.
      visualState.listView = true; // Open shared groups as a selection table.
    }
    root.innerHTML = visualShell();
    const ui = root.querySelector('#zmwm-visual-root');
    if (!ui) return;
    if (ui.classList) ui.classList.toggle('is-shared-group',!!visualState.groupViewIds);
    const scopeSelect = ui.querySelector('#zmwm-visual-inventory-scope');
    if (scopeSelect && visualState.groupViewIds) scopeSelect.value = 'all';
    renderVisualBasket();
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
      if (event.target.id === 'zmwm-visual-group-name') {
        visualState.groupName = str(event.target.value).slice(0,VISUAL_MAX_GROUP_TITLE);
        visualState.basketMessage = '';
        visualUpdateShareLinkField();
        return;
      }
      const key = names[event.target.id];
      if (key) {
        visualState[key] = event.target.value;
        visualState.shown = VISUAL_PAGE_SIZE;
        renderVisualResults();
      }
    });
    ui.addEventListener('change',event => {
      if (event.target.dataset && event.target.dataset.visualStageChoice) {
        const id = str(event.target.dataset.visualStageChoice);
        const record = visualState.records.find(r => getId(r) === id);
        if (!record || !visualStageCanSelect(record) ||
            visualState.stageSavingId) return;
        const value = str(event.target.value);
        const settings = visualState.stageSettings;
        if (!settings.choices.includes(value) &&
            !(value === '' && !settings.required)) {
          visualRefreshStageControls();
          return;
        }
        if (value === getStage(record)) {
          visualState.stageEditId = '';
          visualState.stageDraft = '';
        } else {
          // One pending edit at a time; the other card reverts to its saved value.
          visualState.stageEditId = id;
          visualState.stageDraft = value;
        }
        visualState.stageMessages.delete(id);
        const host = typeof event.target.closest === 'function' ?
          event.target.closest('[data-visual-staging-record]') : null;
        visualRefreshStageControls();
        const replacement = host && host.querySelector ?
          host.querySelector('[data-visual-stage-choice]') : null;
        if (replacement && replacement.focus) replacement.focus({preventScroll:true});
        return;
      }
      const filter = event.target.dataset ? event.target.dataset.visualFilter : '';
      if (filter === 'material' || filter === 'type') {
        const selected = filter === 'material' ? visualState.materials : visualState.pieceTypes;
        if (event.target.checked) selected.add(event.target.value);
        else selected.delete(event.target.value);
        updateVisualFilterSummaries();
      } else if (event.target.id === 'zmwm-visual-list-view') {
        visualState.listView = event.target.checked;
        saveVisualListPreference(visualState.listView);
        // Only change presentation: preserve filters, result count and pagination.
        renderVisualResults();
        return;
      } else if (event.target.dataset && event.target.dataset.visualSelectId) {
        visualUpdateGroupSelection(event.target.dataset.visualSelectId,event.target.checked);
        return;
      } else if (event.target.id === 'zmwm-visual-inventory-scope') {
        const scope = event.target.value;
        if (!Object.prototype.hasOwnProperty.call(VISUAL_SCOPE_CONDITIONS,scope)) return;
        if (visualState.inventoryScope !== scope) {
          visualState.inventoryScope = scope;
          visualState.shown = VISUAL_PAGE_SIZE;
          loadVisualSearch();
        }
        return;
      } else if (event.target.id === 'zmwm-visual-sale') {
        visualState.sale = event.target.value;
      } else if (event.target.id === 'zmwm-visual-photos-only') {
        visualState.photosOnly = event.target.checked;
      } else return;
      visualState.shown = VISUAL_PAGE_SIZE;
      renderVisualResults();
    });
    // Capture photo clicks before Kintone's delegated link handlers.
    // The photo is an independent button, NOT an anchor to the record.
    ui.addEventListener('click', event => {
      const target = event.target;
      const photoButton = target && typeof target.closest === 'function' ?
        target.closest('.zmwm-visual-photo-action[data-visual-action="open-photo"]') : null;
      if (!photoButton) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      openVisualLightbox(photoButton.dataset.visualId,photoButton);
    },true);
    ui.addEventListener('click',event => {
      const button = event.target.closest('[data-visual-action]');
      if (!button) return;
      const action = button.dataset.visualAction;
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
      if (action === 'cancel-staging') {
        const host = typeof button.closest === 'function' ?
          button.closest('[data-visual-staging-record]') : null;
        visualCancelStage(str(button.dataset.visualStageId));
        const badge = host && host.querySelector ?
          host.querySelector('.zmwm-visual-stage-pill-select') : null;
        if (badge && badge.focus) badge.focus({preventScroll:true});
        return;
      }
      if (action === 'save-staging') {
        visualSaveStage(str(button.dataset.visualStageId));
        return;
      }
      if (action === 'save-group') {
        visualSaveCurrentGroup();
        return;
      }
      if (action === 'copy-saved-group') {
        visualCopySavedGroup(str(button.dataset.visualSavedId));
        return;
      }
      if (action === 'delete-saved-group') {
        visualDeleteSavedGroup(str(button.dataset.visualSavedId));
        return;
      }
      if (action === 'remove-group') {
        visualUpdateGroupSelection(button.dataset.visualId,false);
        return;
      }
      if (action === 'clear-group') {
        visualState.selectedIds.clear();
        visualState.selectedRecords.clear();
        visualState.basketMessage = '';
        visualState.groupName = '';
        visualSyncSelectedCheckboxes();
        renderVisualBasket();
        return;
      }
      if (action === 'copy-group') {
        visualCopyGroupLink();
        return;
      }
      if (action === 'leave-group') {
        visualState.groupViewIds = null;
        visualState.groupError = '';
        visualState.inventoryScope = 'in';
        const groupRoot = document.getElementById('zmwm-visual-root');
        if (groupRoot && groupRoot.classList)
          groupRoot.classList.toggle('is-shared-group',false);
        if (window.history && window.location &&
            typeof window.history.replaceState === 'function') {
          window.history.replaceState(null,'',
            window.location.pathname + window.location.search);
        }
        resetVisualFilters();
        loadVisualSearch();
        return;
      }
      if (action === 'sort' && visualState.listView) {
        const column = VISUAL_TABLE_COLUMNS.find(item => item.key === button.dataset.visualSort);
        if (column) {
          visualState.sortDirection = visualState.sortKey === column.key &&
            visualState.sortDirection === 'asc' ? 'desc' : 'asc';
          visualState.sortKey = column.key;
          renderVisualResults();
          // Recreated table headers should keep keyboard focus after sorting.
          const replacement = ui.querySelector(
            '.zmwm-visual-table-sort[data-visual-sort="' + column.key + '"]');
          if (replacement && replacement.focus) replacement.focus({preventScroll:true});
        }
      }
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
    startVisualSearch(event);
    return event;
  });
})();
