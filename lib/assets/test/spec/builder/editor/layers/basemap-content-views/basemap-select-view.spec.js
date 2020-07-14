var BasemapSelectView = require('builder/editor/layers/basemap-content-views/basemap-select-view');
var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/basemap-content-views/basemap-select-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });

    this.basemapsCollection = new BasemapsCollection([{
      default: true,
      url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Positron (labels below)',
      className: 'positron_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>',
      category: 'CARTO',
      selected: true,
      val: 'positron_rainbow',
      label: 'Positron (labels below)',
      template: function () {
        return 'positron_rainbow';
      }
    }, {
      default: false,
      url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Dark matter (labels below)',
      className: 'dark_matter_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>',
      category: 'CARTO',
      selected: false,
      val: 'dark_matter_rainbow',
      label: 'Dark matter (labels below)',
      template: function () {
        return 'dark_matter_rainbow';
      }
    }, {
      default: false,
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Watercolor',
      className: 'watercolor_stamen',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
      category: 'Stamen',
      selected: false,
      val: 'watercolor_stamen',
      label: 'Watercolor',
      template: function () {
        return 'watercolor_stamen';
      }
    }, {
      default: false,
      url: '://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: '0',
      maxZoom: '20',
      name: 'Nokia Day',
      className: 'nokia_day',
      attribution: 'Map&copy;2016 HERE <a href="http://here.net/services/terms" target="_blank">Terms of use</a>',
      category: 'Here',
      selected: false,
      val: 'nokia_day',
      label: 'Nokia Day',
      template: function () {
        return 'nokia_day';
      }
    }, {
      default: false,
      color: '#ff6600',
      image: '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: false,
      val: 'plain',
      label: 'plain',
      template: function () {
        return 'plain';
      }
    }, {
      id: 'basemap-id-1',
      urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      minZoom: 0,
      maxZoom: 21,
      name: 'Custom basemap 1',
      className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
      attribution: null,
      category: 'Custom',
      selected: false,
      val: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
      default: false,
      subdomains: '',
      labels: null,
      type: 'Tiled'
    }, {
      id: 'basemap-id-2',
      urlTemplate: 'https://a.tiles.mapbox.com/v4/username.12ab45c/{z}/{x}/{y}.png?access_token=aBcDC12323abc',
      minZoom: 0,
      maxZoom: 21,
      name: 'MapBox Streets Outdoors Global Preview',
      className: 'httpsatilesmapboxcomv4username12ab45czxypngaccess_tokenaBcDC12323abc',
      attribution: '<a href=\'https://www.mapbox.com/about/maps/\' target=\'_blank\'>&copy; Mapbox &copy; OpenStreetMap</a> <a class=\'mapbox-improve-map\' href=\'https://www.mapbox.com/map-feedback/\' target=\'_blank\'>Improve this map</a>',
      category: 'Mapbox',
      selected: false,
      val: 'httpsatilesmapboxcomv4username12ab45czxypngaccess_tokenaBcDC12323abc',
      label: 'MapBox Streets Outdoors Global Preview',
      default: false,
      subdomains: '',
      labels: null,
      type: 'Tiled',
      highlighted: false
    }]);

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: '',
        category: 'Custom'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should render properly', function () {
    this.view = new BasemapSelectView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: this.basemapsCollection,
      selectedCategoryVal: 'CARTO',
      customBaselayersCollection: this.customBaselayersCollection,
      modals: FactoryModals.createModalService()
    });
    this.view.render();

    expect(this.view._filteredBasemapsCollection.length).toBe(2);
    expect(this.view.$('.Mosaic-item').length).toBe(2);
  });

  describe('select', function () {
    afterEach(function () {
      this.view.clean();
    });

    it('should render mosaic if category is CARTO, or Here', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.basemapsCollection,
        selectedCategoryVal: 'Here',
        customBaselayersCollection: this.customBaselayersCollection,
        modals: FactoryModals.createModalService()
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(1);
    });

    it('should render mosaic if category is Stamen', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.basemapsCollection,
        selectedCategoryVal: 'Stamen',
        customBaselayersCollection: this.customBaselayersCollection,
        modals: FactoryModals.createModalService()
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(1);
    });

    it('should render mosaic if category is Custom', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.basemapsCollection,
        selectedCategoryVal: 'Custom',
        customBaselayersCollection: this.customBaselayersCollection,
        modals: FactoryModals.createModalService()
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(2); // Custom basemap and "Add basemap" button
    });

    it('should render mosaic if category is Mapbox', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.basemapsCollection,
        selectedCategoryVal: 'Mapbox',
        customBaselayersCollection: this.customBaselayersCollection,
        modals: FactoryModals.createModalService()
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(2); // Mapbox basemap and "Add basemap" button
    });

    it('should render form if category is Color', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.basemapsCollection,
        selectedCategoryVal: 'Color',
        customBaselayersCollection: this.customBaselayersCollection,
        modals: FactoryModals.createModalService()
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Form-InputFill').length).toBe(1);
    });
  });
});
