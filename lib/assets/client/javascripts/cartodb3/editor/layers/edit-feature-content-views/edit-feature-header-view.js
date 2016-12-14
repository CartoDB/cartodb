var EditFeatureHeaderView = require('../../../../../core/javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-header-view');
var template = require('./edit-feature-header.tpl');

module.exports = EditFeatureHeaderView.extend({

  render: function () {
    console.log('client');

    this.clearSubViews();

    this.$el.html(
      template()
    );

    if (!this._isNew) {
      this._initViews();
    }

    return this;
  }

});
