var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var AnalysesWorkflowItemView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-workflow-item-view');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-item-view', function () {
  var view, model, analysisNode;
  var nodeId = 'a2';

  var createViewFn = function (options) {
    model = new Backbone.Model({
      selectedNodeId: nodeId
    });

    analysisNode = new AnalysisDefinitionNodeModel({
      id: nodeId,
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    view = new AnalysesWorkflowItemView({
      model: model,
      analysisNode: analysisNode
    });

    return view;
  };

  describe('.render', function () {
    it('should render propertly', function () {
      view = createViewFn();
      view.render();

      expect(view.$el.html()).toContain(nodeId);
      expect(view.$el.html()).toContain('analyses.area-of-influence.short-title');
      expect(_.size(view._subviews)).toBe(0); // No tooltip if it's selected
    });
  });

  describe('when is not selected', function () {
    beforeEach(function () {
      view = createViewFn();
      model.set('selectedNodeId', 'a0');
      view.render();
    });

    describe('.render', function () {
      it('should render propertly', function () {
        expect(_.size(view._subviews)).toBe(1); // [Tooltip]
      });
    });
  });

  describe('when is new', function () {
    beforeEach(function () {
      view = createViewFn();
      analysisNode = undefined;
      view.render();
    });

    describe('.render', function () {
      it('should render propertly', function () {
        expect(_.size(view._subviews)).toBe(0); // No tooltip if it's new
      });
    });
  });

  it('should not have any leaks', function () {
    view = createViewFn();
    view.render();

    expect(view).toHaveNoLeaks();
  });
});
