var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var BOUNDARIES_QUERY = 'SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, {{{ normalize }}}, {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_denom IS TRUE OR {{{ normalize }}} IS NULL AND valid_timespan IS TRUE ORDER BY numgeoms DESC';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(BOUNDARIES_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.geom_id;
    o.label = attrs.geom_name;

    return new BaseModel(o);
  },

  getLabels: function () {
    return this.pluck('label');
  },

  getValues: function () {
    return this.pluck('val');
  }

});
