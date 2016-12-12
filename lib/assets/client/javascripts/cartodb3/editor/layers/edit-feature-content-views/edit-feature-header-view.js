var EditFeatureHeaderView = require('../../../../../../javascripts/cartodb3/edit-feature-content-views/edit-feature-header-view');
var template = require('./edit-feature-header.tpl');

module.exports = EditFeatureHeaderView.extend({

  render: function () {
    this.clearSubViews();

    var featureType = this.model.getFeatureType();

    this.$el.html(
      template({
        url: this._url,
        tableName: this._tableName,
        featureType: featureType ? _t('editor.edit-feature.features.' + featureType) : _t('editor.edit-feature.features.geometry')
      })
    );

    if (!this._isNew) {
      this._initViews();
    }

    return this;
  }

});
