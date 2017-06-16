/*

describe('legends', function () {
  beforeEach(function () {
    this.cdbLayer = createFakeLayer({ id: 'layer-id' });

    this.layerDefinitionsCollection.resetByLayersData({
      id: 'layer-id',
      kind: 'carto',
      options: {
        table_name: 'infowindow_stuff',
        cartocss: ''
      }
    });

    var vizJSON = {
      options: {
        scrollwheel: false
      },
      layers: [
        {
          id: 'layer-id',
          type: 'CartoDB',
          legends: [
            {
              type: 'bubble',
              title: 'My Bubble Legend',
              definition: {
                color: '#FABADA'
              }
            },
            {
              type: 'choropleth',
              title: 'My Choropleth Legend',
              prefix: 'prefix',
              sufix: 'sufix'
            }
          ]
        }
      ]
    };

    this.legendDefinitionsCollection.resetByData(vizJSON);

    this.bubble = jasmine.createSpyObj('bubble', ['show', 'hide', 'set', 'reset']);
    this.choropleth = jasmine.createSpyObj('choropleth', ['show', 'hide', 'set', 'reset']);
    spyOn(DeepInsightsIntegrations.prototype, '_linkLayerErrors');

    spyOn(DeepInsightsIntegrations.prototype, '_getLayer').and.returnValue({
      legends: {
        bubble: this.bubble,
        choropleth: this.choropleth
      }
    });

    spyOn(LegendDefinitionModel.prototype, 'save');

    var mapModeModel = new MapModeModel();
    var configModel = new ConfigModel({
      base_url: 'pepito'
    });

    this.integrations2 = new DeepInsightsIntegrations({
      userModel: new Backbone.Model(),
      onboardings: createOnboardings(),
      deepInsightsDashboard: createFakeDashboard([ this.cdbLayer ]),
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      stateDefinitionModel: this.stateDefinitionModel,
      overlayDefinitionsCollection: this.overlaysCollection,
      visDefinitionModel: this.visDefinitionModel,
      mapDefinitionModel: this.mapDefinitionModel,
      editorModel: this.editorModel,
      mapModeModel: mapModeModel,
      configModel: configModel,
      editFeatureOverlay: new Backbone.View()
    });
  });

  it('should hide legend when a legend def model deleted', function () {
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    var legendDedfModel = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'choropleth');
    this.legendDefinitionsCollection.remove(legendDedfModel);
    expect(this.choropleth.hide).toHaveBeenCalled();
  });

  it('should update legend when a legend def model update', function () {
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    var legendDedfModel = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'choropleth');
    legendDedfModel.setAttributes({title: 'Wadus'});
    expect(this.choropleth.set).toHaveBeenCalled();
  });
});


*/
