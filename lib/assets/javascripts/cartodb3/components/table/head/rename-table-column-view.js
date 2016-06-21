var CoreView = require('backbone/core-view');
var template = require('./rename-table-column.tpl');
var renderLoading = require('../../loading/render-loading');
var renameColumn = require('../operations/table-rename-column');

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
    if (!opts.newName) throw new Error('newName is required');

    this._modalModel = opts.modalModel;
    this._columnModel = opts.columnModel;
    this._newName = opts.newName;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        columnName: this._columnModel.get('name'),
        newName: this._newName
      })
    );
    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.table.columns.rename.loading', {
          columnName: this._columnModel.get('name'),
          newName: this._newName
        })
      })
    );
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onOkClick: function () {
    this._renderLoadingView();

    renameColumn({
      columnModel: this._columnModel,
      newName: this._newName,
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
