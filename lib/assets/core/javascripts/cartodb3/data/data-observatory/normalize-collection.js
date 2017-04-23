var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var NORMALIZE_QUERY = 'SELECT * FROM OBS_GetAvailableDenominators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}) denoms WHERE valid_numer IS TRUE';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(NORMALIZE_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.denom_id;
    o.label = attrs.denom_name;

    return new BaseModel(o);
  }
});
