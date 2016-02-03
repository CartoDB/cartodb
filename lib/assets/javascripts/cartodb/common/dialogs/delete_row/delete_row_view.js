var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Modal to delete a row/feature (e.g. a point or polygon), on the table or map view .
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new Error('table is required');
    }

    if (!this.options.row) {
      throw new Error('row is required');
    }

    this.options.name = this.options.name || 'row';

    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {
    this.table = this.options.table;
    this.row = this.options.row;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('confirm',
      ViewFactory.createByTemplate('common/dialogs/delete_row/template', {
        name: this.options.name
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Deleting ' + this.options.name + '…',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not delete ' + this.options.name + ' for some reason'
      })
    );
    this._panes.active('confirm');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  ok: function() {
    var self = this
    this._panes.active('loading');
    this.table.trigger('removing:row');
    this.row.destroy({
      success: function() {
        self.table.trigger('remove:row', self.row);
        self.close();
      },
      error: function() {
        self._panes.active('fail');
      }
    }, {
      wait: this.options.wait
    });
  }
});
