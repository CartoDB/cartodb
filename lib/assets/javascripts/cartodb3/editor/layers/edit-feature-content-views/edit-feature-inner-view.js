var CoreView = require('backbone/core-view');
var EditFeatureGeometryFormView = require('./edit-feature-geometry-form-view');
var EditFeatureAttributesFormView = require('./edit-feature-attributes-form-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');
    if (!opts.geometryFormModel) throw new Error('geometryFormModel is required');
    if (!opts.attributesFormModel) throw new Error('attributesFormModel is required');

    this._featureModel = opts.featureModel;
    this._geometryFormModel = opts.geometryFormModel;
    this._attributesFormModel = opts.attributesFormModel;
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();

    if (this._editFeatureGeometryFormView) {
      this.removeView(this._editFeatureGeometryFormView);
      this._editFeatureGeometryFormView.clean();
    }

    this._editFeatureGeometryFormView = new EditFeatureGeometryFormView({
      model: this._geometryFormModel
    });

    this.addView(this._editFeatureGeometryFormView);
    this.$el.append(this._editFeatureGeometryFormView.render().el);

    if (this._editFeatureAttributesFormView) {
      this.removeView(this._editFeatureAttributesFormView);
      this._editFeatureAttributesFormView.clean();
    }

    this._editFeatureAttributesFormView = new EditFeatureAttributesFormView({
      model: this._attributesFormModel
    });

    this.addView(this._editFeatureAttributesFormView);
    this.$el.append(this._editFeatureAttributesFormView.render().el);

    return this;
  }

});
