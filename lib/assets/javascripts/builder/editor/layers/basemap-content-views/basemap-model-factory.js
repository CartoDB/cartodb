var _ = require('underscore');
var basemapProvidersAndCategories = require('builder/data/basemap-providers-and-categories');
var mosaicThumbnail = require('builder/components/mosaic/mosaic-thumbnail.tpl');
var BasemapModel = require('./basemap-model');

var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;

// 'CartoDB', 'Stamen', 'Here'

var createLeafletBasemapModel = function (category, basemap, baseLayerDefinition, assetsBaseURL) {
  var value;
  var currentValue;
  var label;
  var imageURL;

  var type = basemapProvidersAndCategories.getLayerType(category);
  value = basemap.className;
  currentValue = baseLayerDefinition.get('className');
  label = basemap.name;
  imageURL = lowerXYZ(basemap.urlTemplate, basemap.subdomains);

  _.extend(basemap, {
    type: type,
    name: basemap.name,
    category: category,
    selected: currentValue === value,
    val: value,
    label: label,
    template: function () {
      return mosaicThumbnail({
        imgURL: imageURL
      });
    }
  });

  return new BasemapModel(basemap);
};

var lowerXYZ = function (urlTemplate, subdomains) {
  return urlTemplate
    .replace('{s}', getSubdomain(subdomains))
    .replace('{z}', DEFAULT_ZOOM)
    .replace('{x}', DEFAULT_X_POSITION)
    .replace('{y}', DEFAULT_Y_POSISTION);
};

var getSubdomain = function (subdomains) {
  return (subdomains && subdomains.length) ? subdomains[0] : DEFAULT_SUBDOMAIN;
};

// Google Maps

var createGoogleMapsBasemapModel = function (category, basemapAttrs, baseLayerDefinition, assetsBaseURL) {
  var value;
  var currentValue;
  var label;
  var imageURL;

  var type = basemapProvidersAndCategories.getLayerType(category);
  var generateValue = function (baseType, baseName) {
    var value = baseType;
    if (baseName) {
      value = value + '_' + baseName;
    }
    return value;
  };
  value = generateValue(basemapAttrs.baseType, basemapAttrs.baseName);
  currentValue = generateValue(baseLayerDefinition.get('baseType'), baseLayerDefinition.get('baseName'));
  label = basemapAttrs.name.replace('GMaps ', '');
  imageURL = [
    assetsBaseURL,
    'unversioned/images/google-maps-basemap-icons',
    value + '.jpg'
  ].join('/');

  _.extend(basemapAttrs, {
    type: type,
    name: basemapAttrs.name,
    category: category,
    selected: currentValue === value,
    val: value,
    label: label,
    template: function () {
      return mosaicThumbnail({
        imgURL: imageURL
      });
    }
  });

  return new BasemapModel(basemapAttrs);
};

// Custom

var createCustomBasemapModel = function (category, customBaseLayerAttrs, baseLayerDefinition, configModel) {
  var name = customBaseLayerAttrs.name ? customBaseLayerAttrs.name : 'Custom basemap ' + customBaseLayerAttrs.order;
  var className = customBaseLayerAttrs.className;
  var urlTemplate = customBaseLayerAttrs.urlTemplate;

  return new BasemapModel({
    id: customBaseLayerAttrs.id,
    urlTemplate: urlTemplate,
    minZoom: customBaseLayerAttrs.minZoom || 0,
    maxZoom: customBaseLayerAttrs.maxZoom || 21,
    name: name,
    className: className,
    attribution: customBaseLayerAttrs.attribution,
    category: category || 'Custom',
    tms: customBaseLayerAttrs.tms,
    selected: baseLayerDefinition.get('className') === className,
    val: className,
    label: name,
    template: function (imgURL) {
      return mosaicThumbnail({
        imgURL: imgURL
      });
    }
  });
};

// Color

var createColorBasemapModel = function (category, basemapAttrs, baseLayerDefinition, configModel) {
  return new BasemapModel({
    default: false,
    color: basemapAttrs.color || '',
    image: basemapAttrs.image || '',
    maxZoom: 32,
    className: 'plain',
    category: 'Color',
    type: 'Plain',
    selected: baseLayerDefinition.get('className') === 'plain',
    val: 'plain',
    label: 'plain',
    template: function () {
      return 'plain';
    }
  });
};

//  Factory

var CATEGORY_CARTODB = 'CARTO';
var CATEGORY_STAMEN = 'Stamen';
var CATEGORY_HERE = 'Here';
var CATEGORY_GMAPS = 'GMaps';
var CATEGORY_CUSTOM = 'Custom';
var CATEGORY_NASA = 'NASA';
var CATEGORY_TILEJSON = 'TileJSON';
var CATEGORY_MAPBOX = 'Mapbox';
var CATEGORY_WMS = 'WMS';
var CATEGORY_COLOR = 'Color';

var CREATE_METHODS = {};
CREATE_METHODS[CATEGORY_CARTODB] = createLeafletBasemapModel;
CREATE_METHODS[CATEGORY_STAMEN] = createLeafletBasemapModel;
CREATE_METHODS[CATEGORY_HERE] = createLeafletBasemapModel;
CREATE_METHODS[CATEGORY_GMAPS] = createGoogleMapsBasemapModel;
CREATE_METHODS[CATEGORY_CUSTOM] = createCustomBasemapModel;
CREATE_METHODS[CATEGORY_NASA] = createCustomBasemapModel;
CREATE_METHODS[CATEGORY_TILEJSON] = createCustomBasemapModel;
CREATE_METHODS[CATEGORY_MAPBOX] = createCustomBasemapModel;
CREATE_METHODS[CATEGORY_WMS] = createCustomBasemapModel;
CREATE_METHODS[CATEGORY_COLOR] = createColorBasemapModel;

var BasemapModelFactory = function (layerDefinitionsCollection, configModel) {
  if (!layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!configModel) throw new Error('configModel is required');

  this._layerDefinitionsCollection = layerDefinitionsCollection;
  this._configModel = configModel;
};

BasemapModelFactory.prototype.createBasemapModel = function (basemapCategory, basemapAttrs) {
  var baseLayer = this._layerDefinitionsCollection.getBaseLayer();
  var assetsBaseURL = this._configModel.get('app_assets_base_url');

  var createMethod = CREATE_METHODS[basemapCategory];
  if (!createMethod) {
    throw new Error("Can't create basemapModel for basemap of type: " + basemapCategory);
  }
  return createMethod(basemapCategory, basemapAttrs, baseLayer, assetsBaseURL);
};

module.exports = BasemapModelFactory;
