var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
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

  contains: function (layerModel) {
    return this.getIndexOf(layerModel) >= 0;
  },

  each: function (iteratee, context) {
    _.each(this.getLayers(), iteratee.bind(context || this));
  },

  getLayers: function () {
    return this._layersCollection.getCartoDBLayers();
  },

  getIndexOf: function (layerModel) {
    return this.getLayers().indexOf(layerModel);
  },

  getLayerAt: function (index) {
    return this.getLayers()[index];
  },

  isEqual: function () {
    return false;
  },

  hasURLs: function () {
    return !!this.get('urls');
  },

  getSubdomains: function () {
    return (this.get('urls') && this.get('urls').subdomains) || ['0'];
  },

  getTileURLGrid: function () {
    var urls = this.get('urls');
    var urlTemplate = this.getTileURLTemplate();

    return _.map(urls.subdomains, function (subdomain) {
      return urlTemplate.replace('{s}', subdomain);
    });
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
      .replace('{layerIndexes}', this._getIndexesOfVisibleLayers())
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
    return _.all(this.getLayers(), function (layerModel) {
      return !layerModel.isVisible();
    });
  },

  _getIndexesOfVisibleLayers: function (url) {
    var indexOfLayersInWindshaft = this.get('indexOfLayersInWindshaft');
    return _.reduce(this.getLayers(), function (indexes, layerModel, layerIndex) {
      if (layerModel.isVisible()) {
        indexes.push(indexOfLayersInWindshaft[layerIndex]);
      }
      return indexes;
    }, []).join(',');
  },

  hasTileURLTemplates: function () {
    return !!this.getTileURLTemplate();
  },

  getGridURLTemplates: function (layerIndex) {
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
      return url + '?' + params.join('&');
    }

    return url;
  },

  onLayerVisibilityChanged: function (callback) {
    this._layersCollection.on('change:visible', function (layerModel) {
      if (this.contains(layerModel)) {
        callback(layerModel);
      }
    }, this);
  },

  onLayerAdded: function (callback) {
    this._layersCollection.on('add', function (layerModel) {
      if (this.contains(layerModel)) {
        callback(layerModel, this.getIndexOf(layerModel));
      }
    }, this);
  }
});

module.exports = CartoDBLayerGroup;
