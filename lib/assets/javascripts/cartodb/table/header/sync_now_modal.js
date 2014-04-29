
  /**
   *  Sync now modal
   *
   *  - When a synchronization is running, we should
   *    block user interface.
   *  - It doesn't need any parameter.
   *
   *  new cdb.admin.SyncNowModal()
   */

  cdb.admin.SyncNowModal = cdb.admin.BaseDialog.extend({

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: '',
        description: '',
        template_name: 'table/header/views/sync_now_modal',
        clean_on_hide: true,
        modal_class: "sync_now",
        modal_type: "creation",
        width: 275
      });

      // Super!
      this.constructor.__super__.initialize.apply(this);
    },

    _keydown: function() {}


  });