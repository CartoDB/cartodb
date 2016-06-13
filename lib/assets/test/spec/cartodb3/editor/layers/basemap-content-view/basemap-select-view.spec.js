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

    this.collection = new MosaicCollection([{
      default: true,
      url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Positron (labels below)',
      className: 'positron_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://cartodb.com/attributions">CartoDB</a>',
      category: 'CartoDB',
      selected: true,
      val: 'positron_rainbow',
      label: 'Positron',
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
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://cartodb.com/attributions">CartoDB</a>',
      category: 'CartoDB',
      selected: false,
      val: 'dark_matter_rainbow',
      label: 'Positron',
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

    this.view = new BasemapSelectView({
      basemapsCollection: this.collection,
      selectedCategoryVal: 'CartoDB',
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._filteredBasemapsCollection.length).toBe(2);
    expect(this.view.$('.Mosaic-item').length).toBe(2);
  });

  it('should show form if selectedCategoryVal is "Plain"', function () {
    expect(this.view._filteredBasemapsCollection.length).toBe(2);
    expect(this.view.$('.Mosaic-item').length).toBe(2);

    this.view.selectedCategoryVal = 'Color';

    debugger;
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
