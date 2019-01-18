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

    // Clean on hide and enter to confirm
    // have to be mandatory
    _.extend(
      this.options,
      {
        clean_on_hide: true,
        enter_to_confirm: true
      }
    );

    if (!this.model) throw new Error('model is required (layer)');
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
      ViewFactory.createByTemplate('common/dialogs/delete_layer/template', {
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Deleting layer…',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not delete layer for some reason'
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
    this.model.destroy({
      wait: true,
      success: function() {
        self.close();
      },
      error: function() {
        self._panes.active('fail');
      }
    });
  }

});
