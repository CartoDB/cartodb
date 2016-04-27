var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({

  parse: function (r, opts) {
    r.options = r.options || {};

    // Flatten the rest of the attributes
    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

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
