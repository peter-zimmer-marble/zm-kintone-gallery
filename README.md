# ZM Warehouse Maps — Kintone Custom Views

This repository hosts **public frontend JavaScript and CSS only** for four read-only warehouse map views inside ZM's `ZM Warehouse Map - TEST` Kintone app. Authenticated inventory records stay in Inventory App 6, with optional rack metadata from Rack App 7. Do not commit inventory exports, customer data, credentials, API tokens, or the offline demo.

## Current GitHub Pages URLs (after work-account username change)

- JavaScript: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://peter-zimmer-marble.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

**One-time migration after the GitHub username change (2026-10-16):** The old `petercampau-gif.github.io` hostname must be replaced with `peter-zimmer-marble.github.io` in Kintone's JavaScript/CSS customization settings for the Warehouse Map test app. Update the existing JavaScript and CSS links (do not add duplicates), click **Save**, then **Update App**, and confirm Gallery A, Temporary Outside, Gallery C, and Gallery B all render. Repository URL redirects do not guarantee GitHub Pages host redirects. After the migration, normal future file updates need only a page refresh.\n\nThe filenames still say `v0.5` to preserve the Kintone file path settings; their shared implementation supports all four views (all four views updated to the shared map design in code v0.9). GitHub Pages deploys the `main` branch automatically. Refresh an open Kintone browser tab after each update; browser and CDN caching may require a hard refresh or a short wait.

## One-time Kintone setup for Gallery C and Gallery B

In the existing **ZM Warehouse Map - TEST** app, for each new view you have not yet created:

1. Open **App Settings → Views → Add View (+)**.
2. Name it **exactly** `Gallery C` or `Gallery B` (one view per name).
3. Select **Custom view** and **Both desktop and mobile-optimized views**.
4. Paste the same HTML container as the other maps:

   ```html
   <div id="zm-warehouse-map-root"></div>
   ```

5. Leave **Enable pagination** unchecked. Leave Kintone View filtering set to **All records**.
6. Save, then click **Update App**. Choose `Gallery C` or `Gallery B` from the app view dropdown.

**Do not add more JavaScript or CSS links.** The existing URLs automatically detect `Gallery B`, `Gallery C`, `Temporary Outside`, and `Gallery A` (plus legacy `Inside Slab Gallery`). GitHub cannot create or rename native Kintone views, so this is a one-time administrative step.

## Maps and conventions

| Kintone view | Locations | Orientation and notes |
| --- | --- | --- |
| `Gallery A` | 27 usable faces in Z/G racks, plus Z-11B reference-only | Indoor Main Showroom, matches its PDF drawing; north points left |
| `Temporary Outside` | `TO-1A/B` through `TO-6A/B` (12 usable faces) | **TO-1 nearest ROAD; TO-6 nearest BUILDING**; A north/left, B south/right |
| `Gallery C` | 26 faces `OS-1A/B` through `OS-13A/B`, plus `OS-DBL`, `OS-DAR`, `OT103-L`, `OT103-R` — **30 usable faces** | Outside storage **By Trucks**. Layout traced from the supplied Gallery C PDF; road top, building bottom, north left. All 15 A/B separators are consistent gray bars |
| `Gallery B` | `LP-1A/B` through `LP-8A/B` — **16 usable faces across eight A-frames** | Outside storage **Light Pole**, north points left; road-side top row LP-1/3/5/7, building-side bottom row LP-2/4/6/8. Same 8-unit gray A/B dividers; LP-9A/B physically removed |

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

All four views now reuse a single implementation for map furniture and wayfinding:

- **Title and location:** identical page typography and placement above the plan (`Gallery A / Main Showroom`, `Temporary Outside / TO Racks`, `Gallery C / By Trucks`, `Gallery B / Light Pole`).
- **North:** one consistent arrow in the upper-right of the map heading. All supplied diagrams point north to the **left**. Duplicate arrows inside the drawings have been removed.
- **Road and building:** consistent horizontal reference lines with centered ROAD at the top and BUILDING at the bottom for the **three outside** maps. Gallery A is indoors and does not invent road/building boundaries.
- **ZM logo:** exactly one, with matching dimensions, placed at the **lower-left of each map's footer** beneath the legend. It remains visible and unchanged by horizontal panning or zoom and never covers an inventory rack.
- **Map controls/legend:** standardized `RACK MAP` toolbar, zoom controls, rack-face swatch, gray A/B divider marker, selected-rack marker, and map-specific provisional-warning badges. Each map's real rack geometry, zoom behavior, data filters, record links, and accessibility notes remain independent.

The visual framework lives in `gallery-a-v0.5.js` / `gallery-a-v0.5.css` despite the compatibility-preserving filenames. Any future gallery should use `mapControls`, `mapBoundary`, `mapLegend`, and `mapSignature` instead of copying bespoke headers and logos.

## Features shared across all four maps

Live inventory counts; two most common distinct `color_combined` materials with counts and `+N more`; per-rack search and filters (availability, slab/remnant); read-only inspector with sold-to / job information, piece dimensions, image thumbnails where available and direct Kintone Inventory App 6 record links; map zoom and mobile scrolling. No Kintone data writes are performed.

## Updating safely

Test updates against the offline fixture (all four desktop/tablet/mobile views), commit to the existing JavaScript/CSS paths on `main`, and wait for GitHub Pages to deploy. After updating Kintone to the new hostname, its links pick up new file contents after refresh. **Changes to the shared files affect all four map views**, so run the regression tests and keep the app scoped to administrators while testing. To roll back, revert the GitHub commit. Keep write access restricted and use MFA; Kintone executes GitHub-hosted JavaScript within authenticated sessions.

## Verification status

Gallery B was browser-tested offline with **fictional sample inventory**, including 8 rack pairs/16 faces, 8 gray dividers, four temporary tag warnings, the LP-7A physical-location notice, hidden LP-9 physical rack but visible unconfirmed LP-9 record, Kintone rack-code aliases, search and filters, sold-to/job details, record links, and mobile navigation. All three previous map views passed regression tests. **Gallery B has not yet been tested against live LP rack assignments in Kintone.** Verify the specific LP-7A piece and physical labels during the yard audit.

Gallery C was browser-tested offline with **fictional sample inventory**, verifying all 30 selectable faces, 15 gray separators, six provisional warnings, Kintone code aliases, search and filters, sold-to / job information, record links, and mobile horizontal navigation; Gallery A and Temporary Outside regression checks passed. **Gallery C has not yet been tested with the company's live OS rack records inside Kintone.** Verify live counts, code spellings and links after creating the new view.

Do not publish the preview HTML or the supplied drawing without review; the public repository contains the actual live **code**, not the private Kintone inventory or an offline customer-data snapshot.