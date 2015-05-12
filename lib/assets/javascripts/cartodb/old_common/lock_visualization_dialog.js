
  /**
   *  Dialog to check/set lock attribute in the
   *  visualization model
   *
   *  new cdb.admin.LockVisualizationDialog({
   *    model:  visualization_model,
   *    user:   user_model
   *  })
   *    
   */

  cdb.admin.LockVisualizationDialog = cdb.admin.BaseDialog.extend({

    events: cdb.ui.common.Dialog.extendEvents({
      'click .back':      '_back',
      'click .continue':  '_cancel'
    }),

    default_options: {
      cancelEnabled:          true,
      include_footer:         true,
      cancel_button_classes:  ''
    },

    initialize: function() {
      this.user = this.options.user;

      // Extend options
      _.extend(this.options, {
        // Modal variables
        width:              500,
        clean_on_hide:      true,
        template_name:      'old_common/views/lock_visualization_dialog',
        ok_button_classes:  'button grey',
        modal_class:        "lock_visualization",
        modal_type:         "notification",
        // Render variables
        ownerName:          this.model.permission.owner.get('username'),
        isOwner:            this.model.permission.isOwner(this.user),
        isVisLock:          this.model.get('locked'),
        visName:            this.model.get('name'),
        visType:            !this.model.isVisualization() ? "dataset" : "map",
        belongsOrg:         this.options.user.isInsideOrg(),
        sharedPeople:       this.model.permission.acl.size()
      });

      cdb.admin.BaseDialog.prototype.initialize.apply(this);
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
      var type = !this.model.isVisualization() ? "tables" : "visualizations";
      window.location.href = cdb.config.prefixUrl() + '/dashboard/' + type;
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