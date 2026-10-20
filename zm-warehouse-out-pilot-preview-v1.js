/*
 * Zimmer Marble — CONFIRM OUT PREVIEW for exactly one piece
 * NOT LIVE: This file is only on draft PR #15 until owner approval.
 * Serve before zm-warehouse-out-v1.js, after the existing staging JS.
 *
 * RECORD: Master Inventory App 6 #8160
 * EMPLOYEE LOGIN CODE: zmproduction (confirmed via Kintone read-only GET)
 * MODE: PREVIEW ONLY — never upload a file or write any inventory record.
 *
 * This is a scoped UI rollout control; Kintone field/record permissions
 * remain the real security boundary. No API tokens or passwords here.
 */
window.ZM_WAREHOUSE_OUT_CONFIG = Object.freeze({
  enabled: true,
  ownerValidatedPermissions: true,
  pilotMasterRecordId: '8160',
  pilotUserCode: 'zmproduction',
  pilotSubmitEnabled: false
});
