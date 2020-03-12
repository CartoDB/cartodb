var CoreView = require('backbone/core-view');
var CustomListView = require('builder/components/custom-list/custom-list-view');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var privacyCTATemplate = require('./privacy-cta.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'model',
  'collection',
  'userModel',
  'configModel',
  'visModel'
];

module.exports = CoreView.extend({
  className: 'Editor-boxModal Privacy-dialog',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function () {
    var disabledOptions = this._collection.where({ disabled: true });
    var customInstall = this._configModel.get('cartodb_com_hosted');
    var upgradeURL = this._configModel.get('upgrade_url');

    var listView = new CustomListView({
      model: this._model,
      collection: this._collection,
      itemView: CustomListItemView
    });
    this.$el.append(listView.render().el);
    this.addView(listView);

    var disabledPublicSharing = this._visModel.isVisualization() ? this._userModel.hasPublicMapSharingDisabled() : this._userModel.hasPublicDatasetSharingDisabled();
    if (disabledOptions.length > 0 && !customInstall && upgradeURL && !disabledPublicSharing) {
      this.$el.append(
        privacyCTATemplate({
          upgradeURL: upgradeURL,
          showTrial: this._userModel.canStartTrial()
        })
      );
    }
  }
});
