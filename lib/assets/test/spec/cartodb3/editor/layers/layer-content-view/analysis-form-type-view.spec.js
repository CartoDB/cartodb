var _ = require('underscore');
var AnalysisFormTypeView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/analysis-form-type-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/layer-content-view/analyses-form-type-view', function () {
  beforeEach(function () {
    // "Removed" debounce for not conflict with tests
    spyOn(_, 'debounce').and.callFake(function (func) {
      return func;
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.sqlAPI = new cdb.SQL({
      user: 'pepe'
    });
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: this.sqlAPI,
      configModel: {}
    });

    this.model = this.analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'trade-area',
      params: {
        kind: 'walk',
        time: 100,
        source: {
          id: 'a0',
          type: 'source',
          table_name: 'foo',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      }
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    });

    this.view = new AnalysisFormTypeView({
      analysisDefinitionNodeModel: this.model,
      layerDefinitionModel: this.layerDefinitionModel
    });
    this.view.render();
  });

  it('should render a form properly', function () {
    expect(this.view.$('form').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(0);
  });

  it('should update model if there is any form change', function () {
    expect(this.model.get('time')).toBe(100);
    var $timeInput = this.view.$('.js-input:eq(0)');
    $timeInput.val(10);
    $timeInput.trigger('keyup');
    expect(this.model.get('time')).toBe(10);
    expect(this.model.get('kind')).toBe('walk');
  });

  it('should remove form when view is cleaned', function () {
    spyOn(this.view._analysisFormView, 'remove');
    this.view.clean();
    expect(this.view._analysisFormView.remove).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
