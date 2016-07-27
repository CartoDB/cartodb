var BasemapContentView = require('../../../../../javascripts/cartodb3/editor/layers/basemap-content-view');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var _ = require('underscore-cdb-v3');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');

describe('editor/layers/basemap-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({
      id: 'uuid',
      username: 'pepe',
      layers: [{
        options: {
          visible: true,
          type: 'Tiled',
          urlTemplate: 'https://a.tiles.mapbox.com/v4/aj.um7z9lus/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpbG10dnA3NzY3OTZ0dmtwejN2ZnUycjYifQ.1W5oTOnWXQ9R1w8u3Oo1yA',
          attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
          maxZoom: 21,
          minZoom: 0,
          name: 'MapBox Streets Outdoors Global Preview',
          order: 26
        },
        kind: 'tiled',
        infowindow: null,
        tooltip: null,
        id: 'basemap-id-1',
        order: 26
      }, {
        id: 'basemap-id-2',
        infowindow: null,
        kind: 'tiled',
        options: {
          attribution: null,
          className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
          maxZoom: 21,
          minZoom: 0,
          name: 'Custom basemap 29',
          order: 29,
          tms: false,
          type: 'Tiled',
          urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
          visible: true
        },
        order: 29,
        tooltip: null
      }]
    }, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.basemaps = {
      CARTO: {
        positron_rainbow: {
          default: true,
          url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          minZoom: '0',
          maxZoom: '18',
          name: 'Positron (labels below)',
          className: 'positron_rainbow',
          attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
        },
        dark_matter_rainbow: {
          default: false,
          url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          minZoom: '0',
          maxZoom: '18',
          name: 'Dark matter (labels below)',
          className: 'dark_matter_rainbow',
          attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
        }
      },
      Stamen: {
        watercolor: {
          default: false,
          url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          minZoom: '0',
          maxZoom: '18',
          name: 'Watercolor',
          className: 'watercolor_stamen',
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
        }
      }
    };

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo',
        className: 'positron_rainbow'
      }
    });

    this.view = new BasemapContentView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemaps: this.basemaps,
      stackLayoutModel: {},
      userModel: userModel
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(3); // header, source, and select
  });

  it('should update header if baseLayer changes', function () {
    expect(this.view.$('.Editor-HeaderInfo-description').text()).toBe('foo editor.layers.basemap.by CARTO');
    this.view._baseLayer.set({
      name: 'bar',
      category: 'Stamen'
    });
    expect(this.view.$('.Editor-HeaderInfo-description').text()).toBe('bar editor.layers.basemap.by Stamen');
  });

  it('should update select if category changes', function () {
    expect(this.view._categoriesCollection.at(0).get('selected')).toBe(true);
    expect(this.view._categoriesCollection.at(1).get('selected')).toBe(false);
    expect(this.view.$('.Mosaic-item').length).toBe(2);

    this.view._categoriesCollection.at(1).set('selected', true);

    expect(this.view._categoriesCollection.at(0).get('selected')).toBe(false);
    expect(this.view._categoriesCollection.at(1).get('selected')).toBe(true);
    expect(this.view.$('.Mosaic-item').length).toBe(1);
  });

  describe('when selected basemap changes', function () {
    it('should update category', function () {
      expect(this.view._categoriesCollection.getSelected()).toBe('CARTO');
      this._layerDefinitionsCollection.at(0).set('category', 'Stamen');
      expect(this.view._categoriesCollection.getSelected()).toBe('Stamen');
    });

    it('should update userlayers', function () {
      spyOn(this.view._userLayersCollection, 'updateSelected');

      expect(this.view._basemapsCollection.at(0).get('selected')).toBe(true);
      expect(this.view._basemapsCollection.at(1).get('selected')).toBe(false);
      this.view._basemapsCollection.at(1).set('selected', true);
      expect(this.view._userLayersCollection.updateSelected).toHaveBeenCalled();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
