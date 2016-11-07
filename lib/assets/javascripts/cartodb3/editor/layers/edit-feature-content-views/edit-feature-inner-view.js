var CoreView = require('backbone/core-view');
var EditFeatureGeometryFormView = require('./edit-feature-geometry-form-view');
var EditFeatureAttributesFormView = require('./edit-feature-attributes-form-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');

    this._columnsCollection = opts.columnsCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();

    if (this._editFeatureGeometryFormView) {
      this.removeView(this._editFeatureGeometryFormView);
      this._editFeatureGeometryFormView.clean();
    }

    this._editFeatureGeometryFormView = new EditFeatureGeometryFormView({
      model: this.model
    });

    this.addView(this._editFeatureGeometryFormView);
    this.$el.append(this._editFeatureGeometryFormView.render().el);

    if (this._editFeatureAttributesFormView) {
      this.removeView(this._editFeatureAttributesFormView);
      this._editFeatureAttributesFormView.clean();
    }

    this._editFeatureAttributesFormView = new EditFeatureAttributesFormView({
      model: this.model,
      columnsCollection: this._columnsCollection
    });

    this.addView(this._editFeatureAttributesFormView);
    this.$el.append(this._editFeatureAttributesFormView.render().el);

    return this;
  }

});
