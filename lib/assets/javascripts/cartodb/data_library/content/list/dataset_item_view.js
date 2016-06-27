var cdb = require('cartodb.js-v3');
var MapCardPreview = require('../../../common/views/mapcard_preview');
var Utils = require('cdb.Utils');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'MapsList-item',

  initialize: function() {
    this.template = cdb.templates.getTemplate('data_library/content/list/dataset_item_template');
  },

  render: function() {
    this.clearSubViews();

    var vis = this.model;

    var d = {
      vis: vis.attributes,
      date: vis.get('order') === 'updated_at' ? vis.get('updated_at') : vis.get('created_at'),
      datasetSize: this._getDatasetSize(vis.get('table')['size']),
      geomType: this._getGeometryType(vis.get('table')['geometry_types']),
      account_host: cdb.config.get('account_host'),
      dataset_base_url: cdb.config.get('dataset_base_url')
    };

    this.$el.html(this.template(d));

    this._renderMapThumbnail();

    return this;
  },

  _renderMapThumbnail: function() {
    var username = this.model.get('permission')['owner']['username'];
    var mapCardPreview = new MapCardPreview({
      el: this.$('.js-header'),
      username: username,
      width: 298,
      height: 220,
      visId: this.model.get('id'),
      mapsApiResource: cdb.config.getMapsResourceName(username)
    });

    if (this.imageURL) {
      mapCardPreview.loadURL(this.imageURL);
    } else {
      mapCardPreview.load();
    }

    mapCardPreview.bind("loaded", function(url) {
      this.imageURL = url;
    }, this);

    this.addView(mapCardPreview);
  },

  _getGeometryType: function(geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function(type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });

    } else {
      return null;
    }
  },

  _getDatasetSize: function(size) {
    return size ? cdb.Utils.readablizeBytes(size, true).split(' ') : 0;
  },

});
