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
      // if the attr doesn't exist in the featureModel it will be created, BOOM
      self._featureModel.set(key, val);
    });
  },

  _generateSchema: function () {
    this.schema = {};

    this.schema.description = {
      type: 'Text',
      validators: ['required'],
    };
    this.schema.name = {
      type: 'Text',
      validators: ['required'],
    };
  }

});
