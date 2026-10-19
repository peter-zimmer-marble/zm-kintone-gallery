# Warehouse Confirm OUT v1 — supervised rollout checklist

**Status: DRAFT, NOT INSTALLED.** The Confirm OUT addon exists only on GitHub draft PR #15. It is disabled by default. The live Warehouse Staging v1, Visual Search v2, native Staging Sheet and all active Kintone inventory records are unchanged.

## Kintone setup already completed by the owner (October 19, 2026)

The owner has reported making/publishing the following changes. **These have not yet been verified through a live Kintone API response or a warehouse-login test.**

| App | Field / rule | Current owner-reported setting |
| --- | --- | --- |
| Entry Sheet App 15 | Warehouse Request ID (`warehouse_request_id`) | Single-line text, optional, no default, duplicate values prohibited |
| Entry Sheet App 15 | Warehouse Disposition (`warehouse_disposition`) | Drop-down: Active / Voided, optional, **default Active**; owner View+Edit / Everyone View only |
| Entry Sheet App 15 | Warehouse Label Status (`warehouse_label_status`) | Drop-down: Present / Missing, optional, blank default |
| Entry Sheet App 15 | Warehouse Label Note (`warehouse_label_note`) | Multiline text, optional |
| Entry Sheet App 15 | Peter Notification (`peter_notification`) | USER_SELECT, **Required unchecked**, default to owner's specific user; owner View+Edit / Everyone no View or Edit |
| Entry Sheet App 15 | Inventory Verified (`inventory_verified`) | Drop-down No/Yes, optional, **default No**; owner View+Edit / Everyone View only |
| Entry Sheet App 15 | Record permissions | Priority rule for Inventory Verified = Yes: owner View+Edit+Delete, Everyone View only; below it, All Records: owner full, Everyone View+Edit (not Delete) |
| Master App 6 | Existing field setup | Accidental four tracking fields removed; original `movement_history` linking Master record number to App 15 `master_record_id` is retained |

Other preexisting Entry field ACLs remain untouched: ZMID, Parent Slab ID, Current Placement. `move_complete` is unrelated and **must not be repurposed**. The owner uses Inventory Verified = Yes to indicate that the Entry was reconciled to Master.

## Updated Add Record behavior — protected defaults

The **crew-side Kintone POST omits these three fields entirely**:

- `inventory_verified`: Kintone must apply **No** from its configured default.
- `warehouse_disposition`: Kintone must apply **Active**.
- `peter_notification`: Kintone must apply the **owner's single-user default**, resulting in the same single owner notification as manual entries.

Kintone's documented Add Record API applies defaults to omitted fields and requires Edit permission for any field **explicitly supplied**. Peter Notification was made optional so the restricted crew account can omit it, while retaining the existing owner recipient and field permissions. It remains forbidden for the crew to explicitly edit these fields.

**Safety guard:** The addon reads App 15's `GET /k/v1/app/form/fields.json` schema and checks the three exact defaults, optional status, valid choices, and protected user default before enabling submission. Immediately before uploading the first photo it **fetches the form schema again** and aborts on any mismatches. It refuses to POST protected fields.

**Validated so far in real Kintone:** A restricted warehouse login (ZMP) can read the necessary default metadata, Master Inventory records, and the App 15 pending-OUT query. **Still unverified:** whether omitted protected fields are populated as intended on an actual REST-created record, and whether the owner receives exactly one notification. **Do not activate the draft addon until a supervised real OUT proves these behaviors.** Mock tests do not establish live write behavior.

Docs:
- [Add Record API](https://kintone.dev/en/docs/kintone/rest-api/records/add-record/)
- [Get Form Fields API](https://kintone.dev/en/docs/kintone/rest-api/apps/form/get-form-fields/)

## Optional addon behavior (code complete in draft, not deployed)

- Adds **Confirm OUT** buttons only inside the existing Warehouse Staging custom view; the original read-only JS and CSS aren't edited.
- Keeps **all staged pieces** visible, with photos and current Master In/Out Notes; four simultaneous photo downloads is only a network-concurrency limit.
- Before enabling an OUT button, queries new App 15 entries with matching `master_record_id`, `inventory_status=Out`, `inventory_verified=No` and `warehouse_disposition=Active`. Marks matches **Pending OUT**. Unverified historical blanks, verified entries and voided entries do not count. If Entry API permissions prevent the pending check, **disable submissions but still show all staging pieces**.
- Requires two distinct phone photos: **whole piece + identifying label**; if missing label, **alternative identifying photo + required explanation**. Additional photos optional. Photo filenames distinguish purpose; all go on new App 15 movement, not Master.
- Prefills safe material, rack, dimensions, color and job from the selected Master record. Crew enters/edit New Job (destination) and Previous Job (a name, No Previous Job => N/A, or Unknown => UNKNOWN - REVIEW). Existing In/Out Notes remain read-only; the movement may also carry a short new note.
- Submits one App 15 OUT movement with `master_record_id`, `inventory_status=Out`, `warehouse_request_id` (unique), source info and new photos. Crew cannot write financial fields or protected approval/notification fields. **Omits App 15 Parent Slab ID and other optional lookup-derived fields**, which may be owner-only, mapped or calculated and therefore not safe API write targets; the Master record ID preserves read-only access to source lineage and additional dimensions. **Never writes App 6**.
- Refreshes safe Master fields before file uploads; rejects stale job, rack, dimensions, material or movement status. The browser never automatically retries an ambiguous record POST and uses the unique request ID to look up prior successes.
- Leaves existing RTS, the original Staging Sheet, Visual Search v2, and the native Create Child Record action untouched.

## Employee-account native Add form check — screenshot (October 19, 2026)

Owner logged in as **ZMP** employee account and opened **App 15 → Add record** without saving. Screenshot confirms:

- Inventory Verified shows **No** in a gray, read-only dropdown.
- Warehouse Disposition shows **Active** in a gray, read-only dropdown.
- Peter Notification is **not visible** to the employee (consistent with owner-only View/Edit ACL).
- Warehouse Request ID is blank and editable; Label Status and Label Note are editable.
- No access or form-rendering errors, employee can open the native Add screen.
- Screenshot also shows **Move Complete = Yes** by its preexisting default. This field has unrelated semantics; **do not edit it or use it** in new OUT flow.
- The screenshot establishes native **form rendering**, **not** the REST form schema read, API-side default application, field-level edit enforcement, automatic owner notification, or success of the custom OUT POST.

**Outcome:** the read-only Kintone form metadata check described below was run successfully as ZMP. No record was created or modified.

## Employee-account read-only Form Fields REST API check — PASSED (October 19, 2026)

Using the **ZMP employee account** in the browser console, the owner ran
`GET /k/v1/app/form/fields.json` for App 15 and provided a screenshot
showing:

| Property | Employee-visible API result |
| --- | --- |
| Inventory Verified | Found; default `No`; required `false` |
| Warehouse Disposition | Found; default `Active`; required `false` |
| Peter Notification | Found; a **single configured USER** default; required `false` |
| Warehouse Request ID | Found; unique `true` |
| Dolomite material option | Present |
| Satin, Velvet, Concrete, Matte finish choices | All present |

This confirms **schema metadata GET succeeds using a restricted employee
login** and that protected-default preflight can see the necessary settings.
It does **not** disclose/prove the exact user identity in Peter Notification
(the console reported only the shape of its default), nor verify defaults on
a newly created record, actual add-record API permission, or receipt of
a notification. No record was created or updated.

**Outcome:** the ZMP employee-account Master / pending OUT read-only test described below was successful. Live writes remain disabled.

## Employee-account read-only Master and Pending OUT checks — PASSED (October 19, 2026)

Using the **ZMP** account, the owner ran a console script with **GET-only**
requests to:

- **App 6:** read 1 Master record meeting the staged/in-inventory conditions
  using exactly the draft addon safe allowlist.
- **App 15:** check that sampled Master record ID for existing
  `inventory_status=Out`, `inventory_verified=No` and
  `warehouse_disposition=Active` movement entries.

Console results: **Read Master Inventory = PASS**;
**Read pending movements = PASS**; sampled piece
**existing Pending OUT = No**. Query covered one sampled Master piece,
not the entire inventory. No Kintone writes occurred.

**Read-only access gates are passed.** The remaining major gate is a
**supervised real physical OUT** on a selected piece with two distinct
photos and post-submit verification. Avoid dummy movement entries in
production; prepare rollback/owner correction path and obtain explicit
approval of the selected piece and test time before enabling any crew
submission.

**API mapping risk caught during review:** Kintone refuses REST Add Record
writes to lookup field-mapping targets, calculated fields and fields
lacking caller Edit permission. The draft now **omits**
`color_combined`, `zmv_num`, `length_2`, `width_2`,
`parent_slab_id` and all three owner-only fields from the crew POST.
Secondary details remain accessible via `master_record_id`.
The critical Color and Rack lookup source keys must still be validated
when testing a real Add Record. Reference:
https://kintone.dev/en/docs/kintone/rest-api/records/add-record/

## Remaining blockers before installing or merging

1. **Live Kintone schema and restricted-login check:** Confirm that App 15's actual field codes/types/required/defaults exactly match the table above, including the unique request ID. Crew must read permitted status fields while NOT receiving edit access to Inventory Verified, Warehouse Disposition, or Peter Notification.
2. **Dropdown alignment owner-reported complete:** **Dolomite** added to App 15 Material and **Satin, Velvet, Concrete, Matte** added to Finish; all preexisting choices retained and changes published October 19, 2026. Confirm via live Kintone schema during read-only preflight. The draft still rejects unsupported options rather than substituting.
3. **Confirm protected defaults through a supervised OUT test** on a safe known Master piece: both photos attached to App 15, fields filled as expected, Master Movement History displays the entry, `inventory_verified=No`, `warehouse_disposition=Active`, owner recipient preserved, **one notification**, Master unchanged.
4. **Test record ACLs:** A warehouse login can still create/edit unverified entries but cannot modify verified entries, verify an Entry, void an Entry, or change Peter Notification. Existing manual Entry Sheet work must remain functional.
5. **Owner Void action:** The new owner-only disposition field exists, but a convenient Void-with-reason UI is **not yet built**. Owner can decide on an interim native edit procedure and add an owner-only `warehouse_void_reason` text-area field when designing the audited Void action. Don't delete newly automated movement history.
6. **Phone/reliability tests:** Validate camera input, Missing Label, additional photos, temporary API failures and cross-device duplicate risks. Current pending checks + unique request ID prevent accidental retry but are **not an atomic lock** between two devices.

### Future activation — NOT YET

After real-user acceptance tests and owner sign-off, install the additional addon JS/CSS after the **existing** Warehouse Staging customization on desktop and mobile. The addon is inert unless an administrator supplies its explicit enablement/permissions-validation config. Do not publish privileged API tokens or login credentials in public GitHub or browser code.

Draft assets (not yet live on Pages):
- `zm-warehouse-out-v1.js`
- `zm-warehouse-out-v1.css`
- `tests/warehouse-out-v1.test.js`

Rollback: remove only the optional addon configuration and its JS/CSS; never remove the working Warehouse Staging or Visual Search scripts.
