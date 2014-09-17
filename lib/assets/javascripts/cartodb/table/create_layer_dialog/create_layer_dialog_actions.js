
  /**
   *  Changes for actions within 'New layer dialog'
   *  extends from 'cdb.common.CreateDialog.Actions'
   *
   */

  cdb.admin.CreateLayerDialog.Actions = cdb.common.CreateDialog.Actions.extend({

    // Valid states for ok button activity
    _VALID_STATES_OK: [
      'idle',
      'reset',
      'abort',
      'added',
      'complete',
      'error'
    ],

  });

  