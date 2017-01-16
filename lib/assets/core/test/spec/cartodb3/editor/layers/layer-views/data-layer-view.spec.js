var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');
var StackLayoutModel = require('../../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var DataLayerView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-views/data-layer-view');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var StyleDefinitionModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');

describe('editor/layers/data-layer-view', function () {
  beforeEach(function () {
    this.layerDefinitionsCollection = new Backbone.Collection([]);
    this.layerDefinitionsCollection.save = jasmine.createSpy('save');

    this.modals = {
      create: function () {}
    };

    spyOn(this.modals, 'create');

    var a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    this.model = new LayerDefinitionModel({
      id: 'layer-A',
      name: 'table_name',
      letter: 'a',
      source: 'a0',
      visible: true
    }, {
      configModel: {},
      collection: this.layerDefinitionsCollection
    });
    this.model.styleModel = new StyleDefinitionModel({}, {
      configModel: {}
    });
    spyOn(this.model, 'canBeDeletedByUser');
    spyOn(this.model, 'getNumberOfAnalyses').and.returnValue(3);
    spyOn(this.model, 'getAnalysisDefinitionNodeModel').and.returnValue(a0);
    a0.queryGeometryModel.set('simple_geom', 'polygon');
    this.queryGeometryModel = a0.queryGeometryModel;

    var c2 = new AnalysisDefinitionNodeModel({
      id: 'c2',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });
    spyOn(this.model, 'findAnalysisDefinitionNodeModel').and.returnValue(c2);

    this.stackLayoutModel = new StackLayoutModel(null, {stackLayoutItems: {}});
    spyOn(this.stackLayoutModel, 'nextStep');

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

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveLayer').and.returnValue(this.promise);

    this.view = new DataLayerView({
      modals: this.modals,
      model: this.model,
      userActions: this.userActions,
      stackLayoutModel: this.stackLayoutModel,
      newAnalysesView: this.newAnalysesViewSpy,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: {},
      stateDefinitionModel: {}
    });

    spyOn(this.view, '_renameLayer').and.callThrough();

    this.view.$el.appendTo(document.body);
    this.view.render();
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title of layer', function () {
    expect(this.view.$el.text()).toContain('table_name');
  });

  it('should add sortable class', function () {
    expect(this.view.$el.hasClass('js-sortable-item')).toBeTruthy();
  });

  it('should be displayed as hidden when layer is hidden', function () {
    expect(this.view.$('.js-thumbnail').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-title').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(false);

    this.model.set('visible', false);

    expect(this.view.$('.js-thumbnail').hasClass('is-hidden')).toBe(true);
    expect(this.view.$('.js-title').hasClass('is-hidden')).toBe(true);
    expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(true);
  });

  it('should be with errors when layer has errors', function () {
    expect(this.view.$('.js-error').length).toBe(0);
    this.model.set('error', 'an error');
    expect(this.view.$('.js-error').length).toBe(1);
  });

  it('should not add js-sortable-item class if layer is torque', function () {
    this.model.set('type', 'torque');
    this.view.render();
    expect(this.view.$el.hasClass('js-sortable-item')).toBeFalsy();
    expect(this.view.$el.hasClass('is-animated')).toBeTruthy();
  });

  describe('when layer has an analysis', function () {
    it('should render analysis views', function () {
      expect(this.view.$el.text()).toContain('ANALYSES');

      // Assert args being what's expected too
      expect(this.newAnalysesViewSpy).toHaveBeenCalled();
      expect(this.newAnalysesViewSpy.calls.argsFor(0)[0]).toEqual(this.view.$('.js-analyses'));
      expect(this.newAnalysesViewSpy.calls.argsFor(0)[1]).toEqual(this.model);
    });
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
      it('should not be posible to delete a layer if canBeDeletedByUser return false', function () {
        this.model.canBeDeletedByUser.and.returnValue(false);

        this.view.$('.js-toggle-menu').click();
        expect($('body').find(".CDB-Box-modal button[title='editor.layers.options.delete']").length).toEqual(0);
      });

      it('should be posible to delete a layer if canBeDeletedByUser', function () {
        this.model.canBeDeletedByUser.and.returnValue(true);

        this.view.$('.js-toggle-menu').click();
        expect($('body').find(".CDB-Box-modal button[title='editor.layers.options.delete']").length).toEqual(1);
      });
    });
  });

  describe('when title is clicked', function () {
    beforeEach(function () {
      jasmine.clock().install();
      this.view.$('.js-title').click();
      jasmine.clock().tick(300);
    });

    it('should edit layer', function () {
      expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layer-content');
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });
  });

  describe('when title is doubleclicked', function () {
    beforeEach(function () {
      jasmine.clock().install();
      this.view.$('.js-title').click();
      this.view.$('.js-title').click();
      jasmine.clock().tick(300);
    });

    it('should show inline editor', function () {
      expect(this.view.$('.js-input').is(':visible')).toBe(true);
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });
  });

  describe('when thumbnail is clicked', function () {
    beforeEach(function () {
      this.view.$('.js-thumbnail').click();
    });

    it('should edit layer', function () {
      expect(this.stackLayoutModel.nextStep).toHaveBeenCalled();
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.stackLayoutModel.nextStep.calls.argsFor(0)[1]).toEqual('layer-content');
    });
  });

  describe('when the toggle icon is clicked', function () {
    beforeEach(function () {
      this.model.set({autoStyle: 'foo'});
    });

    it('should toggle the layer', function () {
      this.view.$('.js-toggle').click();

      expect(this.model.get('visible')).toEqual(false);
      expect(this.userActions.saveLayer).toHaveBeenCalled();
      expect(this.userActions.saveLayer.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.userActions.saveLayer.calls.argsFor(0)[1]).toEqual({
        shouldDisableAutoStyle: false
      });
      expect(this.model.get('autoStyle')).toEqual('foo');

      this.userActions.saveLayer.calls.reset();
      this.view.$('.js-toggle').click();
      expect(this.model.get('visible')).toEqual(true);
      expect(this.userActions.saveLayer).toHaveBeenCalled();
      expect(this.userActions.saveLayer.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.userActions.saveLayer.calls.argsFor(0)[1]).toEqual({
        shouldDisableAutoStyle: false
      });
      expect(this.model.get('autoStyle')).toEqual('foo');
    });
  });

  describe('expanded/collapsed states', function () {
    it('should expand and collapse the layer', function () {
      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(false);
      expect(this.view.$el.html()).not.toContain('editor.layers.layer.analyses-count');

      // Show the context menu and collapse the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title="editor.layers.options.collapse"]').click();

      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(true);
      expect(this.view.$el.html()).toContain('editor.layers.layer.analyses-count');

      // Show the context menu and expand the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title="editor.layers.options.expand"]').click();

      // Show the context menu and expand the layer again
      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(false);
      expect(this.view.$el.html()).not.toContain('editor.layers.layer.analyses-count');
    });
  });

  describe('rename layer', function () {
    it('should rename the layer', function () {
      // Show the context menu and collapse the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title="editor.layers.options.rename"]').click();

      expect(this.view.$('.js-input').is(':visible')).toBe(true);
      this.view.$('.js-input').val('Foo');

      var e = $.Event('keyup');
      e.which = 13;
      this.view.$('.js-input').trigger(e);

      expect(this.model.get('table_name_alias')).toBe('Foo');
      expect(this.userActions.saveLayer).toHaveBeenCalledWith(this.model);
    });
  });

  describe('geometry type', function () {
    it('should show polygon svg', function () {
      expect(this.view.$('svg').length).toBe(1);
      expect(this.view.$('svg circle').length).toBe(4);
    });
  });

  describe('._showContextMenu', function () {
    it('should show center map option if geom and clicking on it should call _centerMap', function () {
      spyOn(this.view, '_centerMap');
      this.view._showContextMenu();

      expect(this.view._menuView.$('button[title^="editor.layers.options.center-map"]').length).toBe(1);

      this.view._menuView.$('button[title^="editor.layers.options.center-map"]').click();
      expect(this.view._centerMap).toHaveBeenCalled();
    });

    it('should not show center map option if no geom', function () {
      this.queryGeometryModel.set('simple_geom', '');
      this.view._showContextMenu();

      expect(this.view._menuView.$('button[title^="editor.layers.options.center-map"]').length).toBe(0);

      this.queryGeometryModel.set('simple_geom', 'polygon');
    });
  });

  describe('._centerMap', function () {
    it('should call to zoomToData with query from queryGeometryModel', function () {
      var theView = this.view;
      this.queryGeometryModel.set('simple_geom', '');

      // The only way we have to know if zoomToData has been called is to provoke an
      // error. This way we know that the query has been extracted from our querySchemaModel
      // and that zoomToData has been called.
      expect(function () {
        theView._centerMap();
      }).toThrowError('query is required');

      this.queryGeometryModel.set('simple_geom', 'polygon');
    });
  });
});
