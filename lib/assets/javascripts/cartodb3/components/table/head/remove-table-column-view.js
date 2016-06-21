var CoreView = require('backbone/core-view');
var template = require('./remove-table-column.tpl');
var renderLoading = require('../../loading/render-loading');
var removeTableColumn = require('../operations/table-remove-column');

/**
 *  Remove table column dialog
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
    if (!opts.columnModel) throw new Error('columnModel is required');

    this._modalModel = opts.modalModel;
    this._columnModel = opts.columnModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        name: this._columnModel.get('name')
      })
    );
    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.table.columns.destroy.loading', { columnName: this._columnModel.get('name') })
      })
    );
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onOkClick: function () {
    this._renderLoadingView();

    removeTableColumn({
      tableViewModel: this._tableViewModel,
      columnModel: this._columnModel,
      onSuccess: function () {
        this._modalModel.destroy();
      }.bind(this),
      onError: function (e) {
        this._modalModel.destroy();
      }.bind(this)
    });
  },

  _onCancelClick: function () {
    this._modalModel.destroy();
  }

});
