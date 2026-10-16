# ZM Kintone Gallery A — hosted customizations

This public repository contains the **read-only client-side code** for ZM's Inside Slab Gallery Kintone Custom View. It does not contain live inventory, customer/job data, Kintone API tokens, account credentials, or offline inventory previews.

## Active test release: v0.5

Hosted after enabling **Settings → Pages → Deploy from a branch → main / (root)**:

- JavaScript: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.js`
- CSS: `https://petercampau-gif.github.io/zm-kintone-gallery/gallery-a-v0.5.css`

**These links will not work until GitHub Pages has published.**

### Kintone test-app setup

Inside `ZM Warehouse Map - TEST` go to `App Settings → JavaScript and CSS customization` and select **Affect only app administrators** during testing. Use **Add link** under JavaScript files for PC to add the JavaScript URL, and under CSS files for PC to add the CSS URL. For Kintone mobile, add the same links under the mobile JavaScript and CSS sections. Save, then click **Update App**.

The app also needs a Custom View named exactly `Inside Slab Gallery` with this HTML:

```html
<div id="zm-warehouse-map-root"></div>
```

Use the **Custom view** mode with pagination off. Users must have Kintone read permissions for Inventory App 6 and Rack App 7.

### Releasing updates safely

Publish future files with **new, versioned filenames** (e.g. `gallery-a-v0.6.js` and `gallery-a-v0.6.css`) so an untested change cannot silently replace the code in an existing Kintone app. Test the new file URLs in the test app first. To promote, change the two links in the Kintone production app, **Update App**, and verify. For rollback, restore the previous links. Preserve old release files until they are no longer referenced.

This code makes read-only requests to Kintone and runs under the permissions of whoever is logged in. Since Kintone executes this external JavaScript within an authenticated session, protect GitHub access with MFA, restrict repository write access, and only approve reviewed code changes.

## Important

Do **not** upload the original `warehouse-map-preview.html`, inventory CSV, API keys, or other customer information to this public repository. That offline preview embeds inventory records and is not appropriate for public hosting.

The map has been tested offline with a snapshot but has **not yet been validated inside the live Kintone account**. Validate rack counts, Job/Sold To labels, record links, and photo permissions against App 6 in the test app before rolling out more broadly.