var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./asset-header-view.tpl');

var REQUIRED_OPTS = [
  'title',
  'editable'
];

module.exports = CoreView.extend({
  events: {
    'click .js-remove': '_onClickRemove',
    'click .js-select-all': '_onClickSelectAll',
    'click .js-deselect-all': '_onClickDeselectAll'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._assetsCollection = this.options.assetsCollection;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var selectedCount = this._getSelectedAssetsCount();

    var assetsCount = this._assetsCollection.size();

    this.$el.html(template({
      title: this._title,
      editable: this._editable,
      assetsCount: assetsCount,
      selectedCount: selectedCount,
      allSelected: selectedCount === assetsCount
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._assetsCollection, 'add change remove', this.render);
  },

  _onClickRemove: function () {
    this.trigger('remove');
  },

  _onClickSelectAll: function () {
    this.trigger('select-all');
  },

  _onClickDeselectAll: function () {
    this.trigger('deselect-all');
  },

  _getSelectedAssetsCount: function () {
    var selectedAssets = this._assetsCollection.where({ state: 'selected' });
    return selectedAssets ? selectedAssets.length : 0;
  }
});
