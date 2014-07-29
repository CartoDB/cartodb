
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
        lock:   _t("Lock this visualization"),
        unlock: _t("Unlock this visualization")
      },
      description: {
        lock:   _t("Locking your <strong><%= name %></strong> visualization will prevent any accidentally change in the future. <br/><br/> \
                  It will not appear in your visualizations dashboard, but it will be visible clicking over the link at the bottom of that section."),
        unlock: _t("Your <strong><%= name %></strong> visualization is locked, that means you need to unlock it before doing anything. Are you sure?")
      },
      cancel:   _t("cancel"),
      ok: {
        lock:   _t("Lock"),
        unlock: _t("Unlock")
      } 
    },

    events: function(){
      return _.extend({},cdb.ui.common.Dialog.prototype.events,{
        'click .back': '_back'
      });
    },

    default_options: {
      cancelEnabled:          true,
      include_footer:         true,
      cancel_button_classes:  ''
    },

    initialize: function() {

      var isLock = this.model.get('locked');

      // Extend options
      _.extend(this.options, {
        title:              this._TEXTS.title[ !isLock ? 'lock' : 'unlock' ],
        description:        _.template(this._TEXTS.description[ !isLock ? 'lock' : 'unlock' ])({ name: this.model.get('name') }),
        width:              500,
        clean_on_hide:      true,
        template_name:      'common/views/lock_visualization_dialog',
        ok_title:           this._TEXTS.ok[ !isLock ? 'lock' : 'unlock' ],
        ok_button_classes:  'button grey',
        cancel_title:       this._TEXTS.cancel,
        modal_class:        "lock_visualization",
        modal_type:         "notification"
      });

      this.constructor.__super__.initialize.apply(this);
    },

    _keydown: function(e) {
      // Check if view mode is in table
      // If so, don't let the user hide this dialog
      // with ESC hotkey
      if (this.options.cancelEnabled !== false) {
        if (e.keyCode === 27) {
          this._cancel();
        }
      }
    },

    _cancel: function(e) {
      this.killEvent(e);
      this.hide();
    },

    _back: function(e) {
      this.killEvent(e);
      window.location.href = cdb.config.prefixUrl() + '/dashboard/visualizations'
    },

    ok: function() {
      var self = this;
      this.model.save({
        locked: !this.model.get('locked')
      }, {
        wait: true,
        success: function() {
          // Wait until change is done
          self.options.onResponse && self.options.onResponse();    
        }
      });
    }

  })