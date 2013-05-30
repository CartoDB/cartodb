
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
        msg:        _t('If you want to share your map you need to create a visualization.')
      },
      next_button:  _t('Check tables')
    },

    // Add to the stack then number of actions we need to do
    initialize: function() {
      this.user = this.options.user;
      this.config = this.options.config;
      this.stack = [];

      // If the visualization is a table type
      if (!this.model.isVisualization()) {
        this.stack.push('createVisualization')
      }

      // Check if the visualization is private
      if (this.model.isVisualization() && this.model.get('privacy') == "PRIVATE") {
        this.stack.push('makeVisualizationPublic')
      }

      // Check if there are private tables
      if (this.model.isVisualization()) {
        
        this.any_private_table = _.filter(this.model.get("related_tables"), function(table) {
          return table.privacy.toLowerCase() == "private"
        }).length > 0;

        if (this.any_private_table) {
          this.stack.push('makeTablesPublic')
        }
      }

      // Add share dialog if it is visualization
      if (this.model.isVisualization()) {
        this.stack.push('shareVisualization')
      }

      // Start
      this._nextStep();
    },

    // Create visualization step
    _createVisualization: function() {
      var self = this;
      var dlg = new cdb.admin.CreateVizDialog({
        model: this.model,
        msg: this._TEXTS.create_visualization.msg,
        onResponse: function(vis) {
          self.stack.shift();
          self._nextStep();
          window.location.href = "/viz/" + vis.get("id") + "/";
        }
      });

      dlg.cancel = function() { self.clean() }

      dlg.appendToBody().open();
    },

    // Make visualization public
    _makeVisualizationPublic: function() {
      var self = this;
      var dlg = new cdb.admin.SharePrivateVisDialog({
        model: this.model,
        next_button: this.any_private_table ? this._TEXTS.next_button : null
      });

      dlg.ok = function() {
        self.stack.shift();
        self._nextStep();
      }

      dlg.cancel = function() { self.clean() }

      dlg.appendToBody().open();
    },

    // Turn private tables into public step
    _makeTablesPublic: function() {
      var self = this;
      var dlg = new cdb.admin.SharePrivateTablesDialog({
        model: this.model
      });

      dlg.ok = function() {
        self.stack.shift();
        self._nextStep();
      }

      dlg.cancel = function() { self.clean() }

      dlg.appendToBody().open();
    },

    // Share visualization step
    _shareVisualization: function() {
      var self = this;
      var dlg = new cdb.admin.ShareDialog({
        vis:    this.model,
        user:   this.user,
        config: this.config
      });

      dlg.ok = function() {
        self.stack.shift();
        self._nextStep();
      }

      dlg.cancel = function() { self.clean() }

      dlg.appendToBody().open({ center: true });
    },

    // Do next step until the end
    _nextStep: function() {
      if (this.stack.length > 0) {
        this['_' + this.stack[0]]()
      } else {
        this.clean();
      }
    },

    // Clean clean cleaaaaaaaaaaan!
    clean: function() {
      this.stack = [];
      cdb.core.View.prototype.clean.call(this);
    }

  });