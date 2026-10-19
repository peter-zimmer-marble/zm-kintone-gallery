# Confirm OUT v1 — disabled draft

**Do not deploy yet.** This branch has an additional JavaScript module and
stylesheet. Both are absent from the installed live Kintone customization.
The existing Warehouse Staging and Visual Search remain unchanged.

## What works in the draft

The optional addon inserts Confirm OUT buttons into Warehouse Staging cards
and fetches pending movements from Entry App 15. All staged pieces remain
visible, without pagination. Buttons are disabled if the pending status
cannot be checked (for example, insufficient Kintone permissions).

The crew must take **two separate photos**: the whole piece and the
identifying label. Missing-label exceptions require an alternative
identifying photo and a reason. Additional photos and a short note are
optional. New Job is prefilled from Master job and editable. The crew
chooses Previous Job; No Previous Job maps to N/A, and Unknown maps to
UNKNOWN - REVIEW. The owner should confirm the Unknown sentinel during testing.

The new Entry is linked via master_record_id; it starts with
inventory_status=Out, inventory_verified=No, warehouse_disposition=Active.
The code never writes Master App 6, modifies existing Master photos, overwrites
the old entry_id lookup, or uses move_complete. It preserves the existing
Movement History related table.

Kintone uploads photos individually using multipart form data and a session
CSRF token. The Add Record request attaches their returned file keys to
App 15 exact_picture. The required Peter Notification user is explicitly
specified. No confidential API token, password, or inventory export is shipped
in this public repo.

## Required App 15 fields before enabling

The following NEW field codes must be added and published by a Kintone admin:

| Field code | Kintone type | Details |
| --- | --- | --- |
| warehouse_request_id | Text | Must prohibit duplicate values |
| warehouse_disposition | Drop-down | Active, Voided |
| warehouse_label_status | Drop-down | Present, Missing |
| warehouse_label_note | Text area | Reason for missing label |
| warehouse_void_reason | Text area | Recommended for the owner-only Void step; not yet automated |

The already-added master_record_id Number field must remain on App 15.
The native Master Movement History related-records field must remain linked.
All twelve existing required Entry fields remain required: color, thickness,
inventory_status, finish, new_job, peter_notification, rack, shape, length,
old_job, material, width. The draft reads App 15's live form schema and
refuses to submit if any expected new fields or dropdown choices are missing.

**Resolve known dropdown mismatches before activation:** Master material
includes Dolomite but App 15 currently does not. Master finish includes
Satin, Velvet, Concrete and Matte, which App 15 currently lacks.
Do not guess or substitute values.

**Peter Notification:** Crew-created manual Entry records currently notify
the owner. The module obtains a confirmed single static USER default from
the required App 15 user select field or uses an explicit verified user code
in config. Test that a custom submission sends exactly one notification.

**Permissions:** Warehouse users need safe Master read access and App 15
read/create access, but must not gain access to confidential Master fields
or permission to verify/void/correct an Entry. Only the owner can mark
Inventory Verified=Yes and use Void. Verify Kintone app, record and field
permissions with a real warehouse login; a frontend button is not a
permission boundary.

## Configuration — DO NOT INSTALL UNTIL TESTED

Add a Kintone-only configuration script before the addon, and place its
JS/CSS URLs AFTER existing Warehouse Staging customization in desktop
and mobile, once all acceptance checks pass. The global config must be
enabled=true and ownerValidatedPermissions=true. A peterUserCode may also
be supplied using the actual verified Kintone owner login code.

The two ADDITIONAL script URLs will eventually be:
- https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-out-v1.js
- https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-out-v1.css

**These files are in an unmerged draft branch, so do not use the URLs now.**
Simply leaving out the config disables all addon behavior.

## Supervised tests before approving production

1. Leave addon disabled; confirm existing staging counts/photos/notes and
   native Staging Sheet, RTS, Visual Search v2 all remain unchanged.
2. Enable only on a controlled test account/view with Kintone field setup
   and permissions reviewed. Pending OUT prevents a second crew submission.
   Historical blank, verified, and owner-voided records must not block.
3. Take two unique photos; submit for a safe test Master piece.
   App 15 must have exactly one new Entry with both attachment file keys,
   correct source/job/rack/material/dimensions, and Master Record ID.
4. Confirm Entry appears in Master Movement History, notification arrives
   once, and Master inventory did not change.
5. Refresh staging: the piece is still shown but flagged Pending OUT.
   Confirm mobile behavior for Missing Label exception and extra photos.
6. Owner reconciles and sets Inventory Verified=Yes. An erroneous movement
   can be Voided with a reason by the owner while retaining history; the
   owner-only Void action is NOT built in this draft yet.
7. Exercise permission errors, incompatible Master dropdown selections,
   interrupted uploads, ambiguous submissions and stale Master data.

## Duplicate caveat

The unique warehouse_request_id protects a retry of the same request.
A pending-read preflight and disabled buttons help protect against
double pulling. Two different devices can still submit in a narrow race
window, because independent Kintone Add Record calls aren't atomic on
Master record ID. Decide whether a server-side or unique-key locking
mechanism is required before broad deployment.

## Official API references

Upload File: https://kintone.dev/en/docs/kintone/rest-api/files/upload-file/
Add Record: https://kintone.dev/en/docs/kintone/rest-api/records/add-record/
Get Form Fields: https://kintone.dev/en/docs/kintone/rest-api/apps/form/get-form-fields/

## Rollback

Remove ONLY the addon configuration and its JS/CSS customizations.
Do not remove the existing Warehouse Staging or Visual Search files.
