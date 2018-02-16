var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var REGIONS_QUERY = "SELECT count(*) num_measurements, tag.key region_id, tag.value region_name FROM (SELECT * FROM OBS_GetAvailableNumerators() WHERE jsonb_pretty(numer_tags) LIKE '%subsection/%') numers,  Jsonb_Each(numers.numer_tags) tag WHERE tag.key like 'section%' GROUP BY tag.key, tag.value ORDER BY region_name";

module.exports = BaseCollection.extend({
  buildQuery: function () {
    return REGIONS_QUERY;
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.region_id;
    o.label = attrs.region_name.replace(/["]+/g, '');

    o.renderOptions = {
      measurements: attrs.num_measurements
    };

    return new BaseModel(o);
  },

  fetch: function (options) {
    this.stateModel.set('state', 'fetching');
    // check if the geometry type is available, if not wait until it's finished
    if (this._nodeDefModel.queryGeometryModel.isFetched()) {
      BaseCollection.prototype.fetch.call(this, options);
    } else {
      this._nodeDefModel.queryGeometryModel.once('change:status', function () {
        BaseCollection.prototype.fetch.call(this, options);
      }, this);
    }
  }
});
