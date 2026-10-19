# ZM Warehouse Movements: safe build plan (October 2026)

**State:** design agreed; coding in an isolated branch. **No live warehouse writes enabled.** Do not activate a crew-facing Confirm OUT button until the App 15 write mapping, permissions, and review-state semantics have been validated with the owner.

## Non-negotiable invariants

1. **ZM Inventory / Master App 6 is the verified source of truth.** Warehouse crew never automatically edits its records. Only owner-approved reconciliation changes Master. Existing RTS, Staging Sheet, Visual Search v2, maps, and App 6 Create Child Record action remain untouched.
2. **Inventory Entry Sheet / App 15 is the append-only movement journal.** Every movement is a distinct record. Do not overwrite its original photographs, notes, metadata, or its record-to-Master association. Never rely on the old one-value Master `entry_id` lookup as movement history.
3. **Preserve the working Master `movement_history` related table:** Master native Record number links to Entry App 15 `master_record_id` (Number, nullable for unmatched submissions). This relationship has already been tested in Kintone.
4. **Show every piece, every time.** Warehouse Staging v1 currently fetches all matching records in 500-record batches, renders all cards, and queues every thumbnail (max four downloads simultaneously); no pagination, hidden pieces, or silent partial results.
5. **Field-level confidentiality.** No financial amounts, cost, purchase price, vendor notes, credentials, or privileged API tokens to warehouse users. Enforce field/record permissions in Kintone; hiding fields in JavaScript is not a security boundary.

## Mobile OUT

- First pathway: crew selects a specific card in **Warehouse Staging**, after physically pulling the piece; taps **Confirm OUT**.
- Other pathway, later: search **all** existing Master pieces, even if not RTS. Rare unmatched OUT submissions are allowed and flagged for owner reconciliation.
- Prefill from the exact Master record, reread permitted nonfinancial metadata just before submission; do not fabricate missing or incompatible values.
- **Require two distinct photos:** (1) full piece, (2) identifying label. More photos optional. **Missing Label** exception requires an alternative identifying photo **plus an explanation** and flags the transaction.
- Attach photos to the **new App 15 Entry record** with distinguishable filenames/labels; don't replace Master `exact_picture` or `example_picture`.
- Write **one App 15 OUT entry**, including `master_record_id`, `inventory_status=Out`, `inventory_verified=No`, origin rack, job information, optional notes, and source identifiers; *never* write to App 6.
- Mark **Pending OUT** in Warehouse Staging immediately and after refresh, based on current Entry movement state, not just temporary browser memory. Avoid duplicate submissions and surface an explicit warning when pending status cannot be verified due to permissions. **Confirmed approval convention:** on newly submitted App 15 movements, `inventory_verified=No` means pending owner reconciliation, and owner sets `inventory_verified=Yes` after successfully reconciling to Master. Do not treat historical blanks as new pending movements. **Owner confirmed current behavior:** deletes entries for movements that never happened, but corrects entries in place when the physical movement was real and the data was wrong. For new automated submissions, use owner-approved owner-only **Void** instead of deletion to clear false pending status while retaining an audit record; do not conflate this with `move_complete`.
- Do not treat the piece as available for another pull while a pending OUT is present. Warehouse workers must still verify the physical piece; a photo/entry is not a substitute for physical identification.

## Universal mobile IN

One IN process covers remnant off saw, unused staged slab returned, new supplier slab, customer drop-off, jobsite return, or any material not in Master. **Not remnant-specific**.

- Link an existing Master record when found; otherwise allow **Unmatched — Needs Review** submission with its original details intact. Only the owner resolves it to an existing or new Master record.
- Require full-piece and identifying-label photos. Missing Label exception with alternative identifying photo and explanation; extra photos optional.
- Record each remnant individually **by default**. Include parent slab identification and originating job when known; don't lose lineage.
- IN and putaway are **separate events / states**; Master approval is a third independent state.
- Within the same initial IN form, choose:
  - **Put Away Later (default)**: record the IN and photos right away; temporary location and Awaiting Putaway status; crew can move on.
  - **Put Away Now**: enter final valid rack before submitting the IN; mark putaway complete; do not require a second view.
- Newly produced remnants default to temporary location **Remnant Cart**. Other materials default to general **Pending Putaway** location, not Remnant Cart. These names are location labels, not distinct carts. Confirm valid Rack App 7 lookup entries before activation.
- **Awaiting Putaway** shows *all* types (slabs, remnants, customer materials, jobsite returns). Another worker can identify by photos and submit final rack with minimal interaction; no new photos required.
- Record putaway as its own auditable event (who/when/from/to), without overwriting the original IN event or photos. A completed putaway leaves the outstanding list even if Master approval remains pending.
- A crew member can record and put away before owner approval, but only owner reconciliation changes verified Master.

## Incorrect submissions and corrections — owner-approved Void for new workflow

**What happens today (confirmed):** Owner **deletes** a truly mistaken Entry Sheet record if no actual movement took place. If the material really moved but details were entered incorrectly, owner **edits/corrects that Entry record** rather than treating it as a nonexistent movement.

**Approved design for the new mobile workflow (confirmed by owner):**

- **Void mistaken record:** Offer an **owner-only Void** action for a submitted IN/OUT that did not really happen or was a duplicate. Save who voided it, when, and a reason; do not erase its photos/notes or source link. It should immediately stop counting as **Pending OUT / Pending IN** and no longer appear in the active verification queue, but remain searchable in movement history. This improves the audit trail compared with hard deletion and prevents workers from thinking something was physically pulled when it wasn't.
- **Correct a real movement:** Owner edits the existing App 15 movement and adds a correction note as needed; Kintone record change history should be checked for traceability. Do not create a duplicate movement just to fix a typo. If a previously verified transaction changes, ensure Master can be reconciled again rather than silently letting the verified record become inconsistent.
- **Physically reversed movement:** If the piece truly went OUT and then came back IN (or vice versa), record **the actual reversal as a new movement**, not a Void.
- **Implementation prerequisite:** App 15 needs a dedicated way to distinguish *Voided* from *Pending* and *Verified* (e.g. a new owner-only disposition field, default Active/Voided, plus void reason/at/by). Keep **`inventory_verified=No`** as the existing owner review cue; pending detection must also exclude Voided records. Do not reuse `move_complete` or treat historical blank `inventory_verified` records as newly pending.
- **Decision confirmed:** owner approves replacing deletion with owner-only Void **for the new workflow**; current manual process and older entries remain unchanged until a deliberate migration decision.

## Existing App 15 required fields (field schema provided)

All twelve required fields must be written or validated, never silently populated with placeholders:

| Field code | Type | OUT sourcing / verification |
|---|---|---|
| `color` | lookup text (App 5) | Master `color`, exact lookup key and permissions |
| `thickness` | radio | Master `thickness`, 2cm or 3cm |
| `inventory_status` | radio | Out |
| `finish` | dropdown | Master `finish`, valid App 15 option |
| `new_job` | text | **Confirmed:** job the piece is being moved/pulled **for**; prefill from Master `job` when available, but make editable and require a meaningful destination job before OUT |
| `peter_notification` | required USER_SELECT | **Confirmed behavior:** owner receives a Kintone notification for each newly created App 15 record in the current manual workflow. Preserve this on custom submissions. Check actual selected user/default (and app notification configuration) before API POST; do not invent a user code, assume defaults apply to API inserts, or send a second duplicate notification. |
| `rack` | lookup text (App 7) | Master `rack`, valid lookup key |
| `shape` | dropdown | Master `shape` |
| `length` | number | Master `length` |
| `old_job` | text | **Confirmed:** previous job assignment, not the job being pulled for. Crew UI: Previous Job (optional), with explicit **No Previous Job** vs **Previous Job Unknown** selections. Save `N/A` for confirmed none to preserve historical convention; do **not** silently mark unknown as none. For unknown, owner approval must resolve or establish an intentional separate value. |
| `material` | dropdown | Master `material`, valid App 15 option |
| `width` | number | Master `width` |

**Schema mismatch to resolve before production:** Master `material` includes **Dolomite** but App 15 `material` does not; App 15 instead has **NOT SURE**. Master `finish` includes **Satin, Velvet, Concrete, Matte** that are absent from App 15. We should ideally align App 15 dropdown options before automation, never substitute a different material or finish silently.

Optional, approved-safe fields may include `master_record_id`, `inventory_verified`, `in_out_note`, `move_notes`, `color_combined`, `zmv_num`, `length_2`, `width_2`, and `exact_picture`. **Do not change, infer meaning from, or repurpose `move_complete`:** owner created it for an unrelated purpose and no longer recalls the original use. Some App 15 note fields are single-line: plan around actual configured limits or add a dedicated long-text field later.

## Implementation & safety gates

1. Implement **OUT UI and validation** in an isolated GitHub branch. Do not merge or instruct crews to use it until tested. Photos are submitted via authenticated Kintone Upload File API (POST multipart FormData with `__REQUEST_TOKEN__`), then file keys attached via Add Record API (POST App 15). No API token shipped to public GitHub Pages.
2. Preflight against current App 6 nonfinancial metadata and App 15 required fields/dropdown options. Fail closed with a helpful error if values or permissions are missing; do not create a partial movement record.
3. Implement persistent pending-OUT query linked on `master_record_id` and **new** App 15 OUT movements where `inventory_verified=No` and the owner-approved disposition is not Voided; distinguish those from `inventory_verified=Yes` approved movements, historical blank values, and explicitly voided records. Test duplicate prevention and historical records. Never block read-only Staging if App 15 is temporarily inaccessible; show an explicit pending-status warning. Do not use `move_complete` for this.
4. Verify mobile camera inputs, actual signed-in crew account field/API privileges, and photo uploads. Simulate failure/slow upload/retry so one movement is not accidentally posted twice. Use a unique client transaction ID and server-side check if possible.
5. Owner acceptance test: movement appears instantly in Master Movement History, two photos correctly attached in App 15, its review queue flags missing label, Master unchanged, and all 15+ staged pieces still display.
6. Only then enable crew-facing OUT button and roll out. Build general IN and putaway after OUT is validated.

## Open owner decisions (don't guess)

- **Confirmed job semantics:** Old Job = former assignment; New Job = job material is going to. Existing practice uses `N/A` if no previous job. Crew-facing UI should offer **No Previous Job** explicitly and serialize that as `N/A` for backward compatibility; a genuinely **Unknown** prior job is distinct and should require owner decision/approved sentinel before deployment.
- **Confirmed notification outcome:** owner receives a notification whenever crew creates a new App 15 record. **Implementation verification still needed:** inspect the required `peter_notification` USER_SELECT field's default/selected user and Kintone app notification rule, then submit a test via Kintone REST API as a crew account and confirm it triggers exactly one owner notification.
- **Confirmed owner approval workflow:** After reconciling an App 15 entry to Master, owner manually sets `inventory_verified=Yes`. For new automated movements, start `inventory_verified=No` to mean pending. `move_complete` is unrelated and must be left unchanged. **Owner confirmed:** delete truly accidental entries today; correct real but erroneous entries in place. **Approved for new workflow:** owner-only Void with reason/audit trail instead of deletion for transactions that did not happen, excluded from pending indicators. Use a separate disposition field; do not reuse `move_complete`.
- Confirm crew create/read permissions in App 15, and create/validate temporary App 7 Rack entries **Remnant Cart** and **Pending Putaway** before the IN phase.

## Scope boundaries

This document proposes safeguards and mapping. It does not change active code, add a live OUT button, write to Kintone, or alter existing Inventory records. Keep the current working read-only Warehouse Staging JS/CSS and Visual Search v2 safe while the integration is designed.
