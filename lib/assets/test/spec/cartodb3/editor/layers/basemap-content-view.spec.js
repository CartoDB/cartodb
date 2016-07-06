var BasemapContentView = require('../../../../../javascripts/cartodb3/editor/layers/basemap-content-view');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var _ = require('underscore-cdb-v3');

describe('editor/layers/basemap-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.basemaps = {
      CartoDB: {
        positron_rainbow: {
          default: true
        },
        dark_matter_rainbow: {}
      },
      Stamen: {
        watercolor: {}
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
        table_name: 'foo'
      }
    });

    this.view = new BasemapContentView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemaps: this.basemaps,
      stackLayoutModel: {}
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(3); // header, source, and select
  });

  it('should update header if baseLayer changes', function () {
    expect(this.view.$('.Editor-HeaderInfo-description').text()).toBe('foo editor.layers.basemap.by CartoDB');
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

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
