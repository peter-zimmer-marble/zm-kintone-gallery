/*
 * Universal Warehouse IN preview: no App 15 writes or photo uploads.
 * Load before zm-warehouse-in-v1.js in App 15 only.
 * To activate live IN later, use a separately approved live config after
 * the mandatory App 15 field and Rack App 7 setup/tests are complete.
 */
window.ZM_WAREHOUSE_IN_CONFIG = Object.freeze({
  enabled: true,
  submissionsEnabled: false
});
