var Backbone = require('backbone');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = Backbone.Model.extend({

  parse: function (attrs) {
    var attrs_ = {};

    if (attrs.type.toLowerCase() !== 'point') {
      attrs_.the_geom = JSON.stringify(attrs)
    } else {
      attrs_.lon = attrs.coordinates[0]
      attrs_.lat = attrs.coordinates[1]
    }

    return attrs_;
  },

  initialize: function (attrs, opts) {
    if (!opts.geometryModel) throw new Error('geometryModel is required');

    this._geometryModel = opts.geometryModel;

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
        } catch(err) {
          // if the geom is not a valid json value
        }

        self._geometryModel.set(geom);
      } else {
        var lon = self._geometryModel.get('coordinates')[0];
        var lat = self._geometryModel.get('coordinates')[1];

        if (key === 'lon') {
          var lon = parseFloat(val);
        } else if (key === 'lat') {
          var lat = parseFloat(val);
        }

        self._geometryModel.set({"type": "Point", "coordinates": [lon, lat]});
      }

    });
  },

  _generateSchema: function () {
    this.schema = {};

    var type = this._geometryModel.get('type').toLowerCase();

    if (type !== 'point') {
      this.schema.the_geom = {
        type: 'Text',
        title: this._geometryModel.get('type'),
        validators: ['required']
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
