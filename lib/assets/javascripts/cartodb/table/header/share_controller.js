
  /**
   *  Controller to show correct dialog to finally get share dialog.
   *
   *  - If the visualization is the type table -> Create visualization
   *  - If the visualization derived is private -> Make visualization private
   *  - If the visualization derived is private -> Turn private tables into public
   *  - Show share window
   *
   *  var controller = new cdb.admin.ShareController({
   *    model:  vis_model,
   *    user:   user_model,
   *    config: config_params
   *  });
   */

  cdb.admin.ShareController = cdb.core.View.extend({

    _TEXTS: {
      create_visualization: {
        msg:        _t('If you want to share your map you need to create it first.')
      },
      next_button:  _t('Check datasets')
    },

    // Add to the stack then number of actions we need to do
    initialize: function() {
      this.user = this.options.user;
      this.config = this.options.config;
      this.stack = [];

      this.any_private_table = this.model.related_tables && this.model.related_tables.filter(function(table) {
        return table.get("privacy").toLowerCase() == "private"
      }).length > 0;

      // Generate stack
      this._generateStack();

      // Start
      this._nextStep();
    },

    _generateStack: function() {
      // If the visualization is a table type
      if (!this.model.isVisualization()) {
        this.stack.push({
          class: 'CreateVizDialog',
          step: 'createVisualization',
          opts: {
            model: this.model,
            msg: this._TEXTS.create_visualization.msg
          },
          center: false,
          callback: '_changeToVis'
        });
      }

      // Add share dialog if it is visualization
      if (this.model.isVisualization()) {
        this.stack.push({
          class: 'ShareDialog',
          step: 'showShareDialog',
          opts: {
            vis:    this.model,
            user:   this.user,
            config: this.config
          },
          center: true
        });
      }
    },

    _createDialog: function() {
      var self = this;
      var step = self.stack.shift();

      var dlg = new cdb.admin[step.class](step.opts);

      dlg.cancel = function() { self._clean() }
      dlg.ok = function(r) {
        step.callback && self[step.callback](r);
        self._nextStep();
      }

      dlg.appendToBody().open({ center: step.center });
      this.addView(dlg);
    },

    _makeVisPublic: function() {
      this.model.save({
        privacy: 'PUBLIC'
      })
    },

    _changeToVis: function(vis) {
      window.table_router.changeToVis(vis);
    },

    // Do next step until the end
    _nextStep: function() {
      if (this.stack.length > 0) {
        this._createDialog();
      } else {
        this._clean();
      }
    },

    // hack to prevent remove the dialog inmediatelly
    _clean: function() {
      var self = this;
      setTimeout(function() {
        self.clean()
      }, 1000);
    },

    // Clean clean cleaaaaaaaaaaan!
    clean: function() {
      this.stack = [];
      cdb.core.View.prototype.clean.call(this);
    }

  });
