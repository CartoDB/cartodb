var CoreView = require('backbone/core-view');
var template = require('./remove-table-row.tpl');
var renderLoading = require('../../loading/render-loading');
var removeTableRow = require('../operations/table-remove-row');

/**
 *  Remove table row dialog
 *
 *  - To be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-delete': '_onOkClick',
    'click .js-cancel': '_onCancelClick'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.rowModel) throw new Error('rowModel is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._modalModel = opts.modalModel;
    this._tableViewModel = opts.tableViewModel;
    this._rowModel = opts.rowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        cartodb_id: this._rowModel.get('cartodb_id')
      })
    );
    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.table.rows.confirmation.loading')
      })
    );
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onOkClick: function () {
    this._renderLoadingView();

    removeTableRow({
      tableViewModel: this._tableViewModel,
      rowModel: this._rowModel,
      onSuccess: function () {
        this._modalModel.destroy();
      }.bind(this),
      onError: function (e) {
        this._modalModel.destroy();
      }
    });
  },

  _onCancelClick: function () {
    this._modalModel.destroy();
  }

});
