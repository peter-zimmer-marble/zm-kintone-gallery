# ZM Warehouse Maps — Kintone Custom Views

This repository hosts **public frontend JavaScript and CSS only** for three read-only warehouse map views inside ZM's `ZM Warehouse Map - TEST` Kintone app. Authenticated inventory records stay in Inventory App 6, with optional rack metadata from Rack App 7. Do not commit inventory exports, customer data, credentials, API tokens, or the offline demo.

## Existing GitHub Pages URLs (do not change in Kintone)

- JavaScript: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

The filenames still say `v0.5` to preserve the **already installed Kintone links**; their shared implementation supports all three views (Gallery C added in code v0.7). GitHub Pages deploys the `main` branch automatically. Refresh an open Kintone browser tab after each update; browser and CDN caching may require a hard refresh or a short wait.

## One-time setup for Gallery C

In the existing **ZM Warehouse Map - TEST** app:

1. Open **App Settings → Views → Add View (+)**.
2. Name it **exactly** `Gallery C`.
3. Select **Custom view** and **Both desktop and mobile-optimized views**.
4. Paste the same HTML container as the other maps:

   ```html
   <div id="zm-warehouse-map-root"></div>
   ```

5. Leave **Enable pagination** unchecked. Leave Kintone View filtering set to **All records**.
6. Save, then click **Update App**. Choose `Gallery C` from the app view dropdown.

**Do not add more JavaScript or CSS links.** The existing URLs automatically detect `Gallery C`, `Temporary Outside`, and `Gallery A` (plus legacy `Inside Slab Gallery`). GitHub cannot create or rename native Kintone views, so this is a one-time administrative step.

## Maps and conventions

| Kintone view | Locations | Orientation and notes |
| --- | --- | --- |
| `Gallery A` | 27 usable faces in Z/G racks, plus Z-11B reference-only | Indoor Main Showroom, matches its PDF drawing; north points left |
| `Temporary Outside` | `TO-1A/B` through `TO-6A/B` (12 usable faces) | **TO-1 nearest ROAD; TO-6 nearest BUILDING**; A north/left, B south/right |
| `Gallery C` | 26 faces `OS-1A/B` through `OS-13A/B`, plus `OS-DBL`, `OS-DAR`, `OT103-L`, `OT103-R` — **30 usable faces** | Outside storage **By Trucks**. Layout traced from the supplied Gallery C PDF; road top, building bottom, north left. All 15 A/B separators are consistent gray bars |

### Gallery C provisional restrictions

Six rack faces are **usable but provisionally limited-access** and **not suitable for full slabs**:

- `OS-DBL`, `OS-DAR`
- `OT103-L`, `OT103-R`
- `OS-7A`, `OS-10A`

These are an initial operational guess, **not verified restrictions or software-enforced blocks**. The map marks them with a subtle amber warning, explains the restriction in the rack-detail panel, and continues showing any inventory assigned to them. Confirm actual access and suitability before relying on the warnings for physical storage decisions.

Gallery C accepts common hyphenless rack variants (for example `OSDBL`, `OSDAR`, `OT103L`, `OS7A`) as aliases of the corresponding labeled rack faces when reading existing Kintone records. Number-only `OS-1` through `OS-13` assignments appear under **Unconfirmed OS assignments**, not arbitrarily on the A or B face.

## Features shared across all three maps

Live inventory counts; two most common distinct `color_combined` materials with counts and `+N more`; per-rack search and filters (availability, slab/remnant); read-only inspector with sold-to / job information, piece dimensions, image thumbnails where available and direct Kintone Inventory App 6 record links; map zoom and mobile scrolling. No Kintone data writes are performed.

## Updating safely

Test updates against the offline fixture, commit to the existing JavaScript/CSS paths on `main`, and wait for GitHub Pages to deploy. Existing Kintone links pick up new files after refresh. **Changes to the shared files affect all three map views**, so run the regression tests and keep the app scoped to administrators while testing. To roll back, revert the GitHub commit. Keep write access restricted and use MFA; Kintone executes GitHub-hosted JavaScript within authenticated sessions.

## Verification status

Gallery C was browser-tested offline with **fictional sample inventory**, verifying all 30 selectable faces, 15 gray separators, six provisional warnings, Kintone code aliases, search and filters, sold-to / job information, record links, and mobile horizontal navigation; Gallery A and Temporary Outside regression checks passed. **Gallery C has not yet been tested with the company's live OS rack records inside Kintone.** Verify live counts, code spellings and links after creating the new view.

Do not publish the preview HTML or the supplied drawing without review; the public repository contains the actual live **code**, not the private Kintone inventory or an offline customer-data snapshot.