var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var BasemapSelectView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-select-view');
var MosaicCollection = require('../../../../../../javascripts/cartodb3/components/mosaic/mosaic-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/basemap-content-views/basemap-select-view-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      basemaps: {
        CartoDB: {
          positron_rainbow: {
            default: true
          }
        },
        Stamen: {
          watercolor: {}
        }
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo'
      }
    });

    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename'
    }, {
      configModel: {}
    });

    this.collection = new MosaicCollection([{
      urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      selected: true,
      val: 'positron_rainbow',
      label: 'Positron',
      template: function () {
        return 'positron_rainbow';
      }
    }, {
      urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
      selected: false,
      val: 'positron_rainbow',
      label: 'Positron',
      template: function () {
        return 'positron_rainbow';
      }
    }]);

    this.view = new BasemapSelectView({
      filteredBasemapsCollection: this.collection,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._filteredBasemapsCollection.length).toBe(2);
    expect(this.view.$('.Mosaic-item').length).toBe(2);
  });

  it('should update select if filteredBasemapsCollection changes', function () {
    expect(this.view._filteredBasemapsCollection.length).toBe(2);
    expect(this.view.$('.Mosaic-item').length).toBe(2);

    this.view._filteredBasemapsCollection = new MosaicCollection([{
      urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
      selected: true,
      val: 'watercolor_stamen',
      label: 'Watercolor',
      template: function () {
        return 'watercolor_stamen';
      }
    }]);

    this.view.render();

    expect(this.view._filteredBasemapsCollection.length).toBe(1);
    expect(this.view.$('.Mosaic-item').length).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
