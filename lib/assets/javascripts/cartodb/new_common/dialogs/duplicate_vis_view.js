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
    this.elder('initialize');
    this._initViews();
    this._initBinds();

    var self = this;
    this.model.copy({
      name: this.model.get('name') + ' copy'
    }, {
      success: function(newVis) {
        self._redirectTo(newVis.viewUrl(self.options.user).edit().toString());
      },
      error: function() {
        self._panes.active('fail');
      }
    });
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
        msg: "Sorry, something went wrong and we're not sure what. " +
             'Contact us at "<a href="mailto:support@cartodb.com">support@cartodb.com</a>.'
      })
    );
    this._panes.active('loading');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  _redirectTo: function(url) {
    window.location = url;
  }
});
