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

    var geom = null;

    try {
      geom = JSON.parse(this._featureModel.get('the_geom'));
    } catch(err) {
      // if the geom is not a valid json value
    }

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
