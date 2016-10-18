var CoreView = require('backbone/core-view');
var template = require('./edit-feature-header.tpl');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.url) throw new Error('url is required');
    if (!opts.tableName) throw new Error('tableName is required');
    if (!opts.featureDefinitionModel) throw new Error('featureDefinitionModel is required');

    this._url = opts.url;
    this._tableName = opts.tableName;
    this._featureDefinitionModel = opts.featureDefinitionModel;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        url: this._url,
        tableName: this._tableName,
        type: this._getFeatureType()
      })
    );

    return this;
  },

  _getFeatureType: function () {
    // TODO: use _t here!
    if (this._featureDefinitionModel.isPoint()) {
      return 'point';
    }
    if (this._featureDefinitionModel.isLine()) {
      return 'line';
    }
    if (this._featureDefinitionModel.isPolygon()) {
      return 'polygon';
    }
  }

});
