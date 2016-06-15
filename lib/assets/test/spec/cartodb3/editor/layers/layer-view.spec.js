var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-view');

describe('editor/layers/layer-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      kind: 'carto',
      name: 'thename',
      source: 'c0'
    }, {
      configModel: {}
    });

    spyOn(this.model, 'getNumberOfAnalyses').and.returnValue(3);

    this.layerDefinitionsCollection = new Backbone.Collection([]);
    this.layerDefinitionsCollection.getNumberOfDataLayers = jasmine.createSpy('getNumberOfDataLayers');

    this.newAnalysesViewSpy = jasmine.createSpy('newAnalysesView').and.callFake(function (el) {
      var view = new CoreView({
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
      layerDefinitionsCollection: this.layerDefinitionsCollection,
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

  it('should render analysis views', function () {
    expect(this.view.$el.text()).toContain('ANALYSES');

    // Assert args being what's expected too
    expect(this.newAnalysesViewSpy).toHaveBeenCalled();
    expect(this.newAnalysesViewSpy.calls.argsFor(0)[0]).toEqual(this.view.$('.js-analyses'));
    expect(this.newAnalysesViewSpy.calls.argsFor(0)[1]).toEqual(this.model);
  });

  describe('context menu', function () {
    it('should toggle the context-menu box when option is clicked', function () {
      expect(this.view.$el.find('.CDB-Box-modal').length).toBe(0);

      this.view.$('.js-toggle-menu').click();

      expect($('body').find('.CDB-Box-modal').css('display')).toEqual('block');

      this.view.$('.js-toggle-menu').click();

      expect($('body').find('.CDB-Box-modal').length).toBe(0);
    });

    describe('Delete layer…', function () {
      it("should not be posible to delete a layer if there's only one CartoDB or Torque layer", function () {
        this.layerDefinitionsCollection.getNumberOfDataLayers.and.returnValue(1);

        // Show the context menu
        this.view.$('.js-toggle-menu').click();

        expect($('body').find(".CDB-Box-modal button[title='Delete layer…']").length).toEqual(0);
      });

      it("should be posible to delete a layer if there're more than one CartoDB or Torque layers", function () {
        this.layerDefinitionsCollection.getNumberOfDataLayers.and.returnValue(2);

        // Show the context menu
        this.view.$('.js-toggle-menu').click();

        expect($('body').find(".CDB-Box-modal button[title='Delete layer…']").length).toEqual(1);
      });

      it("should destroy the layer when 'Delete layer…' is clicked", function () {
        this.layerDefinitionsCollection.getNumberOfDataLayers.and.returnValue(2);

        // Show the context menu
        this.view.$('.js-toggle-menu').click();

        var deleteLayerMenuItem = $('body').find(".CDB-Box-modal button[title='Delete layer…']");

        spyOn(this.model, 'destroy');

        deleteLayerMenuItem.click();

        expect(this.model.destroy).toHaveBeenCalled();
      });
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

  describe('expanded/collapsed states', function () {
    it('should expand and collapse the layer', function () {
      var expectedAnalysesTextMatcher = /\(2\) Analyses/;

      expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(false);
      expect(this.view.$el.html()).not.toMatch(expectedAnalysesTextMatcher);

      // Show the context menu and collapse the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title=Collapse]').click();

      expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(true);
      expect(this.view.$el.html()).toMatch(expectedAnalysesTextMatcher);

      // Show the context menu and expand the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title=Expand]').click();

      // Show the context menu and expand the layer again
      expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(false);
      expect(this.view.$el.html()).not.toMatch(expectedAnalysesTextMatcher);
    });
  });
});
