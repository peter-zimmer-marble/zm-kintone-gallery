# ZM Warehouse Maps & Visual Search — Kintone Custom Views

This repository hosts **public frontend JavaScript and CSS only** for five read-only maps in ZM Warehouse Map - TEST, plus standalone Visual Search assets for the main ZM Inventory app (App 6). The original Visual Search remains in the warehouse test bundle during migration. Authenticated inventory records stay in Inventory App 6, with optional rack metadata from Rack App 7. Do not commit inventory exports, customer data, credentials, API tokens, or the offline demo.

## Current GitHub Pages URLs (after work-account username change)

- JavaScript: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

**One-time migration after the GitHub username change (2026-10-16):** The old `petercampau-gif.github.io` hostname must be replaced with `peter-zimmer-marble.github.io` in Kintone's JavaScript/CSS customization settings for the Warehouse Map test app. Update the existing JavaScript and CSS links (do not add duplicates), click **Save**, then **Update App**, and confirm Gallery A, Temporary Outside, Gallery C, Gallery B, Gallery D, and Visual Search all render. Repository URL redirects do not guarantee GitHub Pages host redirects. After the migration, normal future file updates need only a page refresh.\n\nThe filenames still say `v0.5` to preserve the Kintone file path settings; their shared implementation supports all five views (all five views updated to the shared map design in code v1.0). GitHub Pages deploys the `main` branch automatically. Refresh an open Kintone browser tab after each update; browser and CDN caching may require a hard refresh or a short wait.

## Move Visual Search to ZM Inventory (App 6)

**Updated:** Visual Search v2 supersedes the original v1 assets below. For an already-installed app use the v2 replacement steps in the next section; do not install both versions.


**Status:** New standalone files are ready for installation. The main Kintone app is NOT yet changed. Retain the working Visual Search view in Warehouse Map - TEST until the new location is live and verified.

**Install these dedicated assets into ZM Inventory only (not the shared gallery files):**

- JavaScript: https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-visual-search-v1.js
- CSS: https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-visual-search-v1.css

1. Open **ZM Inventory (App 6) → App Settings → Views → Add View (+)**.
2. Name the new view **Visual Search** (exact spelling). Select **Custom view** and **Both desktop and mobile-optimized views**.
3. Enter this HTML:

   ~~~html
   <div id="zm-visual-search-root"></div>
   ~~~

4. Leave pagination disabled and the view's filter as All records. Save the view.
5. Go to **App Settings → JavaScript and CSS customization** within **ZM Inventory**. Add the standalone JavaScript URL to PC JavaScript and the standalone CSS URL to PC CSS; repeat for Mobile JavaScript/Mobile CSS if mobile is required. **Keep ALL existing customization entries and their order**, and do not change the app's customization scope. Switching the entire app to administrator-only would disable any existing customizations for other users.
6. Save and **Update App**. Open Visual Search in the real inventory app and confirm photos, sizes, filters and record links. Switch to normal inventory views to verify that their existing functionality remains unchanged.
7. After live verification on the intended devices, remove the old Visual Search native view from **Warehouse Map - TEST** and, in a separate reviewed code change, remove its legacy bundled implementation without affecting Galleries A–D or Temporary Outside.

**Rollback:** Remove the two new links from ZM Inventory, Save/Update App, then remove the new Visual Search view if needed. The warehouse-map implementation has been intentionally left intact for fallback.

**Safety:** The new script runs only on the view named Visual Search with its own unique HTML root, reads Inventory App 6 through authenticated GET requests, and never writes records. CSS is scoped entirely within its own root. The server hosts code only, not inventory data or photo exports.

**Verification:** Simulated Kintone event, record, filter, display, pagination and navigation tests passed; actual Kintone App 6 photos and interactions still require live verification.

## Visual Search v2 — photo click fix and cache-busting deployment

The standalone Inventory App 6 Visual Search has **v2 asset paths**. To avoid
stale v1 JavaScript/CSS caches and ensure that the updated event handling is
actually used in Kintone, an administrator must **replace** the previous
v1 URLs in **ZM Inventory → App Settings → JavaScript and CSS customization**.
Do **not** leave both v1 and v2 installed: duplicate scripts will register
conflicting view handlers.

- PC JavaScript: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-visual-search-v2.js`
- PC CSS: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/zm-visual-search-v2.css`
- If Visual Search is used on mobile, also replace the v1 URLs with the matching v2 URLs in **Mobile JavaScript/CSS**.

Preserve all other Inventory App customizations and their order; keep the
existing `<div id="zm-visual-search-root"></div>` Custom View HTML. Save
and **Update App**, then refresh the view. Confirm that photo cards display
**Enlarge photo** (or `N photos · Enlarge`) and clicking the image opens
the viewer; clicking the text below it opens the record. The **color name and dimensions at the top of the popup** also link to the record. The small
`data-visual-version="2.0"` marker on the view root is available for
troubleshooting.

In v2, photo clicks are caught during DOM event **capture**, and explicitly
call `preventDefault`/`stopPropagation` before Kintone link-navigation
listeners can respond. The image is a separate `button`; the material
details are an `a` linking to Inventory App 6; the popup's top title/metadata is a separate record link.

**V2 verification:** Mock Kintone tests passed for single activation, 13-field
read-only query, photographic click interception, keeping detail links
navigable, opening a three-photo viewer, next-photo controls, filename-based
downloading, and cleanup on other views. Actual Kintone should still be
checked after the URL swap. The original v1 assets remain in GitHub as a
rollback option; **use only one version at a time in Kintone**.

## Visual Search privacy / data-minimization audit

The production Inventory App 6 standalone script (`zm-visual-search-v2.js`) uses a
**13-field baseline response allowlist** in its Kintone Get Records request:

`$id`, `color`, `color_combined`, `zmv_num`, `type`, `length`, `width`,
`shape`, `rack`, `sale_status`, `exact_picture`, `example_picture`, `job`.

The `inventory_status` field is referenced **only in the server-side Kintone
query** to select inventory marked `In`; its values are not requested in the
response. **Job** is intentionally requested and displayed only for records
with a nonblank Job value, but is not included in the text-search terms.
Pricing, material costs, margins, suppliers, notes, and unrelated fields are
**not requested** or searchable. ZM Inventory's field settings confirm the
extra measurements as **Length 2 (for L shapes)** / `length_2` and
**Width 2 (for L shapes)** / `width_2`. The view explicitly requests
only those two additional fields (15 fields total) alongside the 13-field
baseline; it no longer guesses field names from the form schema. If Kintone
rejects those optional fields due to access restrictions, the view retries
using only the baseline 13 fields, preserving the rest of Visual Search.
The view clears cached inventory when leaving.

**This is data minimization, not an independent access-control boundary.**
The card details and popup heading link to the full Inventory App 6 record, and Kintone field,
record, and app permissions determine what each signed-in user can see there or
through Kintone's own API. Verify restricted pricing fields in **ZM Inventory →
App Settings → Permissions for Fields**, and appropriate App/Record permissions.
Those permissions apply across the Kintone app, not only this custom view.
If staff need differentiated access, use Kintone groups/field permissions. Do
not rely on hiding prices in this frontend to restrict a viewer with Kintone
record access. Job names, file images, and free-text material/color names may themselves
contain confidential information and need a content review. Test with a
realistic restricted-role Kintone user, not only an administrator.

The original Visual Search in the Warehouse Map - TEST bundle is still a
separate legacy implementation; remove the old test view after confirming the
main Inventory app's standalone version is working. Warehouse map inspectors
remain unchanged and have their own field allowances.

## Legacy warehouse-map setup (Galleries C, B, D; test Visual Search during cutover)

In the existing **ZM Warehouse Map - TEST** app, for each new view you have not yet created:

1. Open **App Settings → Views → Add View (+)**.
2. Name it **exactly** `Gallery C`, `Gallery B`, `Gallery D`, or `Visual Search` (one view per name).
3. Select **Custom view** and **Both desktop and mobile-optimized views**.
4. Paste the same HTML container as the other maps:

   ```html
   <div id="zm-warehouse-map-root"></div>
   ```

5. Leave **Enable pagination** unchecked. Leave Kintone View filtering set to **All records**.
6. Save, then click **Update App**. Choose the new view from the app view dropdown.

**Do not add more JavaScript or CSS links.** The existing URLs automatically detect `Visual Search`, `Gallery D`, `Gallery B`, `Gallery C`, `Temporary Outside`, and `Gallery A` (plus legacy `Inside Slab Gallery`). GitHub cannot create or rename native Kintone views, so this is a one-time administrative step.

## Maps and conventions

| Kintone view | Locations | Orientation and notes |
| --- | --- | --- |
| `Gallery A` | 27 usable faces in Z/G racks, plus Z-11B reference-only | Indoor Main Showroom, matches its PDF drawing; north points left |
| `Temporary Outside` | `TO-1A/B` through `TO-6A/B` (12 usable faces) | **TO-1 nearest ROAD; TO-6 nearest BUILDING**; A north/left, B south/right |
| `Gallery C` | 26 faces `OS-1A/B` through `OS-13A/B`, plus `OS-DBL`, `OS-DAR`, `OT103-L`, `OT103-R` — **30 usable faces** | Outside storage **By Trucks**. Layout traced from the supplied Gallery C PDF; road top, building bottom, north left. All 15 A/B separators are consistent gray bars |
| `Gallery D` | `Robot-3A/B`, `Robot-2A/B` — **4 usable faces** | Outside Robot Room; road top, building bottom, **north down**, Robot-3 left of Robot-2; all faces usable |
| `Gallery B` | `LP-1A/B` through `LP-8A/B` — **16 usable faces across eight A-frames** | Outside storage **Light Pole**, north points left; road-side top row LP-1/3/5/7, building-side bottom row LP-2/4/6/8. Same 8-unit gray A/B dividers; LP-9A/B physically removed |

### Gallery D (Outside Robot Room)

Gallery D includes two double-sided racks shown left-to-right as `Robot-3A/B`, then `Robot-2A/B`. All four faces are usable, with A left and B right within each rack. ROAD appears above and BUILDING below; unlike the other galleries, **north points down**. Unsided `Robot-3` and `Robot-2` records stay visible under unconfirmed assignments. Uppercase and hyphenless codes (such as `ROBOT3A` and `ROBOT-2B`) are matched to their proper displayed face without moving inventory.

After publishing, create the Kintone Custom View named exactly **Gallery D** (if not already present). Paste `<div id="zm-warehouse-map-root"></div>`, disable pagination, leave filters on All records, and **Update App**. Keep the same existing GitHub Pages JS/CSS links—do not add duplicates. Live records and browser layout have not yet been verified in Kintone.

### Gallery C provisional restrictions

Six rack faces are **usable but provisionally limited-access** and **not suitable for full slabs**:

- `OS-DBL`, `OS-DAR`
- `OT103-L`, `OT103-R`
- `OS-7A`, `OS-10A`

These are an initial operational guess, **not verified restrictions or software-enforced blocks**. The map marks them with a subtle amber warning, explains the restriction in the rack-detail panel, and continues showing any inventory assigned to them. Confirm actual access and suitability before relying on the warnings for physical storage decisions.

Gallery C accepts common hyphenless rack variants (for example `OSDBL`, `OSDAR`, `OT103L`, `OS7A`) as aliases of the corresponding labeled rack faces when reading existing Kintone records. Number-only `OS-1` through `OS-13` assignments appear under **Unconfirmed OS assignments**, not arbitrarily on the A or B face.

## Gallery B temporary physical tags and inventory audit

The Gallery B map shows **correct Kintone locations** rather than the old names still printed on the physical A-frames in the yard:

- LP-5A/B is physically labeled **LP-7A/B** (the former LP-7 rack was moved to LP-5's location).
- LP-7A/B is physically labeled **LP-9A/B** (the former LP-9 rack was moved to LP-7's location).
- There is **no LP-9 A-frame** on the physical map. Any inventory that later appears assigned to LP-9A/B, including hyphenless variants or unsided LP code values, stays visible under **Unconfirmed LP assignments**; it is not silently reclassified or moved.
- The user reports one Kintone piece at **LP-7A**, but does not know if it is physically at the intended LP-7 location. **All LP-7A assignments are visibly flagged as location unverified** in the map and detail panel until the yard audit is complete. No automatic material location changes occur.

The four LP-5A/B and LP-7A/B faces have clearly labeled temporary physical-tag warnings. Once the yard has been relabeled and LP-7A verified, remove these warnings in the shared code (rather than keeping an outdated permanent alert). Gallery B code also handles simple hyphen-free variants, e.g. `LP7A`, as aliases of the correct map face.

## Shared visual standard (v0.9)

All five views now reuse a single implementation for map furniture and wayfinding:

- **Title and location:** identical page typography and placement above the plan (`Gallery A / Main Showroom`, `Temporary Outside / TO Racks`, `Gallery C / By Trucks`, `Gallery B / Light Pole`).
- **North:** one consistent arrow in the upper-right of the map heading. Gallery A, B, C, and Temporary Outside point north **left**; Gallery D points north **down**. Duplicate arrows inside the drawings have been removed.
- **Road and building:** consistent horizontal reference lines with centered ROAD at the top and BUILDING at the bottom for the **four outside** maps. Gallery A is indoors and does not invent road/building boundaries.
- **ZM logo:** exactly one, with matching dimensions, placed at the **lower-left of each map's footer** beneath the legend. It remains visible and unchanged by horizontal panning or zoom and never covers an inventory rack.
- **Map controls/legend:** standardized `RACK MAP` toolbar, zoom controls, rack-face swatch, gray A/B divider marker, selected-rack marker, and map-specific provisional-warning badges. Each map's real rack geometry, zoom behavior, data filters, record links, and accessibility notes remain independent.

The visual framework lives in `gallery-a-v0.5.js` / `gallery-a-v0.5.css` despite the compatibility-preserving filenames. Any future gallery should use `mapControls`, `mapBoundary`, `mapLegend`, and `mapSignature` instead of copying bespoke headers and logos.

## Visual Search (image-first inventory, read only)

The **Visual Search** Custom View browses authenticated inventory. The version in Warehouse Map - TEST temporarily uses its existing gallery HTML root. The **new** ZM Inventory version uses the distinct HTML container and two standalone assets listed in the migration section above.

- One **card per physical inventory record**, sorted by material/color name (not grouped by color).
- **Photo first**, then a moderately larger, **bold color name** beneath it, followed by **length × width in inches**. **L-shaped pieces** display all available dimensions on a single line as `Main Length × Main Width × Length 2 × Width 2 in · LHL` (or `RHL`) beneath the color. The popup header uses this same one-line notation; no separate L-shape badge or C/D lines. Rectangles retain the normal `Length × Width in` display, and other nonrectangular shapes retain their own shape badge. On narrow cards, the L-shape dimension line can scroll horizontally to prevent wrapping. If additional values are unavailable, never fabricate measurements. An optional **Job** section appears only for assigned records; piece type, rack and record number also appear.
- **Click the card's photograph** to open a full-size photo viewer. **Click the card's material details** or **the material name/dimensions at the top of the popup** to open the associated Kintone Inventory App **6** record in a new tab. Photo click remains a separate button and never navigates to the record.
- The photo viewer browses **all image attachments** in `exact_picture` first, then `example_picture`, keeping their original order and removing duplicate file keys. Use previous/next arrows, selectable thumbnails, left/right keyboard arrows, or swipe on touchscreens. Escape, the close button, or the backdrop closes the viewer. Exact photos and example photos are distinctly labeled; the card preview tries other images if its primary image cannot load. Missing photos display a placeholder (no fabricated imagery).
- **Download photo** saves the selected full-resolution, authenticated Kintone image to the user's device with a sanitized filename in the form `Color Combined - Length x Width in - Record 123.jpg`. **Never append a photo number**, even when a record has multiple pictures. Note that a browser may add its own `(1)` suffix to avoid replacing a previously downloaded file. The image format determines the extension (JPG/PNG/WebP/etc.). Shape, extra dimensions, Job/customer details, pricing, and other confidential fields are **not included in the filename**. Downloads reuse an already authenticated in-browser image blob and do not expose public file URLs.
- Filters include color/name/record/rack text search, slab versus remnant, availability (available/hold/sold), minimum dimensions and **Photos only**. Reset clears all filters.
- Only records with `inventory_status = "In"` are loaded; this **can include Sold and Hold records** that remain physically on site. This is an inventory tool, not a customer-facing catalog.
- First **32** matching pieces are shown, with **Show more pieces** for additional cards. Photo requests are lazy and limited to four concurrent downloads. Pictures are fetched using the signed-in Kintone session; no inventory or image copies are committed to public GitHub.
- Page-by-record-ID API reads allow more than 10,000 inventory records without the query offset limitation. **No Kintone record writes** are performed.
- Material *category* (Granite/Quartz/Marble/etc.) was not added, because no confirmed material-category field exists in the current map's Inventory App 6 field list. Piece type (Slab/Remnant) is available now.

**Nonrectangle dimension fields:** Kintone screenshots confirm the actual codes `length_2` and `width_2` (labeled "Length 2 (for L shapes)" and "Width 2 (for L shapes)"). Visual Search fetches just these two optional fields. For Left Hand L (`LHL`) and Right Hand L (`RHL`) pieces, dimensions are condensed into one line: `length × width × length_2 × width_2 in · LHL/RHL` with abbreviated shape at the end. When only one extra field is present, the unavailable position is marked with an em dash. If neither is available, the card shows primary dimensions and the LHL/RHL suffix. Non-L shapes retain their existing labeling; download filenames never include the additional dimensions. Rectangle cards do not display these fields. The values are deliberately labeled with their Kintone field names; no unverified assumption is made that one corresponds to geometric C or D. Confirm against an actual L-shaped record after deployment. Field access remains governed by Kintone's field permissions.

**Verification:** The standalone Visual Search passed simulated Kintone API and interaction checks for image ordering and deduplication, failed-photo fallback, secure blob rendering, modal navigation, thumbnails, keyboard arrows, mobile swipe, close/focus restoration, image download filenames and file extensions, and record-link separation. A specific fixture test confirms `length_2` / `width_2` in the authenticated request (15 narrowly allowed fields), matching L-shaped card and popup dimensions, hiding extras on rectangles, preserving the original filename, and retrying the 13-field baseline when optional fields are forbidden. Actual Kintone behavior should still be verified in the signed-in app (including on mobile). The legacy Warehouse Map - TEST Visual Search remains separate and unchanged.

## Features shared across all five rack maps

Live inventory counts; two most common distinct `color_combined` materials with counts and `+N more`; per-rack search and filters (availability, slab/remnant); read-only inspector with sold-to / job information, piece dimensions, image thumbnails where available and direct Kintone Inventory App 6 record links; map zoom and mobile scrolling. No Kintone data writes are performed.

## Updating safely

Test updates against the offline fixture (all five desktop/tablet/mobile views), commit to the existing JavaScript/CSS paths on `main`, and wait for GitHub Pages to deploy. After updating Kintone to the new hostname, its links pick up new file contents after refresh. **Changes to the shared files affect all five map views**, so run the regression tests and keep the app scoped to administrators while testing. To roll back, revert the GitHub commit. Keep write access restricted and use MFA; Kintone executes GitHub-hosted JavaScript within authenticated sessions.

## Verification status

Gallery B was browser-tested offline with **fictional sample inventory**, including 8 rack pairs/16 faces, 8 gray dividers, four temporary tag warnings, the LP-7A physical-location notice, hidden LP-9 physical rack but visible unconfirmed LP-9 record, Kintone rack-code aliases, search and filters, sold-to/job details, record links, and mobile navigation. All three previous map views passed regression tests. **Gallery B has not yet been tested against live LP rack assignments in Kintone.** Verify the specific LP-7A piece and physical labels during the yard audit.

Gallery C was browser-tested offline with **fictional sample inventory**, verifying all 30 selectable faces, 15 gray separators, six provisional warnings, Kintone code aliases, search and filters, sold-to / job information, record links, and mobile horizontal navigation; Gallery A and Temporary Outside regression checks passed. **Gallery C has not yet been tested with the company's live OS rack records inside Kintone.** Verify live counts, code spellings and links after creating the new view.

Do not publish the preview HTML or the supplied drawing without review; the public repository contains the actual live **code**, not the private Kintone inventory or an offline customer-data snapshot.