var cdb = require('cartodb.js');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-view');

describe('editor/layers/layer-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename',
      source: 'c0'
    }, {
      configModel: {}
    });
    this.newAnalysesViewSpy = jasmine.createSpy('newAnalysesView').and.callFake(function (el) {
      var view = new cdb.core.View({
        el: el
      });
      view.render = function () {
        this.$el.html('ANALYSES');
        return this;
      };
      return view;
    });

    this.stackLayoutModel = new StackLayoutModel(null, {stackLayoutItems: {}});
    spyOn(this.stackLayoutModel, 'nextStep');

    this.view = new LayerView({
      model: this.model,
      newAnalysesView: this.newAnalysesViewSpy,
      stackLayoutModel: this.stackLayoutModel
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title of layer', function () {
    expect(this.view.$el.text()).toContain('thename');
  });

  it('should open context-menu box when option is clicked', function () {
    spyOn(this.view._menuView, 'toggle');
    this.view.$('.js-show-menu').click();
    expect(this.view._menuView.toggle).toHaveBeenCalled();
  });

  it('should render analysis views', function () {
    expect(this.view.$el.text()).toContain('ANALYSES');

    // Assert args being what's expected too
    expect(this.newAnalysesViewSpy).toHaveBeenCalled();
    expect(this.newAnalysesViewSpy.calls.argsFor(0)[0]).toEqual(this.view.$('.js-analyses'));
    expect(this.newAnalysesViewSpy.calls.argsFor(0)[1]).toEqual(this.model);
  });

  describe('draggable', function () {
    it('should be initialized when view is rendered', function () {
      spyOn(this.view, '_initDraggable').and.callThrough();
      this.view.render();
      expect(this.view.$el.data('ui-draggable')).toBeDefined();
    });
  });

  describe('droppable', function () {
    it('should be initialized when view is rendered', function () {
      spyOn(this.view, '_initDroppable').and.callThrough();
      this.view.render();
      expect(this.view.$el.data('ui-droppable')).toBeDefined();
    });
  });

  describe('context menu', function () {
    it("should destroy the layer when 'Delete layer…' is clicked", function () {
      var contextMenu = this.view.$el.find('.CDB-Box-modal');
      var deleteLayerMenuItem = contextMenu.find("button[title='Delete layer…']");
      spyOn(this.model, 'destroy');

      deleteLayerMenuItem.click();

      expect(this.model.destroy).toHaveBeenCalled();
    });
  });

  describe('when is clicked', function () {
    beforeEach(function () {
      this.view.$('.js-title').click();
    });

    it('should edit layer', function () {
      expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layer-content');
    });
  });

  describe('when a node is clicked', function () {
    beforeEach(function () {
      this.view.$el.click();
      this.view._onNodeClicked({id: 'a1'});
    });

    it('should edit layer', function () {
      expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layer-content');
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[2]).toEqual('a1');
    });
  });
});
