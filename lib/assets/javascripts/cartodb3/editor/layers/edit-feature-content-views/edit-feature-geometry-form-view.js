var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-geometry-form.tpl');
var EditFeatureGeometryFormModel = require('./edit-feature-geometry-form-model');
var EditFeatureGeometryPointFormModel = require('./edit-feature-geometry-point-form-model');

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

    var geojson = null;

    try {
      geojson = JSON.parse(this.model.get('the_geom'));
    } catch (err) {
      // if the geom is not a valid json value
    }

    if (this.model.isPoint()) {
      this._formModel = new EditFeatureGeometryPointFormModel({
        lng: geojson && geojson.coordinates[0],
        lat: geojson && geojson.coordinates[1]
      }, {
        featureModel: this.model
      });
    } else {
      this._formModel = new EditFeatureGeometryFormModel({
        the_geom: this.model.get('the_geom')
      }, {
        featureModel: this.model
      });
    }

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
