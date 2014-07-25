
  /**
   *  Dialog to check/set lock attribute in the
   *  visualization model
   *
   *  new cdb.admin.LockVisualizationDialog({
   *    model: visualization_model
   *  })
   *    
   */

  cdb.admin.LockVisualizationDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title: {
        lock:   _t(""),
        unlock: _t("")
      },
      description: {
        lock:   _t(""),
        unlock: _t("")
      },
      ok: {
        lock:   _t(""),
        unlock: _t("")
      } 
    },

    initialize: function() {

      // Extend options
      _.extend(this.options, {
        title:              this._TEXTS.title,
        description:        this._TEXTS.description,
        width:              300,
        clean_on_hide:      true,
        template_name:      'common/views/lock_visualization_dialog',
        ok_title:           this._TEXTS.ok,
        ok_button_classes:  'button grey',
        modal_class:        "lock_visualization",
        modal_type:         "notification",
      });
      this.constructor.__super__.initialize.apply(this);
    }

  })