var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({

  initialize: function (options) {
    if (!options.configModel) throw new Error('configModel is required');

    this._configModel = options.configModel;

    this.on('add', this._onAdd, this);
    this.on('sync', this._onSync, this);
    this.on('change', this._onChange, this);
    this.on('remove', this._onRemove, this);
  },

  _onAdd: function (m) {

  },

  _onSync: function (m) {

  },

  _onChange: function (m) {

  },

  _onRemove: function (m) {

  }

});
