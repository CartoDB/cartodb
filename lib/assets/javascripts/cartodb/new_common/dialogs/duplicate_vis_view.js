var cdb = require('cartodb.js');
var BaseDialog = require('../views/base_dialog/view');
var ViewFactory = require('../view_factory');
var randomQuote = require('../view_helpers/random_quote');

/**
 * Dialog to manage duplication process of a cdb.admin.Visualization object.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    if (!this.model) throw new Error('model is required (cdb.admin.Visualization)');
    if (!this.options.user) throw new Error('user is required');
    if (!this.options.table) throw new Error('table is required');
    this.elder('initialize');
    this._initViews();
    this._initBinds();
    this._startDuplication();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('new_common/templates/loading', {
        title: 'Duplicating your ' + (this.model.isVisualization() ? 'map' : 'dataset'),
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('new_common/templates/fail', {
        msg: "Sorry, something went wrong and we're not sure what."
      })
    );
    this._panes.active('loading');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  _startDuplication: function() {
    var newName = this.model.get('name') + ' copy';
    this[ this.model.isVisualization() ? '_duplicateMap' : '_duplicateDataset' ](newName);
  },

  _duplicateMap: function(newName) {
    var self = this;
    this.model.copy({
      name: newName
    }, {
      success: function(newVis) {
        self._redirectTo(newVis.viewUrl(self.options.user).edit().toString());
      },
      error: function() {
        self._showError();
      }
    });
  },

  _duplicateDataset: function(newName) {
      // Extracted from duplicate_table_dialog view
      var self = this;

      // Copy is done by importing it as a copy, which is an async, so first create the job..
      var importModel = new cdb.admin.Import();
      importModel.save(this.options.table.duplicateDataForNewImport(newName), {
        success: this._checkImport.bind(self),
        error: function() {
          self._showError();
        }
      });
  },

  _checkImport: function(model, changes) {
    var importModel = new cdb.admin.Import({ item_queue_id: changes.item_queue_id });
    importModel.pollCheck();
    importModel.bind('importComplete', function() {
      var path = importModel.get('table_name') || importModel.get('table_id');
      window.location.href = cdb.config.prefixUrl() + '/tables/' + path + '';
    });
    importModel.bind('importError', function() {
      this._showError();
    }, this);
    this.add_related_model(importModel);
  },

  _showError: function() {
    this._panes.active('fail');
  },

  _redirectTo: function(url) {
    window.location = url;
  }
});
