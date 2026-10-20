# Universal Warehouse IN v1 - Setup and Acceptance

Status: PREVIEW-ONLY. No Master App 6, OUT, Visual Search, staging, or live Kintone customizations are changed by this branch. The preview config blocks submissions and all photo uploads.

## Agreed operating rules

- Every incoming piece may be recorded immediately even when not identified or in Master Inventory.
- Require two distinct photos: full piece and identifying label (or alternative photo plus explanation if missing label). Additional photos optional.
- Keep all photos at 500,000 bytes (500 KB) or less, with Visual Search-style names and an IN suffix.
- Leave unknown color, material, dimensions, shape, thickness, finish, job, and Master ID truly blank. Do NOT invent App 5 lookup keys or other values.
- Save freeform label/color observations separately from the Color lookup field.
- A brand-new remnant is its own unmatched IN entry. An optional Parent Slab lookup (by exact Master record number) inherits color, material, thickness, finish, and originating job. It NEVER copies parent dimensions, shape, or parent Master record ID into the new remnant's master_record_id. If parent Type is Stock Slab, suggest STOCK Rem; if SO-Slab, suggest Stan-Rem; for other types, leave manual choice. The suggested Type is always editable, including to reclassify no-longer-stock material.
- IN Source uses six shop-friendly labels: New Remnant, New Slab, Unused Piece, Field Return, Customer Drop-off, and Other / Unknown. Inventory Type uses the same five categories as Master Inventory (not an additional generic Slab/Remnant field).
- Put Away Later is the default: Remnant Cart for remnants, Pending Putaway for other items; Put Away Now needs a real final rack.
- Each IN creates one App 15 Entry Sheet record with Inventory Status=In and identification state Needs Review or Identified. App 6 remains unchanged until owner reconciliation; Inventory Verified=No and Peter Notification default preserved.
- A separate Awaiting Putaway workflow and PUTAWAY event journal are next-phase work, NOT implemented in this initial IN form.

## App 15 existing fields to change from Required to Optional

All of the following must become non-required. Otherwise Kintone rejects an incomplete incoming piece:

- color (existing App 5 Color lookup; no fake keys)
- thickness
- finish
- old_job
- new_job
- shape
- length
- width
- material
- type (new field; same categories as Master, not required for unknown pieces)

Rack may stay Required because all IN records use a verified temporary or permanent Rack App 7 value. Keep inventory_status required. Do NOT change move_complete, App 6 Master, or any historical record. Confirm existing Warehouse OUT remains functional; it performs its own strict Master-data checks.

## Add these eight App 15 fields (leave ALL optional)

| Exact field code | Kintone field type | Choices/purpose |
|---|---|---|
| warehouse_event_type | Drop-down | IN; PUTAWAY (reserved for second phase; existing OUT events leave blank) |
| warehouse_in_source | Drop-down | New Remnant; New Slab; Unused Piece; Field Return; Customer Drop-off; Other / Unknown |
| type | Drop-down | Stock Slab; STOCK Rem; SO-Slab; Cosigned Slab; Stan-Rem (exact Master Inventory labels) |
| warehouse_putaway_plan | Drop-down | Put Away Later; Put Away Now |
| warehouse_identification_status | Drop-down | Needs Review; Identified |
| warehouse_observed_color | Text (one line) | Free-text label/color observation, NOT an App 5 lookup |
| warehouse_parent_reference | Text (one line) | Parent slab identifying text for remnants; never write owner-only parent_slab_id |
| warehouse_in_description | Text (multi-line) | All other observations, labels, marks or information |

Please use the exact labels/field codes shown. All 8 new fields should be optional so manual and historical workflows do not start requiring them.

## Existing owner protections stay unchanged

- inventory_verified: Drop-down, optional, default No, choices No and Yes.
- warehouse_disposition: Drop-down, optional, default Active, choices Active and Voided.
- peter_notification: USER selection, optional, single specific owner USER default, hidden/protected from employees.
- warehouse_request_id: Text (one line), unique values prohibited, reused for deduplication.
- master_record_id: Number; optional when new/unmatched.
- exact_picture: FILE; warehouse_label_status Drop-down (Present, Missing); warehouse_label_note Multi-line Text.
- Do not send owner-only fields inventory_verified, warehouse_disposition, peter_notification, parent_slab_id, ZMID, current_placement, or move_complete in crew REST POSTs.

## Add the two temporary locations in Rack App 7

Create two records (and verify each has a unique rack value):
- Remnant Cart
- Pending Putaway

These are LOCATION LABELS, not a requirement to buy separate carts. Every IN, whether matched or unmatched, must have one valid location. IN validates the name by querying Rack App 7 before uploading photos.

## Preview installation (AFTER new code is merged; NOT YET live)

App 15 (Inventory Entry Sheet) - Settings - Views - Add a Custom View:
- Name exactly: Warehouse IN
- Supported platforms: both Desktop and Mobile optimized
- HTML: <div id="zm-warehouse-in-root"></div>
- Disable pagination.

App 15 - JavaScript and CSS customization, on PC AND Mobile, retain existing files and then add:
1. JavaScript: https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-in-preview-config-v1.js
2. JavaScript: https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-in-v1.js
3. CSS: https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-in-v1.css

Do not install these links into App 6. They are for App 15 only. Do not install a live IN config until the app setup and employee test are approved. In PREVIEW, the Submit button is disabled. Actual write enablement requires a separate owner-approved live config that is not part of this branch.

## Validation after field setup

1. Preview the IN form on a phone and PC with the employee account.
2. Unmatched test: photos + source + temporary location. All other data blank; must be Needs Review and not linked to any Master.
3. Matched test: enter the exact piece's Master record ID and tap Find Master. Master is read-only; values can be captured on the IN entry.
4. New remnant: enter the PARENT Master record number in the dedicated Find Parent lookup and confirm inheritance (Color, Material, Thickness, Finish, Job). The NEW remnant must remain unmatched to a Master child record, and its own dimensions/shape must stay separate. Test editing STOCK Rem to Stan-Rem for stone no longer in stock. If no parent is known, allow manual description and Type.
5. Put Away Now: require final real rack (not Remnant Cart or Pending Putaway); verify it is in App 7.
6. Check 500 KB max per attachment, filename suffix IN, employee-created Peter bell notification, Inventory Verified=No, Active disposition, two photos, and zero App 6 writes.
7. Void dummy entries with no real material movement using your established cleanup process.

## Next phases (not implemented yet)

- Awaiting Putaway list: all types; employee sees the original IN photos and can assign final rack, no new photos.
- Independent append-only PUTAWAY record referencing original IN record; leave original IN and photo evidence intact. Later reconcile Master separately.
- Easier search for Master by color/job as well as exact record ID.
- Optional short 720p video evidence for both IN and OUT, with storage limit and device testing.
