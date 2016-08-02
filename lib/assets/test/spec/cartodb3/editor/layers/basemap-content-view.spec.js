var BasemapContentView = require('../../../../../javascripts/cartodb3/editor/layers/basemap-content-view');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var _ = require('underscore-cdb-v3');
var CustomBaselayersCollection = require('../../../../../javascripts/cartodb3/data/custom-baselayers-collection');

describe('editor/layers/basemap-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.basemaps = {
      CARTO: {
        positron_rainbow: {
          className: 'positron_rainbow',
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
        },
        dark_matter_rainbow: {
          className: 'dark_matter_rainbow',
          url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
        }
      },
      Stamen: {
        watercolor: {
          className: 'watercolor_stamen',
          url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
        }
      },
      Here: {
        nokia_day: {
          className: 'nokia_day',
          url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token='
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
        className: 'positron_rainbow',
        category: 'CARTO'
      }
    });

    this.layers = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: ''
      }
    }, {
      id: 'basemap-id-2',
      options: {
        urlTemplate: ''
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.view = new BasemapContentView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemaps: this.basemaps,
      stackLayoutModel: {},
      customBaselayersCollection: this.layers
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
      expect(this.view._categoriesCollection.getSelected().getName()).toBe('CARTO');
      this.view._layerDefinitionsCollection.at(0).set('category', 'Here');
      expect(this.view._categoriesCollection.getSelected().getName()).toBe('Here');
      this.view._layerDefinitionsCollection.at(0).set('category', 'Stamen');
      expect(this.view._categoriesCollection.getSelected().getName()).toBe('Stamen');
    });

    it('should update userlayers if basemap has Id', function () {
      spyOn(this.view._customBaselayersCollection, 'updateSelected');

      expect(this.view._basemapsCollection.at(0).get('selected')).toBe(true);
      expect(this.view._basemapsCollection.at(1).get('selected')).toBe(false);
      this.view._basemapsCollection.at(1).set('selected', true);
      expect(this.view._customBaselayersCollection.updateSelected).toHaveBeenCalledWith(null);
      this.view._customBaselayersCollection.updateSelected.calls.reset();
      this.view._basemapsCollection.at(5).set('selected', true);
      expect(this.view._customBaselayersCollection.updateSelected).toHaveBeenCalledWith('basemap-id-2');
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
