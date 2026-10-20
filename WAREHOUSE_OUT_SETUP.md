# Warehouse Confirm OUT v1 — supervised rollout checklist

**Status: PREVIEW ASSETS PUBLISHED TO MAIN/GITHUB PAGES SOURCE; NOT INSTALLED IN KINTONE.** Only the three optional preview assets (`zm-warehouse-out-pilot-preview-v1.js`, `zm-warehouse-out-v1.js`, `zm-warehouse-out-v1.css`) were copied to GitHub `main` after owner approval; draft PR #15 remains open and unmerged. The preview config is frozen with `pilotSubmitEnabled:false`. The live Warehouse Staging v1, Visual Search v2, native Staging Sheet and all active Kintone inventory records are unchanged.

## Kintone setup already completed by the owner (October 19, 2026)

The owner has reported making/publishing the following changes. **Several settings have now been verified with GET-only API calls as the ZMP employee**, as detailed below. No production record has been created by the custom workflow; remaining write behavior must still be tested.

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

## Employee-account Color and Rack lookup-key checks — PASSED (October 19, 2026)

Using the **ZMP** session, the owner ran read-only Kintone form-field
metadata checks. Screenshot showed:

| App 15 lookup | Source app | Source key field | Result |
| --- | --- | --- | --- |
| Color | **5** | `color_name` | **PASS** (Record number or unique key) |
| Rack | **7** | `rack` | **PASS** (Record number or unique key) |

This clears Kintone's requirement that Lookup data-source key fields
must be a unique-value field or Record number for REST Add Record.
The result checks **lookup schema compatibility, not that a particular
Master piece's Color/Rack will successfully resolve or grant the
user access at submission time**. No records were changed.

**Pilot identified:** Owner selected **Master #8160** and the ZMP employee account for a future **real warehouse OUT**. The actual movement date/time is not yet confirmed; preview-only inspection can proceed without a physical pull.
Before enabling a crew-facing button, keep the addon draft isolated,
prepare a controlled rollout/rollback, check the current PR CI, ensure
the correct phone account is used and a **Void/correction protocol**
is ready for a failed test. Run exactly one supervised physical OUT
with two photographs, then independently verify defaults, owner
notification, Master movement-history link, and that Master App 6
remained unchanged. Do not create a dummy OUT solely to test code.

## Pilot: Master App 6 record #8160 / ZMP employee account

**Pilot piece selected by owner:** [Master record #8160](https://zimmermarble.kintone.com/k/6/show#record=8160).
This is the sole eligible Master record for the first supervised OUT. No
movement has been recorded. **Verified employee login code: `zmproduction`**,
confirmed in the ZMP employee Console screenshot. The same GET-only
test confirmed **Essenza / Quartzite / BRUSHED**, dimensions **131 × 80
inches**, rack **LP-2A**, **inventory_status=In**, **staging_status=RTS**,
and **no current Pending OUT**. The job label begins
**Brandenburg, Ellen & ...** (truncated in the screenshot; don't infer
its complete name).

**Dedicated pilot preview configuration published from GitHub `main`,
not installed in Kintone:**
`zm-warehouse-out-pilot-preview-v1.js`. Its COMPLETE contents are:

```js
window.ZM_WAREHOUSE_OUT_CONFIG = Object.freeze({
  enabled: true,
  ownerValidatedPermissions: true,
  pilotMasterRecordId: '8160',
  pilotUserCode: 'zmproduction',
  pilotSubmitEnabled: false
});
```

This is immutable for the page session; the addon checks
`pilotSubmitEnabled === true` **before even its first network
request or photo upload** when submitting. The preview form also shows a
**disabled** submit button. To transition to the real OUT later, make
a **separate approved live config**—do NOT try to modify the frozen
preview configuration from the browser Console.

This must be loaded **before** the standalone OUT addon script, following
the existing Warehouse Staging JS. The draft addon is inert for any
other Kintone user; it adds a button **only** to staged record #8160.
The selected ID is also enforced in the submission method before any
network request/photo upload. This browser-side gating is NOT a security
boundary; Kintone App 15 permissions remain authoritative.

**Dry-run stage (no writes):** The GET-only checks already confirmed the
Master's staging/stock/pending status and the ZMP login. **Next owner
approval:** publish the preview-only JS/CSS and configure them in
Master App 6 after the existing Staging customization (do not change
the original JS/CSS). In Kintone's file loading order: existing
Staging JS, then the new **pilot preview config**, then the **OUT addon**
JS; also add OUT addon CSS. The preview only shows Confirm OUT for #8160
as `zmproduction`; inspect mobile layout, autofilled
job/rack/color/dimensions and source record selection with a
**disabled Submit** button. No photo upload, file-key creation or
App 15 record POST occurs during preview. The PR is still draft,
**not merged**, so do not paste imaginary GitHub Pages links.

**Supervised live stage (only after separate owner approval):** Replace the
frozen preview config with a separately reviewed live configuration
setting `pilotSubmitEnabled: true`, then verify
signed-in employee code and record #8160 again, ensure the
actual piece is physically pulled, take **two distinct photos** (whole
piece and identifying label; missing label requires alternate image
and explanation) and submit **exactly once**. Confirm the resulting
App 15 Entry ID, `master_record_id=8160`, `inventory_status=Out`,
`inventory_verified=No`, `warehouse_disposition=Active`,
two photos, owner recipient/default and exactly one notification.
Also check the Master `movement_history` relation, **no automatic
changes to Master record #8160**, and a Pending OUT indicator in
staging. Verify another staged record has **no Confirm OUT button**.
Owner later reconciles to Master and sets Inventory Verified = Yes.

**Failure/rollback:** If a submit attempt has an ambiguous result,
**do not retry blindly**: locate the movement by unique
`warehouse_request_id` as the owner first. To immediately disable the
pilot, remove the optional OUT addon/configuration (or set
`pilotSubmitEnabled=false`) and refresh Kintone. Do **not** remove
or alter the working Staging or Visual Search scripts. Existing App 15
entries and their photo history must not be deleted as part of code
rollback. Before any live submission, agree on an owner-only Void
with written reason or other auditable correction path for a
transaction that was recorded incorrectly.

**No live Kintone installation and no Kintone data writes have been made by
these GitHub changes.** The three optional preview assets exist in the `main` publishing branch after explicit owner approval. Draft PR #15 remains unmerged; live submission is not authorized.

## Remaining blockers before installing or merging

1. **Restricted-login GET checks PASSED:** Confirmed App 15 protected defaults/uniqueness and material/finish choices, and App 6 Master + App 15 pending read access; Color/Rack lookup source unique keys passed. **Still required:** verify the *actual* mobile Add Record API write and resulting data/notifications under ZMP, plus test that restricted accounts cannot edit owner-only fields or verified records.
2. **Dropdown alignment owner-reported complete:** **Dolomite** added to App 15 Material and **Satin, Velvet, Concrete, Matte** added to Finish; all preexisting choices retained and changes published October 19, 2026. Confirm via live Kintone schema during read-only preflight. The draft still rejects unsupported options rather than substituting.
3. **Confirm protected defaults through a supervised OUT test** on a safe known Master piece: both photos attached to App 15, fields filled as expected, Master Movement History displays the entry, `inventory_verified=No`, `warehouse_disposition=Active`, owner recipient preserved, **one notification**, Master unchanged.
4. **Test record ACLs:** A warehouse login can still create/edit unverified entries but cannot modify verified entries, verify an Entry, void an Entry, or change Peter Notification. Existing manual Entry Sheet work must remain functional.
5. **Owner Void action:** The new owner-only disposition field exists, but a convenient Void-with-reason UI is **not yet built**. Owner can decide on an interim native edit procedure and add an owner-only `warehouse_void_reason` text-area field when designing the audited Void action. Don't delete newly automated movement history.
6. **Phone/reliability tests:** Validate camera input, Missing Label, additional photos, temporary API failures and cross-device duplicate risks. Current pending checks + unique request ID prevent accidental retry but are **not an atomic lock** between two devices.

### Future activation — NOT YET

After real-user acceptance tests and owner sign-off, install the additional addon JS/CSS after the **existing** Warehouse Staging customization on desktop and mobile. The addon is inert unless an administrator supplies its explicit enablement/permissions-validation config. Do not publish privileged API tokens or login credentials in public GitHub or browser code.

Preview assets now present on GitHub Pages source branch `main` (HTTP delivery requires a browser check; not yet installed in Kintone):
- `zm-warehouse-out-pilot-preview-v1.js` (**frozen preview config for #8160/zmproduction**)
- `zm-warehouse-out-v1.js` (addon, scoped to one record and user)
- `zm-warehouse-out-v1.css`
- `tests/warehouse-out-v1.test.js`

**Public GitHub Pages URLs (for browser verification before installation):**

- Preview-only configuration: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-out-pilot-preview-v1.js`
- OUT addon JS: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-out-v1.js`
- OUT addon CSS: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-out-v1.css`

**Proposed Kintone installation order only after URLs serve successfully:** In
Master App 6's JavaScript and CSS Customization, for **both Desktop and
Mobile**, keep all existing entries. Add the preview-only config JS
**after existing Staging JS**, then the OUT addon JS **after that**.
Add the OUT addon CSS **after existing Staging CSS**. Save and **Update
App**. Preview should show an OUT button only on #8160 as
`zmproduction`, with submission disabled; it must not affect other
staff or other inventory pieces. Do not change App 15 customizations.
If anything is wrong, remove only these optional three assets and update
App 6. **Owner has not yet installed them.**

Rollback: remove only the optional addon configuration and its JS/CSS; never remove the working Warehouse Staging or Visual Search scripts.
