var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var AnalysesWorkflowItemView = require('builder/editor/layers/layer-content-views/analyses/analyses-workflow-item-view');
var Router = require('builder/routes/router');

describe('editor/layers/layer-content-view/analyses/analyses-workflow-item-view', function () {
  var view, analysisNode;
  var nodeId = 'a2';

  var createViewFn = function (options) {
    spyOn(Router, 'navigate');

    analysisNode = new AnalysisDefinitionNodeModel({
      id: nodeId,
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    view = new AnalysesWorkflowItemView({
      selectedNodeId: nodeId,
      analysisNode: analysisNode,
      layerId: 'l-1'
    });

    return view;
  };

  describe('.render', function () {
    it('should render propertly', function () {
      view = createViewFn();
      view.render();

      expect(view.$el.html()).toContain(nodeId);
      expect(view.$el.html()).toContain('analyses.area-of-influence.title');
      expect(_.size(view._subviews)).toBe(0); // No tooltip if it's selected
    });

    it('should not have any leaks', function () {
      view = createViewFn();
      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  describe('when is not selected', function () {
    beforeEach(function () {
      view = createViewFn();
      view._selectedNodeId = 'a0';
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

  describe('._onNodeClick', function () {
    it('should call Router.goToAnalysisNode', function () {
      spyOn(Router, 'goToAnalysisNode');
      view = createViewFn();

      view._onNodeClick();

      expect(Router.goToAnalysisNode).toHaveBeenCalledWith('l-1', nodeId);
    });
  });
});
