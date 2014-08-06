
  /**
   *  Create dialog model needed
   *  to track the state and the
   *  upload changes
   *
   */

  cdb.common.CreateDialog.Model = cdb.core.Model.extend({

    defaults: {
      state: 'idle',
      option: 'file',
      // upload status
      upload: {
        valid: false,
        progress: 0,
        type: '',
        value: '',
        interval: 0,
        item_queue_id: ''
      }
    }

  });
