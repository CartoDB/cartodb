var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var LayerTypes = require('./map/layer-types');
var util = require('../core/util');

var CartoDBLayerGroup = Backbone.Model.extend({
  defaults: {
    visible: true,
    type: 'layergroup'
  },

  initialize: function (attributes, options) {
    options = options || {};

    if (!options.layersCollection) {
      throw new Error('layersCollection option is required');
    }
    this._layersCollection = options.layersCollection;
  },

  forEachGroupedLayer: function (iteratee, context) {
    _.each(this._getGroupedLayers(), iteratee.bind(context || this));
  },

  _getGroupedLayers: function () {
    return this._layersCollection.getCartoDBLayers();
  },

  _getLayers: function () {
    return this._layersCollection.reject(LayerTypes.isGoogleMapsBaseLayer);
  },

  getIndexOfLayerInLayerGroup: function (layerModel) {
    return this._getGroupedLayers().indexOf(layerModel);
  },

  getLayerInLayerGroupAt: function (index) {
    return this._getGroupedLayers()[index];
  },

  getCartoLayerById: function (id) {
    return this._layersCollection.get(id);
  },

  isEqual: function () {
    return false;
  },

  hasURLs: function () {
    return !!this.get('urls');
  },

  getSubdomains: function () {
    return (this.get('urls') && this.get('urls').subdomains) || [];
  },

  getTileURLTemplatesWithSubdomains: function () {
    var urlTemplate = this.getTileURLTemplate();
    var subdomains = this.getSubdomains();

    if (subdomains && subdomains.length) {
      return _.map(subdomains, function (subdomain) {
        return urlTemplate.replace('{s}', subdomain);
      });
    }

    return [ urlTemplate ];
  },

  getTileURLTemplate: function (type) {
    type = type || 'png';

    var tileURLTemplate = (this.get('urls') && this.get('urls').tiles);

    if (!tileURLTemplate) return '';

    if (type === 'png') {
      if (this._areAllLayersHidden()) {
        return '';
      }
      return this._generatePNGTileURLTemplate(tileURLTemplate);
    } else if (type === 'mvt') {
      return this._generateMTVTileURLTemplate(tileURLTemplate);
    }
  },

  _generatePNGTileURLTemplate: function (urlTemplate) {
    urlTemplate = urlTemplate
      .replace('{layerIndexes}', this._getIndexesOfVisibleMapnikLayers())
      .replace('{format}', 'png');
    return this._appendAuthParamsToURL(urlTemplate);
  },

  _generateMTVTileURLTemplate: function (urlTemplate) {
    urlTemplate = urlTemplate
      .replace('{layerIndexes}', 'mapnik')
      .replace('{format}', 'mvt');
    return this._appendAuthParamsToURL(urlTemplate);
  },

  _areAllLayersHidden: function () {
    return _.all(this._getGroupedLayers(), function (layerModel) {
      return !layerModel.isVisible();
    });
  },

  _getIndexesOfVisibleMapnikLayers: function (url) {
    var indexOfLayersInWindshaft = this.get('indexOfLayersInWindshaft');
    return _.reduce(this._getGroupedLayers(), function (indexes, layerModel, layerIndex) {
      if (layerModel.isVisible()) {
        indexes.push(indexOfLayersInWindshaft[layerIndex]);
      }
      return indexes;
    }, []).join(',');
  },

  _getIndexesOfVisibleLayers: function (url) {
    return _.reduce(this._getLayers(), function (indexes, layerModel, layerIndex) {
      if (layerModel.isVisible()) {
        indexes.push(layerIndex);
      }
      return indexes;
    }, []).join(',');
  },

  hasTileURLTemplates: function () {
    return !!this.getTileURLTemplate();
  },

  getGridURLTemplatesWithSubdomains: function (layerIndex) {
    var gridURLTemplates = (this.get('urls') && this.get('urls').grids && this.get('urls').grids[layerIndex]) || [];

    if (this.get('urls') && this.get('urls').subdomains) {
      var subdomains = this.get('urls').subdomains;
      gridURLTemplates = _.map(gridURLTemplates, function (url, i) {
        return url.replace('{s}', subdomains[i]);
      });
    }

    return _.map(gridURLTemplates, this._appendAuthParamsToURL, this);
  },

  getAttributesBaseURL: function (layerIndex) {
    return this.get('urls') && this.get('urls').attributes && this.get('urls').attributes[layerIndex];
  },

  getStaticImageURLTemplate: function () {
    var staticImageURLTemplate = this.get('urls') && this.get('urls').image;
    if (staticImageURLTemplate) {
      staticImageURLTemplate = this._appendParamsToURL(staticImageURLTemplate, [ 'layer=' + this._getIndexesOfVisibleLayers() ]);
      staticImageURLTemplate = this._appendAuthParamsToURL(staticImageURLTemplate);
      staticImageURLTemplate = staticImageURLTemplate.replace('{s}', this.getSubdomains()[0]);
    }
    return staticImageURLTemplate;
  },

  fetchAttributes: function (layerIndex, featureID, callback) {
    var attributeBaseURL = this.getAttributesBaseURL(layerIndex);
    if (!attributeBaseURL) {
      throw new Error('Attributes cannot be fetched until urls are set');
    }

    var url = this._appendAuthParamsToURL(attributeBaseURL + '/' + featureID);

    $.ajax({
      dataType: 'jsonp',
      url: url,
      jsonpCallback: '_cdbi_layer_attributes_' + util.uniqueCallbackName(this.toJSON()),
      cache: true,
      success: function (data) {
        // loadingTime.end();
        callback(data);
      },
      error: function (data) {
        // loadingTime.end();
        // cartodb.core.Profiler.metric('cartodb-js.named_map.attributes.error').inc();
        callback(null);
      }
    });
  },

  _appendAuthParamsToURL: function (url) {
    var params = [];
    if (this.get('apiKey')) {
      params.push('api_key=' + this.get('apiKey'));
    } else if (this.get('authToken')) {
      var authToken = this.get('authToken');
      if (authToken instanceof Array) {
        _.each(authToken, function (token) {
          params.push('auth_token[]=' + token);
        });
      } else {
        params.push('auth_token=' + authToken);
      }
    }

    return this._appendParamsToURL(url, params);
  },

  _appendParamsToURL: function (url, params) {
    if (params.length) {
      var separator = '?';
      if (url.indexOf('?') !== -1) {
        separator = '&';
      }
      return url + separator + params.join('&');
    }
    return url;
  },

  onLayerVisibilityChanged: function (callback) {
    this._layersCollection.on('change:visible', function (layerModel) {
      if (this._isLayerGrouped(layerModel)) {
        callback(layerModel);
      }
    }, this);
  },

  onLayerAdded: function (callback) {
    this._layersCollection.on('add', function (layerModel) {
      if (this._isLayerGrouped(layerModel)) {
        callback(layerModel, this.getLayerInLayerGroupAt(layerModel));
      }
    }, this);
  },

  _isLayerGrouped: function (layerModel) {
    return this._getGroupedLayers().indexOf(layerModel) >= 0;
  }
});

module.exports = CartoDBLayerGroup;
