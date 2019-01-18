var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var BaseDialog = require('../views/base_dialog/view');
var ViewFactory = require('../view_factory');
var randomQuote = require('../view_helpers/random_quote');
var ErrorDetailsView = require('../views/error_details_view');

/**
 * Dialog to manage duplication process of a cdb.admin.CartoDBTableMetadata object.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    if (!this.model) throw new Error('model is required (cdb.admin.CartoDBTableMetadata)');
    if (!this.options.user) throw new Error('user is required');
    this.elder('initialize');
    this._initViews();
    this._initBinds();
    this._duplicateDataset();
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
      ViewFactory.createByTemplate('common/templates/loading', {
        title: this.model.isInSQLView() ? 'Creating dataset from your query' : 'Duplicating your dataset',
        quote: randomQuote()
      })
    );
    this._panes.active('loading');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  _duplicateDataset: function(newName) {
    var self = this;
    var newName = this.model.get('name') + '_copy';
    this.model.duplicate(newName, {
      success: function(newTable) {
        self._redirectTo(newTable.viewUrl());
      },
      error: self._showError.bind(self)
    });
  },

  _showError: function(model) {
    var view;
    try {
      var err = _.clone(model.attributes);
      view = new ErrorDetailsView({
        err: _.extend(err, model.attributes.get_error_text),
        user: this.options.user
      });
    } catch(err) {
      view = ViewFactory.createByTemplate('common/templates/fail', {
        msg: "Sorry, something went wrong, but we're not sure why."
      });
    }
    this._panes.addTab('fail', view.render());
    this._panes.active('fail');
  },

  _redirectTo: function(url) {
    window.location = url;
  }
});
