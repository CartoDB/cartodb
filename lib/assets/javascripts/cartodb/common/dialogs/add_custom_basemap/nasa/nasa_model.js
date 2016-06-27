var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var NASAView = require('./nasa_view');
var moment = require('moment-v3');

var TYPES = {
  day: {
    url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/<%- date %>/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
    limit:        '2012-05-01',
    default:      '2012-05-01',
    attribution:  '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
    name:         'NASA Terra',
    maxZoom:      9,
    minZoom:      1
  },

  night: {
    url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/<%- date %>/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    limit:        '2012-05-01',
    default:      '2012-05-02',
    attribution:  '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
    name:         'NASA Earth at night',
    maxZoom:      8,
    minZoom:      1
  }
};

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'nasa',
    label: 'NASA',
    layer: undefined, //gets set on dayOrNight/date changes
    layerType: 'day',

    // for date picker
    date: undefined,
    current: undefined,
    format: 'Y-m-d' // YYYY-MM-DD
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  createView: function() {
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

  hasAlreadyAddedLayer: function(baseLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(baseLayers.custom(), function(customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  },

  _initBinds: function() {
    this.bind('change:date change:layerType', this._onChange, this);
  },

  _onChange: function() {
    var dateStr = this.get('date');
    var layerType = this.get('layerType');
    this.set('layer', new cdb.admin.TileLayer({
      urlTemplate: _.template(TYPES[layerType].url)({
        date: dateStr
      }),
      attribution: TYPES[layerType].attribution,
      maxZoom: TYPES[layerType].maxZoom,
      minZoom: TYPES[layerType].minZoom,
      name: TYPES[layerType].name + ' ' + dateStr
    }));
  }
});
