# ZM Kintone Gallery A — hosted customizations

This public repository contains the **read-only client-side code** for ZM's Inside Slab Gallery Kintone Custom View. It does not contain live inventory, customer/job data, Kintone API tokens, account credentials, or offline inventory previews.

## Active Kintone test URLs (stable links)

Hosted after enabling **Settings → Pages → Deploy from a branch → main / (root)**:

- JavaScript: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

GitHub Pages is the delivery mechanism for the Kintone Custom View. The filenames retain `v0.5` for compatibility with the existing Kintone links; the CSS was refined in place on 2026-10-15 to improve rack text, color preview counts, and the detail inspector.

### Kintone test-app setup

Inside `ZM Warehouse Map - TEST` go to `App Settings → JavaScript and CSS customization` and select **Affect only app administrators** during testing. Use **Add link** under JavaScript files for PC to add the JavaScript URL, and under CSS files for PC to add the CSS URL. For Kintone mobile, add the same links under the mobile JavaScript and CSS sections. Save, then click **Update App**.

The app also needs a Custom View named exactly `Inside Slab Gallery` with this HTML:

```html
<div id="zm-warehouse-map-root"></div>
```

Use the **Custom view** mode with pagination off. Users must have Kintone read permissions for Inventory App 6 and Rack App 7.

### Releasing updates without changing Kintone links

The existing test app uses these fixed JavaScript/CSS URLs. ChatGPT can prepare, offline-test, and commit changes **to the same paths**. When the main branch changes, GitHub Pages redeploys automatically; users then refresh Kintone to load the new code. There is no need to re-upload the customization files or click Update App for changes at the same URLs. Updates to an already-open browser tab are not pushed into that tab automatically, and GitHub Pages/browser caching may temporarily serve an older version. A hard refresh (Ctrl+Shift+R) or waiting for caches to expire should resolve this.

Because the shared URL updates everyone who uses it, review changes and test the new code **before** committing. Keep App administrators only during development. For a future wider employee rollout, consider a separate staging app and pinned production release URLs to avoid deploying untested code to all employees. Git history provides rollback: revert a commit to restore the previous working code.

This code makes read-only requests to Kintone and runs under the permissions of whoever is logged in. Since Kintone executes this external JavaScript within an authenticated session, protect GitHub access with MFA, restrict repository write access, and only approve reviewed code changes.

## Important

Do **not** upload the original `warehouse-map-preview.html`, inventory CSV, API keys, or other customer information to this public repository. That offline preview embeds inventory records and is not appropriate for public hosting.

The user confirmed that the map loads **live Kintone inventory** inside `ZM Warehouse Map - TEST` (October 15 screenshot). The frontend formatting and interactive flows were also tested offline. Before rolling out to all employees, verify representative rack counts, Sold To / Job values, record links, and photo permissions against Inventory App 6.