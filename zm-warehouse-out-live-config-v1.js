/*
 * Zimmer Marble Warehouse Staging — live OUT test configuration.
 * Enables Confirm OUT for ANY staged Master piece and ANY signed-in user
 * who has appropriate native Kintone permissions.
 *
 * IMPORTANT: This is production Kintone, not a sandbox.
 * It creates real App 15 movement entries and uploads real photos.
 * The addon never writes Master Inventory App 6.
 * When staff return, they also see Confirm OUT; remove this configuration
 * and the optional addon links if staff rollout is not yet intended.
 *
 * Load immediately BEFORE zm-warehouse-out-v1.js.
 */
window.ZM_WAREHOUSE_OUT_CONFIG = Object.freeze({
  enabled: true,
  ownerValidatedPermissions: true,
  mode: 'live',
  submissionsEnabled: true
});
