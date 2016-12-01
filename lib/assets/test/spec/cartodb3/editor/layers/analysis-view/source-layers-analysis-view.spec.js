var Backbone = require('backbone');
var SourceLayerAnalysisView = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/source-layer-analysis-view');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('editor/layers/analysis-views/source-layer-analysis-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      table_name: 'foo_bar',
      params: {
        query: 'SELECT * FROM foo_bar'
      }
    }], {
      configModel: configModel
    });
    this.sourceAnalysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get('a0');
    this.layerDefinitionModel = new Backbone.Model({user_name: 'somebody'});
    this.layerDefinitionModel.getQualifiedTableName = function () {};
  });

  beforeEach(function () {
    this.view = new SourceLayerAnalysisView({
      model: this.sourceAnalysisDefinitionNodeModel,
      analysisNode: this.sourceAnalysisDefinitionNodeModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('a0');
    expect(this.view.$el.text()).toContain('foo_bar');
  });
});
