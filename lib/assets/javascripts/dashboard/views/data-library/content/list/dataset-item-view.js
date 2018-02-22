const _ = require('underscore');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const template = require('./dataset-item-template.tpl');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * View representing an item in the list under datasets route.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'MapsList-item',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var vis = this.model;

    this.$el.html(template({
      vis: vis.attributes,
      date: vis.get('order') === 'updated_at' ? vis.get('updated_at') : vis.get('created_at'),
      datasetSize: this._getDatasetSize(vis.get('table')['size']),
      geomType: this._getGeometryType(vis.get('table')['geometry_types']),
      account_host: this._configModel.get('account_host'),
      dataset_base_url: this._configModel.get('dataset_base_url')
    }));

    this._renderMapThumbnail();

    return this;
  },

  _renderMapThumbnail: function () {
    var username = this.model.get('permission')['owner']['username'];
    var mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      username: username,
      width: 298,
      height: 220,
      visId: this.model.get('id'),
      mapsApiResource: this._configModel.getMapsResourceName(username)
    });

    if (this.imageURL) {
      mapCardPreview.loadURL(this.imageURL);
    } else {
      mapCardPreview.load();
    }

    mapCardPreview.bind('loaded', function (url) {
      this.imageURL = url;
    }, this);

    this.addView(mapCardPreview);
  },

  _getGeometryType: function (geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function (type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });
    } else {
      return null;
    }
  },

  _getDatasetSize: function (size) {
    return size ? Utils.readablizeBytes(size, true).split(' ') : 0;
  }
});
