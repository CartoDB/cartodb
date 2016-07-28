var Backbone = require('backbone');
var moment = require('moment');
var NASAView = require('./nasa-view');
var _ = require('underscore');
var CustomLayerModel = require('../../../../data/custom-layer-model');

var TYPES = {
  day: {
    url: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/<%- date %>/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
    limit: '2012-05-01',
    default: '2012-05-01',
    attribution: '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
    name: 'NASA Terra',
    maxZoom: 9,
    minZoom: 1
  },

  night: {
    url: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/<%- date %>/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    limit: '2012-05-01',
    default: '2012-05-02',
    attribution: '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
    name: 'NASA Earth at night',
    maxZoom: 8,
    minZoom: 1
  }
};

/**
 * View model for NASA tab content.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    name: 'nasa',
    label: 'NASA',
    layer: undefined, // gets set on dayOrNight/date changes
    layerType: 'day',
    date: undefined, // for date picker
    current: undefined,
    format: 'Y-m-d' // YYYY-MM-DD
  },

  initialize: function () {
    this._initBinds();
  },

  createView: function () {
    var utc = new Date().getTimezoneOffset();
    var today = moment(new Date()).utcOffset(utc).format('YYYY-MM-DD');
    var yesterday = moment(new Date()).utcOffset(utc).subtract(1, 'days').format('YYYY-MM-DD');
    this.set({
      current: today,
      date: yesterday
    });

    return new NASAView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function (userLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(userLayers.custom(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  },

  _initBinds: function () {
    this.bind('change:date change:layerType', this._onChange, this);
  },

  _onChange: function () {
    var dateStr = this.get('date');
    var layerType = this.get('layerType');

    var url = _.template(TYPES[layerType].url)({
      date: dateStr
    });

    var layer = new CustomLayerModel({
      urlTemplate: url,
      attribution: TYPES[layerType].attribution,
      maxZoom: TYPES[layerType].maxZoom,
      minZoom: TYPES[layerType].minZoom,
      name: TYPES[layerType].name + ' ' + dateStr,
      category: 'Custom',
      type: 'Tiled'
    });

    this.set('layer', layer);
  }

});
