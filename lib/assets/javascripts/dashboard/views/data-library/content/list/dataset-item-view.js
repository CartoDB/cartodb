const _ = require('underscore');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const template = require('./dataset-item.tpl');

const GEOM_TYPES = ['point', 'polygon', 'line', 'raster'];

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
  },

  render: function () {
    this.clearSubViews();

    const vis = this.model;
    const date = vis.get('order') === 'updated_at' ? vis.get('updated_at') : vis.get('created_at');

    this.$el.html(template({
      vis: vis.attributes,
      datasetSize: this._getDatasetSize(vis.get('table')['size']),
      geomType: this._getGeometryType(vis.get('table')['geometry_types']),
      account_host: this._configModel.get('account_host'),
      dataset_base_url: this._configModel.get('dataset_base_url'),
      dateFromNow: moment(date).fromNow()
    }));

    this._renderMapThumbnail();

    return this;
  },

  _renderMapThumbnail: function () {
    const username = this.model.get('permission')['owner']['username'];
    const mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      username: username,
      width: 298,
      height: 220,
      visId: this.model.get('id'),
      mapsApiResource: this._configModel.getMapsResourceName(username),
      config: this._configModel
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
    const geomType = (geomTypes && geomTypes[0] || '').toLowerCase();

    return _.find(GEOM_TYPES, type => geomType.indexOf(type) !== -1);
  },

  _getDatasetSize: function (size) {
    return size ? Utils.readablizeBytes(size, true).split(' ') : 0;
  }
});
