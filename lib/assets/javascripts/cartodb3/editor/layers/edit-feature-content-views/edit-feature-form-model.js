var Backbone = require('backbone');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    if (this._featureModel.isPoint()) {
    } else {
    }

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
    this._featureModel.on('change', this._onFeatureDefinitionChanged, this);
  },

  _onFeatureDefinitionChanged: function () {
    var attrs = {
      the_geom: this._featureModel.get('geojson')
    };
    if (this._featureModel.isPoint()) {
      attrs = _.extend(attrs, {
        lat: this._featureModel.get('lat'),
        lng: this._featureModel.get('lng')
      });
    }

    this.set(attrs);
  },

  _onChange: function () {
    // var self = this;
    // var geom;

    // _.each(this.changed, function (val, key) {
    //   if (key === 'the_geom') {
    //     try {
    //       geom = JSON.parse(val);
    //     } catch (err) {
    //       // if the geom is not a valid json value
    //     }

    //     self._featureModel.set('the_geom', geom);
    //   } else {
    //     geom = JSON.parse(self._featureModel.get('the_geom'));

    //     var lon = geom.coordinates[0];
    //     var lat = geom.coordinates[1];

    //     if (key === 'lon') {
    //       lon = parseFloat(val);
    //     } else if (key === 'lat') {
    //       lat = parseFloat(val);
    //     }

    //     self._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lon, lat] }));
    //   }
    // });
  },

  _generateSchema: function () {
    this.schema = {};

    if (this._featureModel.isPoint()) {
      this.schema.lat = {
        type: 'Number',
        validators: ['required'],
        showSlider: false
      };
      this.schema.lon = {
        type: 'Number',
        validators: ['required'],
        showSlider: false
      };
    } else {
      this.schema.the_geom = {
        type: 'Text',
        title: this._featureModel.get('type'),
        validators: ['required'],
        editorAttrs: {
          disabled: true
        }
      };
    }
  }

});
