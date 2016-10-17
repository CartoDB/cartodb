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

    // var geom = null;

    // try {
    //   geom = JSON.parse(this.model.get('the_geom'));
    // } catch(err) {
    //   // if the geom is not a valid json value
    // }

    if (this.model.get('type') !== 'point') {
      // this._formModel = new EditFeatureGeometryFormModel({
      //   the_geom: JSON.stringify(this.model.get('the_geom'))
      // }, {
      //   featureModel: this.model
      // });
      this._formModel = new EditFeatureGeometryFormModel({
        the_geom: JSON.stringify(this.model.get('the_geom'))
      }, {
        featureModel: this.model
      });
    } else {
      // this._formModel = new EditFeatureGeometryPointFormModel({
      //   lng: geom.coordinates[0],
      //   lat: geom.coordinates[1]
      // }, {
      //   featureModel: this.model
      // });

      this._formModel = new EditFeatureGeometryPointFormModel({
        lng: this.model.get('lng'),
        lat: this.model.get('lat')
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
