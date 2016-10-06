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

  getTileURLTemplates: function () {
    if (this._areAllLayersHidden()) {
      return [];
    }
    var tileURLTemplates = (this.get('urls') && this.get('urls').tiles) || [];
    return _.chain(tileURLTemplates)
      .map(this._replaceLayerIndexesOfVisibleLayers.bind(this))
      .map(this._appendAuthParamsToURL.bind(this))
      .value();
  },

  _areAllLayersHidden: function () {
    return _.all(this.getLayers(), function (layerModel) {
      return !layerModel.isVisible();
    });
  },

  _replaceLayerIndexesOfVisibleLayers: function (url) {
    var remoteIndexesOfVisibleLayers = _.reduce(this.getLayers(), function (indexes, layerModel, layerIndex) {
      if (layerModel.isVisible()) {
        indexes.push(this.get('indexOfLayersInWindshaft')[layerIndex]);
      }
      return indexes;
    }.bind(this), []);
    return url.replace('{layerIndexes}', remoteIndexesOfVisibleLayers.join(','));
  },

  hasTileURLTemplates: function () {
    return this.getTileURLTemplates().length > 0;
  },

  getGridURLTemplates: function (layerIndex) {
    var gridURLTemplates = (this.get('urls') && this.get('urls').grids && this.get('urls').grids[layerIndex]) || [];
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
  },

  enableInteractivity: function () {
    this.set('interactivity', true);
  },

  disableInteractivity: function () {
    this.set('interactivity', false);
  },

  isInteractivityEnabled: function () {
    return !!this.get('interactivity');
  }
});

module.exports = CartoDBLayerGroup;
