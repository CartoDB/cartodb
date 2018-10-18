var _ = require('underscore');
var Backbone = require('backbone');
var BasemapModelFactory = require('builder/editor/layers/basemap-content-views/basemap-model-factory');

var customBaseLayerAttrs = {
  'id': '27d7e5bf-7a64-41b1-a6e0-378d842745a0',
  'type': 'Tiled',
  'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
  'attribution': null,
  'maxZoom': 21,
  'minZoom': 0,
  'name': 'Custom basemap 16',
  'tms': false,
  'className': 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
  'order': 16,
  'visible': true
};

var expectedCustomBasemapModelAttrs = function (category) {
  return {
    'id': '27d7e5bf-7a64-41b1-a6e0-378d842745a0',
    'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    'minZoom': 0,
    'maxZoom': 21,
    'name': 'Custom basemap 16',
    'className': 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
    'attribution': null,
    'category': category,
    'tms': false,
    'selected': false,
    'val': 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
    'label': 'Custom basemap 16',
    'default': false,
    'type': 'Tiled',
    'template': jasmine.any(Function)
  };
};

var testCases = [
  {
    basemapCategory: 'CARTO',
    basemapAttrs: {
      'default': true,
      'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': '0',
      'maxZoom': '18',
      'name': 'Positron',
      'className': 'positron_rainbow_labels',
      'attribution': 'attribution',
      'labels': {
        'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
      }
    },
    expectedBasemapModelAttrs: {
      'default': true,
      'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': '0',
      'maxZoom': '18',
      'name': 'Positron',
      'className': 'positron_rainbow_labels',
      'attribution': 'attribution',
      'labels': {
        'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
      },
      'type': 'Tiled',
      'category': 'CARTO',
      'selected': false,
      'val': 'positron_rainbow_labels',
      'label': 'Positron',
      'template': jasmine.any(Function)
    }
  },
  {
    basemapCategory: 'Stamen',
    basemapAttrs: {
      'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': '0',
      'maxZoom': '18',
      'name': 'Toner',
      'className': 'toner_stamen_labels',
      'attribution': 'attribution',
      'labels': {
        'urlTemplate': 'http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png'
      }
    },
    expectedBasemapModelAttrs: {
      'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': '0',
      'maxZoom': '18',
      'name': 'Toner',
      'className': 'toner_stamen_labels',
      'attribution': 'attribution',
      'labels': {
        'urlTemplate': 'http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png'
      },
      'type': 'Tiled',
      'category': 'Stamen',
      'selected': false,
      'val': 'toner_stamen_labels',
      'label': 'Toner',
      'default': false,
      'template': jasmine.any(Function)
    }
  },
  {
    basemapCategory: 'Here',
    basemapAttrs: {
      'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': 0,
      'maxZoom': 18,
      'name': 'Toner Hybrid',
      'className': 'toner_hybrid_stamen',
      'attribution': 'Map tiles by <a href="http://stamen.com">"'
    },
    expectedBasemapModelAttrs: {
      'urlTemplate': 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
      'subdomains': 'abcd',
      'minZoom': 0,
      'maxZoom': 18,
      'name': 'Toner Hybrid',
      'className': 'toner_hybrid_stamen',
      'attribution': 'Map tiles by <a href=\"http://stamen.com\">\"',
      'type': 'Tiled',
      'category': 'Here',
      'selected': false,
      'val': 'toner_hybrid_stamen',
      'label': 'Toner Hybrid',
      'template': jasmine.any(Function),
      'default': false
    }
  },
  {
    basemapCategory: 'GMaps',
    basemapAttrs: {
      'name': 'GMaps Roadmap',
      'maxZoom': 40,
      'minZoom': 0,
      'baseType': 'roadmap',
      'className': 'googlemaps',
      'style': '[]',
      'default': true
    },
    expectedBasemapModelAttrs: {
      'name': 'GMaps Roadmap',
      'maxZoom': 40,
      'minZoom': 0,
      'baseType': 'roadmap',
      'className': 'googlemaps',
      'style': '[]',
      'default': true,
      'type': 'GMapsBase',
      'category': 'GMaps',
      'selected': false,
      'val': 'roadmap',
      'label': 'Roadmap',
      'template': jasmine.any(Function)
    }
  },
  {
    basemapCategory: 'Custom',
    basemapAttrs: customBaseLayerAttrs,
    expectedBasemapModelAttrs: expectedCustomBasemapModelAttrs('Custom')
  },
  {
    basemapCategory: 'NASA',
    basemapAttrs: customBaseLayerAttrs,
    expectedBasemapModelAttrs: expectedCustomBasemapModelAttrs('NASA')
  },
  {
    basemapCategory: 'TileJSON',
    basemapAttrs: customBaseLayerAttrs,
    expectedBasemapModelAttrs: expectedCustomBasemapModelAttrs('TileJSON')
  },
  {
    basemapCategory: 'Mapbox',
    basemapAttrs: customBaseLayerAttrs,
    expectedBasemapModelAttrs: expectedCustomBasemapModelAttrs('Mapbox')
  },
  {
    basemapCategory: 'WMS',
    basemapAttrs: customBaseLayerAttrs,
    expectedBasemapModelAttrs: expectedCustomBasemapModelAttrs('WMS')
  },
  {
    basemapCategory: 'Color',
    basemapAttrs: {
      'color': '#FABADA',
      'image': 'IMAGE',
      'className': 'CLASS_NAME'
    },
    expectedBasemapModelAttrs: {
      'default': false,
      'color': '#FABADA',
      'image': 'IMAGE',
      'minZoom': 0,
      'maxZoom': 32,
      'className': 'plain',
      'category': 'Color',
      'type': 'Plain',
      'selected': false,
      'name': '',
      'val': 'plain',
      'label': 'plain',
      'template': jasmine.any(Function)
    }
  }
];

describe('builder/editor/layers/basemap-content-views/basemap-model-factory.js', function () {
  describe('.createBasemapModel', function () {
    beforeEach(function () {
      var layerDefinitionsCollection = new Backbone.Collection();
      layerDefinitionsCollection.getBaseLayer = function () {
        return new Backbone.Model();
      };
      var configModel = new Backbone.Model();
      this.basemapModelFactory = new BasemapModelFactory(layerDefinitionsCollection, configModel);
    });

    _.each(testCases, function (testCase) {
      var basemapCategory = testCase.basemapCategory;
      var basemapAttrs = testCase.basemapAttrs;
      var expectedBasemapModelAttrs = testCase.expectedBasemapModelAttrs;

      it('should create a BasemapModel for ' + basemapCategory + ' basemaps', function () {
        var basemapModel = this.basemapModelFactory.createBasemapModel(basemapCategory, basemapAttrs);
        expect(basemapModel.toJSON()).toEqual(expectedBasemapModelAttrs);
      });
    }, this);
  });
});
