var cdb = require('cartodb.js');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisFormView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analysis-form-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var createDefaultVis = require('../../../create-default-vis');

describe('editor/layers/layer-content-view/analyses-form-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vis = createDefaultVis();

    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection([
      {
        id: 'xyz123',
        analysis_definition: {
          id: 'a1',
          type: 'trade-area',
          params: {
            kind: 'walk',
            time: '100',
            source: {
              id: 'a0',
              type: 'source',
              params: {
                query: 'SELECT * FROM foo'
              }
            }
          }
        }
      }
    ], {
      configModel: configModel,
      analysis: vis.analysis,
      vizId: 'v-123'
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        source: 'a1',
        letter: 'a'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.viewModel = new cdb.core.Model({
      selectedNodeId: 'a1'
    });
    spyOn(AnalysisFormView.prototype, 'render');
    this.view = new AnalysisFormView({
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      viewModel: this.viewModel
    });
    this.view.render();
  });

  it('should render when selectedNodeId changes', function () {
    this.viewModel.set('selectedNodeId', 'a0');
    expect(this.view.render).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
