var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Create a vis from a dataset, required for some contexts to have a vis before be able to carry out next task
 *  - duplicate vis
 *  - add layer
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    if (!this.model) throw new Error('model is required (cdb.admin.Visualization)');
    if (!this.options.title) throw new Error('title is required');
    if (!this.options.explanation) throw new Error('title is required');
    if (!this.options.router) throw new Error('router callback is required');
    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('confirm',
      ViewFactory.createByTemplate('common/dialogs/create_vis_first/template', {
        title: this.options.title,
        explanation: this.options.explanation
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Creating map…',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not create map for some reason'
      })
    );
    this._panes.active('confirm');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  ok: function() {
    this._panes.active('loading');
    var self = this;
    this.model.changeToVisualization({
      success: function(vis) {
        self.options.router.changeToVis(vis);
        if (self.options.success) {
          self.options.success(vis);
        }
        self.clean();
      },
      error: function() {
        self._panes.active('fail');
      }
    });
  }
});
