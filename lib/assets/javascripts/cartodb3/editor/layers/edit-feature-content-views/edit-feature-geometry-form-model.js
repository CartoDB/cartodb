var Backbone = require('backbone');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = Backbone.Model.extend({

  parse: function (attrs) {
    var attrs_ = {};

    if (attrs.type.toLowerCase() !== 'point') {
      attrs_.the_geom = JSON.stringify(attrs);
    } else {
      attrs_.lon = attrs.coordinates[0];
      attrs_.lat = attrs.coordinates[1];
    }

    return attrs_;
  },

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), DEBOUNCE_TIME), this);
  },

  _onChange: function () {
    var self = this;

    _.each(this.changed, function (val, key) {
      if (key === 'the_geom') {
        var geom = null;

        try {
          geom = JSON.parse(val);
        } catch (err) {
          // if the geom is not a valid json value
        }

        self._featureModel.set('the_geom', geom);
      } else {
        var geom = JSON.parse(self._featureModel.get('the_geom'));

        var lon = geom.coordinates[0];
        var lat = geom.coordinates[1];

        if (key === 'lon') {
          lon = parseFloat(val);
        } else if (key === 'lat') {
          lat = parseFloat(val);
        }

        self._featureModel.set('the_geom', JSON.stringify({ 'type': 'Point', 'coordinates': [lon, lat] }));
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    var geom = null;

    try {
      geom = JSON.parse(this._featureModel.get('the_geom'));
    } catch(err) {
      // if the geom is not a valid json value
    }

    if (!geom || geom.type.toLowerCase() !== 'point') {
      this.schema.the_geom = {
        type: 'Text',
        title: this._featureModel.get('type'),
        validators: ['required'],
        editorAttrs: {
          disabled: true
        }
      };
    } else {
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
    }
  }

});
