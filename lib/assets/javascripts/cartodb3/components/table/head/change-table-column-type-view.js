var CoreView = require('backbone/core-view');
var template = require('./change-table-column-type.tpl');
var renderLoading = require('../../loading/render-loading');
var changeColumnType = require('../operations/table-change-column-type');

/**
 *  Change column type warning dialog
 *
 *  - It displays a warning about the change that the user is going to execute.
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
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');
    if (!opts.newType) throw new Error('newType is required');

    this._modalModel = opts.modalModel;
    this._tableViewModel = opts.tableViewModel;
    this._columnModel = opts.columnModel;
    this._newType = opts.newType;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        columnName: this._columnModel.get('name'),
        newType: this._newType
      })
    );
    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.table.rows.change-type.loading')
      })
    );
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onOkClick: function () {
    this._renderLoadingView();

    changeColumnType({
      columnModel: this._columnModel,
      newType: this._newType,
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
