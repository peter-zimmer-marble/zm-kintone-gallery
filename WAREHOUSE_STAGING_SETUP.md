# Warehouse Staging (read-only pilot) — App 6

This custom view provides a phone-friendly alternative to printing the existing **Staging Sheet**. It is intentionally read-only. It does **not** submit OUT entries, modify inventory, change RTS, alter the original Staging Sheet, or sync approvals yet.

## What it displays

- Inventory App 6 staging records matching the exact current Staging Sheet **filter** (existing list view ID **7535223**).
- Both \`RTS\` and \`View Staging\` statuses, grouped by staging status and job.
- Color Combined, shape/size, rack, sale status, type, photos, and a link to the exact Master record.
- **In/Out Notes** (`in_out_note`) from the **Master Inventory (App 6)** record, displayed in full on each piece with a note. This is distinct from `notes` (Sale Notes) and from any older notes on Entry Sheet App 15. Notes remain read-only and are not copied into App 15 by this pilot.
- Search by job, color, rack, shape, piece type, Master number, or staging status; filter RTS/View Staging.
- A fullscreen image viewer with all attached Exact Picture and Example Picture images.
- **All eligible staging pieces display automatically when the view opens**: no 48-piece cutoff, Show More button, or client-side pagination. Refresh reloads the entire staging list.
- The full list is fetched via read-only paginated authenticated GETs (500 records per Kintone API batch) using an explicit non-financial field allowlist. **500 is an API batch size, not a total display limit.** The entire list is displayed after all batches complete; if a batch fails, an error is shown rather than silently displaying a partial list. Nothing is stored in GitHub or GitHub Pages.
- All thumbnail downloads are queued on opening the view, including cards below the fold. **Four simultaneous downloads is a concurrency limit for photos only; it does not limit the number of cards or images.** The full cards are visible while photos finish downloading.

## Install in ZM Inventory, App 6

1. **App Settings → Views → + Add View**.
2. Name: **Warehouse Staging** (exact spelling). Type: **Custom view**. Scope: **Both desktop and mobile**.
3. Paste this HTML into the Custom View HTML field:

    <div id="zm-warehouse-staging-root"></div>

4. **Disable Kintone pagination** (the view loads all eligible records and displays them in one list). The Custom View filter can remain All Records; the JavaScript itself applies the exact Staging Sheet query. Save this new view without changing the existing Staging Sheet or Visual Search view.
5. Under **App Settings → JavaScript and CSS customization**, **add** the following (do not replace existing Visual Search v2 or other scripts):

   **Desktop JavaScript**
   https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-staging-v1.js

   **Desktop CSS**
   https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-staging-v1.css

   **Mobile JavaScript**
   https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-staging-v1.js

   **Mobile CSS**
   https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-warehouse-staging-v1.css

6. Save customization and **Update App**. Open the new Warehouse Staging view, compare with the existing Staging Sheet, then repeat on a real phone. Refresh if GitHub Pages files were cached.
7. Try with a warehouse-user login that has restricted field permissions. Check that photos work and **no financial fields are accessible** through normal Kintone record views/APIs.

## Pilot checks

- Confirm the count matches the native Staging Sheet with no additional native filter applied. When All is selected and search is blank, the view must say **All N staged pieces displayed**; no staged pieces should be behind pagination.
- Confirm RTS and View Staging both appear; open one of each.
- Confirm existing **In/Out Notes** appear in full, including long notes on narrow phone screens; pieces without a note should not show an empty note panel.
- Search job, rack, color, and Master ID. Confirm searching handles multiple terms.
- Test Exact Picture, fallback to Example Picture, photo navigation, and mobile links.
- Confirm a piece with a blank job and an L shape renders sensibly.
- Confirm existing RTS actions, Staging Sheet, Visual Search v2, Warehouse Maps, App 15 Entry Sheet, and parent-child relationships remain unchanged.
- Kintone permissions must secure financial data: a read-only frontend is not a security boundary.

## Limitations and next phase

- **Read-only pilot:** It does not capture picks/photos or create App 15 movements yet.
- Physically pulled material may still show up while an OUT entry is pending. Verify material physically before picking; do not use this pilot as an authoritative picked/unpicked checklist.
- If a warehouse user's permissions reject optional `length_2` or `width_2` fields, the view retries while retaining In/Out Notes. If Kintone also blocks `in_out_note`, it displays an explicit permission warning while preserving the staging list. Check actual staff permissions before relying on notes for pulling instructions.
- Photos are only loaded from Kintone for the signed-in user using their Kintone session; no photo content is hosted in GitHub.
- The next phase will add explicit **Confirm OUT** and camera upload to a new App 15 entry with \`master_record_id\`, plus a pending-pull indication; approval will update App 6 later. Do not add writes or privileged credentials to public GitHub code.

## Rollback

Remove only the Warehouse Staging v1 JavaScript/CSS URLs from App 6 desktop and mobile customization; Save/Update App. The new view can then be deleted independently. The original Staging Sheet and Visual Search v2 are untouched.
