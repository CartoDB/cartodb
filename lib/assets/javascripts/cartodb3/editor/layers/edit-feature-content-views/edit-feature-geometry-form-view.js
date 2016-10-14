var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-geometry-form.tpl');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');

module.exports = CoreView.extend({

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();

    return this;
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    var geom = JSON.parse(this.model.get('the_geom'));

    this._formModel = new EditFeatureGeometryFormModel(geom, {
      featureModel: this.model,
      parse: true
    });

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-form').append(this._formView.render().$el);
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }
});
