# Confirm OUT v1 — disabled draft

**User confirmation (2026-10-19):** All four core tracking fields were added to **Entry Sheet App 15** and the same accidental additions were removed from **Master App 6**. The changes have been published. The owner also confirmed that App 15's existing **Peter Notification** user-select field has him as its default, and on 2026-10-19 he **unchecked Required**, retained that default and the owner-only permissions, and published App 15. These are user-reported settings; verify their exact field codes/types/default through the live Kintone form schema as part of acceptance testing.

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

The following four NEW field codes have been added/published by the owner, subject to live schema verification:

| Field code | Kintone type | Details |
| --- | --- | --- |
| warehouse_request_id | Text | Must prohibit duplicate values |
| warehouse_disposition | Drop-down | Active, Voided |
| warehouse_label_status | Drop-down | Present, Missing |
| warehouse_label_note | Text area | Reason for missing label |
| warehouse_void_reason | Text area | Recommended for the owner-only Void step; not yet automated |

The already-added master_record_id Number field must remain on App 15.
The native Master Movement History related-records field must remain linked.
Eleven existing Entry fields remain required after the owner removed **Required** from Peter Notification: color, thickness,
inventory_status, finish, new_job, rack, shape, length,
old_job, material, width. The `peter_notification` USER_SELECT field remains present but optional and access-restricted. The draft reads App 15's live form schema and
refuses to submit if any expected new fields or dropdown choices are missing.

**Resolve known dropdown mismatches before activation:** Master material
includes Dolomite but App 15 currently does not. Master finish includes
Satin, Velvet, Concrete and Matte, which App 15 currently lacks.
Do not guess or substitute values.

**Peter Notification:** Owner confirms App 15 USER_SELECT has **his account as its default**, **Required unchecked**, and remains **owner-only** for view/edit; the change was published. Official Add Record API docs say omitted optional fields receive defaults. The draft module still explicitly writes this restricted field, so **must be adapted to OMIT `peter_notification` from crew API POST** before activation. Confirm actual field default and resulting recipient through a supervised crew-account create/read/notification test; do not invent a login code.

**Permissions:** Warehouse users need safe Master read access and App 15
read/create access, but must not gain access to confidential Master fields
or permission to verify/void/correct an Entry. Only the owner can mark
Inventory Verified=Yes and use Void. Verify Kintone app, record and field
permissions with a real warehouse login; a frontend button is not a
permission boundary.

## Permission review — screenshot supplied by owner (2026-10-19)

On **App 15 → Permissions for app**, screenshot shows:

- Owner's specific user row and App Creator role: **View, Add, Edit, Delete, Manage App, Import, Export** enabled.
- **Everyone:** **View, Add, Edit** enabled; **Delete, Manage App, Import, Export** disabled.
- No warehouse-specific permission row is visible. This **does not prove** Everyone can edit approval/void fields: record-level and field-level permissions must also be checked.

**Do not remove Everyone's existing App-level Edit permission yet.** Existing manual Entry Sheet operations may rely on it. App 15 field and record-level permissions were subsequently inspected as documented below.

**Important Kintone API constraint:** Add Record requires field-level **Edit** permission for **every field provided in the request body**, even when the caller has App Add permission. If we make `inventory_verified` or `warehouse_disposition` owner-only at the field level while the new browser addon still submits `No` or `Active` explicitly, **the crew's API POST will fail**. The future secure arrangement may involve Kintone new-record field defaults (`No` and `Active`) with those restricted fields **omitted** from crew POSTs, after testing default application with a real restricted warehouse login. App-level Add remains enabled; Edit can eventually be owner-only if the crew does not need to correct existing entries directly.

**Never rely on frontend-only rules to prevent a crew account from writing `Yes` or `Voided`.** App/record/field permissions must enforce this. Need design verification via a restricted-login add test and then revise the draft POST mapping **before deployment**.

Kintone docs:
- https://kintone.dev/en/docs/kintone/rest-api/records/add-record/ (Add Record permission to edit included fields; omitted fields get defaults)
- https://us.kintone.help/k/en/app/rights/field_rights (field-level ACL behavior)
- https://us.kintone.help/k/en/app/rights/record_rights (record-level ACL behavior)

## App 15 FIELD permissions confirmed by screenshot (2026-10-19)

The owner supplied **Permissions for fields** screenshot. The following
existing field permission sets are visible:

| Field | Owner | Everyone |
| --- | --- | --- |
| `ZMID` | View + Edit | View; no Edit |
| `Peter Notification` (`peter_notification`) | View + Edit | **No View and no Edit** |
| `Parent Slab ID` (`parent_slab_id`) | View + Edit | View; no Edit |
| `Current Placement` (`current_placement`) | View + Edit | View; no Edit |
| `Inventory Verified` (`inventory_verified`) | View + Edit | **View; no Edit** |

**Keep these existing permissions unchanged.** In particular, the crew
cannot manually verify inventory and cannot alter the required
`peter_notification` recipient. These field-level restrictions override
the broad "Everyone: Edit records" at the App level.

**Critical issue with the current draft browser API implementation:**
It explicitly includes `inventory_verified=No` and the
`peter_notification` selected user in the Add Record request. Kintone's
official Add Record documentation states (1) every included field requires
**Edit** permission, and (2) **required fields must be included in the API
request**. Therefore, the current draft direct App 15 REST POST is **not
ready to work from crew accounts**. Field defaults on native record forms do
not establish an exemption from those API rules. Do not remove the existing
field restrictions to make an experimental POST pass.

**Implementation redesign / prerequisite:** Preserve native field ACLs. For
the optional `inventory_verified` and `warehouse_disposition` fields,
test use of server-populated defaults while omitting protected fields from
the crew API payload. But for the required, protected Peter Notification,
research/test either a suitable **native Kintone create-record flow** that
preserves its protected default, or a **properly authenticated secure
server-side write broker** with no credentials or elevated Kintone tokens in
public JavaScript. The actual crew transaction, correct owner notification,
all required fields, and no Master modifications must be verified before
activation. **Do not claim that omitting the required user field is proven
to work.**

**Field permission change completed (owner-confirmed 2026-10-19):** Added a
`Warehouse Disposition` field-level permission set in **Entry Sheet App 15**:
owner **View+Edit**, Everyone **View only**. Owner reports saving and publishing.
Verify the live settings with a restricted warehouse login before deployment.
Leave `Warehouse Label Status`, `Warehouse Label Note`, and
`Warehouse Request ID` editable by crew so submission data can be recorded.
**Do not change App-level Everyone Edit** yet because manual workflows may rely
on it. **Next:** inspect App 15's **Permissions for records** before deciding
whether additional record-level controls are needed.

Official Kintone API limitation:
https://kintone.dev/en/docs/kintone/rest-api/records/add-record/

## App 15 RECORD permissions confirmed by screenshot (2026-10-19)

The **Permissions for records** screenshot shows a single rule:
**Target: All records**. Owner: View+Edit+Delete. Everyone:
View+Edit, **no Delete**. There are no other record-level
conditions shown. Combined with field-level ACLs, the crew can
currently edit ordinary fields (dimensions, jobs, racks) even in
entries whose **Inventory Verified=Yes** was already approved by the
owner; crew cannot change Inventory Verified or Warehouse Disposition.

**Owner confirmed (2026-10-19):** Nobody other than the owner needs to edit
an Entry Sheet record after Inventory Verified=Yes. **Owner reports the
record-permission change was saved and App 15 updated:** a higher-priority
**Inventory Verified = Yes** rule grants owner View+Edit+Delete and
Everyone **View only** (no Edit/Delete). Existing lower-priority All records
rule remains unchanged for No/blank verification entries. This is the
owner's report, not a live Kintone API verification. Test a verified and
an unverified record under a warehouse login before production rollout.
App-level Everyone Edit and existing field permissions were left in place.

**Potential simpler Peter Notification solution — still requires owner
approval and a safe test:** Keep owner default and field-level
**owner-only** visibility/editing, but unset **Required** on
`peter_notification`. Kintone's Add Record API applies defaults to
fields omitted from requests, yet it requires explicitly including
fields marked Required. If the user field becomes optional and stays
protected, the crew API payload could OMIT it, avoiding a forbidden
edit. Similarly, set safe defaults **Inventory Verified=No** and
**Warehouse Disposition=Active**, then omit both protected fields in
the crew request. This is a **proposed configuration**, not yet made
or verified. It avoids elevated API tokens and preserves the owner
notification default, assuming actual default application and the
existing Kintone notification rule are verified end-to-end. The
**current draft JS still explicitly includes these protected fields
and MUST be changed before any crew activation**.

Documentation:
- https://us.kintone.help/k/en/app/rights/record_rights
- https://us.kintone.help/k/en/trouble_shooting/app_qa/permission_example1
- https://kintone.dev/en/docs/kintone/rest-api/records/add-record/
- https://us.kintone.help/k/en/app/form/form_parts/user_selection

**Peter Notification prerequisite complete (owner report; API verification outstanding):**
The existing `peter_notification` USER_SELECT field is now **optional**,
still defaults to the owner, and remains fully hidden from the crew by field ACLs.
The documented Add Record REST API requires Required fields to be included,
and requires Edit permission for included fields. Our new crew API POST must
**omit** `peter_notification` so its protected default can be applied.
The owner has already made and published that change. Kintone's Add Record API
documents that omitted fields receive their defaults; the custom submission
must omit `peter_notification` entirely rather than trying to write it.
End-to-end test that the owner gets the expected notification on an App 15
entry created as a restricted warehouse user. **The configuration is published,
but API behavior is still unverified.** Related next steps:
configure Inventory Verified default `No` and Warehouse Disposition
default `Active`, omitting both restricted fields from crew API POSTs.
Do not change existing permissions to make the draft work.
Official docs: https://kintone.dev/en/docs/kintone/rest-api/records/add-record/

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
