
  /**
   *  Create dialog model needed to track the state and the
   *  upload changes
   *
   *  NAVIGATION
   *
   *  - Popular or other: represent which tabs are visible.
   *
   *  POSSIBLE MODEL STATES
   *
   *  - Idle (normal state)
   *  - Abort (upload aborted)
   *  - Reset (as it sounds)
   *  - Added (files added to the create dialog)
   *  - Selected (file/url/service selected, state before any import state)
   *  - Getting (getting file from wherever it is. It wasn't named as uploading because
   *    importer has already this state cc @kartones).
   *  - Uploading (uploading to S3, importer state)
   *  - Importing (state from importer)
   *  - Unpacking (state from importer)
   *  - Creating (state when a new empty table is being created)
   *  - Complete (When import has finished successfully)
   *  - Error (Nobody knows about this state)
   *
   *  UPLOAD (hash)
   *
   *  - Hash with all upload content. It will be valid if that attribute is true.
   *    Also, pretty important, if an upload has started, item_queue_id will be in
   *    this hash.
   *
   *  ERROR (hash)
   *
   *  - If something went wrong, necessary error data will be here.
   *
   */

  cdb.common.CreateDialog.Model = cdb.core.Model.extend({

    defaults: {
      navigation: 'popular',
      state: 'idle',
      option: 'file', // tab selected basically
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
