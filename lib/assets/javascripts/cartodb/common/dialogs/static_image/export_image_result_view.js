var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-input': '_onInputClick',
    'click .js-open-image': 'close'
  }),

  initialize: function() {
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this._panes.getActivePane().render().el;
  },

  _initViews: function() {

    this.table = this.options.table;
    this.column = this.options.column;

    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._panes);

    this._panes.addTab('result',
      ViewFactory.createByTemplate('common/dialogs/static_image/export_image_result_view', {
        column: this.column,
        response: this.options.response
      })
    );
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Generating image',
        quote: randomQuote()
      })
    );
    this._panes.addTab('fail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Could not generate image'
      })
    );
    this._panes.active('result');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  ok: function() {
    this.close();
  },

  _onInputClick: function(e) {
    $(e.target).focus().select();
  }
});
