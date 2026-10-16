# ZM Warehouse Maps — Kintone Custom Views

This public GitHub Pages repository hosts **only the client-side JavaScript and CSS** for two read-only maps inside ZM's existing `ZM Warehouse Map - TEST` Kintone application. Inventory stays in the authenticated Kintone Inventory app (App 6); rack metadata is optionally read from Rack app (App 7). No private inventory snapshot, customer data, API token, or account credential is stored here.

## Active Kintone customization URLs

These original v0.5-named URLs are **stable links** already entered in Kintone; the files now support **both** maps. Keep these filenames in place for automatic updates.

- JavaScript: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

GitHub Pages uses `main` / `(root)`. Deployments happen automatically after commits. Kintone usually needs only a browser refresh, sometimes a hard refresh or a short wait for cache expiration.

## One-time Kintone setup (app administrator)

In `ZM Warehouse Map - TEST`:

1. Go to **App Settings → Views**.
2. Edit the existing Custom View **Inside Slab Gallery**. Change **Name** to exactly `Gallery A`. **Leave its HTML unchanged**:

   ```html
   <div id="zm-warehouse-map-root"></div>
   ```

3. Add a second **Custom view** named exactly `Temporary Outside`. Set **Use this view in: Both desktop and mobile-optimized views**, paste the **same HTML div** above, and leave **Enable pagination** OFF. Leave the view filter as **All records**.
4. Click **Save** for each view and **Update App** in App Settings. No second Kintone app, JavaScript/CSS upload, or customization link is needed.
5. Open each view via the Kintone view dropdown and verify counts and record links. The JavaScript also recognizes the old `Inside Slab Gallery` name as a temporary alias until its Kintone view has been renamed.

**Important:** GitHub cannot rename or create native Kintone views. The above view-setting changes are the only steps that require an administrator in Kintone. All later JavaScript/CSS edits can be published to the existing links.

## Map definitions

| Custom View | Rack faces | Layout |
| --- | --- | --- |
| `Gallery A` | Z-1A through Z-11, G-54/56/58/62/64, 27 confirmed usable sides, plus Z-11B reference face | Preserves the existing indoor gallery map, rack positions, gray dividers, filters and inspector |
| `Temporary Outside` | `TO-1A/B` through `TO-6A/B` (12 usable faces) | Six A-frame pairs from TO-6 nearest ROAD to TO-1 nearest BUILDING; north points LEFT, A left, B right |

Unsided TO codes `TO-1` through `TO-6`, if any, appear under **Unconfirmed TO assignments** rather than being assigned arbitrarily to an A/B side. The TO codes are based on the owner's reported identifiers and should be validated against live inventory after creating the view.

Both views share the color_combined summaries, search, Avl/Hold/SOLD filters, slab/remnant filters, customer/job allocation details, photo preview, live rack counts, and record links into Inventory App 6. Both views remain **read-only**.

## Releasing code updates

Commit edits to these same two files on `main` after testing; GitHub Pages automatically redeploys. This updates all Kintone views that reference the links. A currently open Kintone tab must be refreshed to load the new code. Keep this repository access restricted to trusted editors and protect it with MFA. Code executes in an authenticated Kintone session, so changes should be reviewed before publishing.

For rollback, revert the relevant GitHub commit to restore the previous source. The previous version is preserved in Git history.

## Tests and caveats

The Gallery A and Temporary Outside UIs were browser-tested with simulated sample records (desktop/mobile, rack selection, filters, view switching, sold-to/job display, record links, zoom, rack ordering and divider widths). The user's earlier Gallery A live screenshot confirmed the shared source loads inventory in Kintone. The **new Temporary Outside view has not yet been tested against live TO inventory** until the one-time Kintone view is added.

The public GitHub Pages landing page is **not** a public inventory catalog. Do not publish offline previews that embed real inventory/customer records, CSVs, Kintone tokens or other private material.