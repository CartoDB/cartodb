var BasemapSelectView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-select-view');
var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/basemap-content-views/basemap-select-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });

    this.collection = new BasemapsCollection([{
      default: true,
      url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Positron (labels below)',
      className: 'positron_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
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
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
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
    }]);

    this.collection.add({
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
      parse: true,
      silent: true
    });

    this.collection.add({
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
    }, {
      parse: true,
      silent: true
    });
  });

  it('should render properly', function () {
    this.view = new BasemapSelectView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: this.collection,
      selectedCategoryVal: 'CARTO'
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
        basemapsCollection: this.collection,
        selectedCategoryVal: 'Here'
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(1);
    });

    it('should render mosaic if category is Stamen', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.collection,
        selectedCategoryVal: 'Stamen'
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Mosaic-item').length).toBe(1);
    });

    it('should render mosaic if category is Custom', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.collection,
        selectedCategoryVal: 'Custom'
      });
      this.view.render();

      // mapbox go under custom by now
      expect(this.view._filteredBasemapsCollection.length).toBe(2);
      expect(this.view.$('.Mosaic-item').length).toBe(2);
    });

    // it('should render mosaic if category is Mapbox', function () {
    //   this.view = new BasemapSelectView({
    //     layerDefinitionsCollection: this.layerDefinitionsCollection,
    //     basemapsCollection: this.collection,
    //     selectedCategoryVal: 'Mapbox'
    //   });
    //   this.view.render();

    //   expect(this.view._filteredBasemapsCollection.length).toBe(1);
    //   expect(this.view.$('.Mosaic-item').length).toBe(1);
    // });

    it('should render form if category is Color', function () {
      this.view = new BasemapSelectView({
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        basemapsCollection: this.collection,
        selectedCategoryVal: 'Color'
      });
      this.view.render();

      expect(this.view._filteredBasemapsCollection.length).toBe(1);
      expect(this.view.$('.Form-InputFill').length).toBe(1);
    });
  });
});
