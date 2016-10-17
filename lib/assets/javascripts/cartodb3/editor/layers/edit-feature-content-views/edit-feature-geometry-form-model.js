var Backbone = require('backbone');
var _ = require('underscore');
var DEBOUNCE_TIME = 350;

module.exports = Backbone.Model.extend({

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
      if (key === 'geojson') {
        var geojson = null;

        try {
          geojson = JSON.parse(val);
        } catch (err) {
          // if the geom is not a valid json value
        }

        self._featureModel.set('geojson', geojson);
      }
    });
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.geojson = {
      type: 'Text',
      title: this._featureModel.get('type'),
      validators: ['required'],
      editorAttrs: {
        disabled: true
      }
    };
  }

});
