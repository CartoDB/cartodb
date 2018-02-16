var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var UserActions = require('builder/data/user-actions');
var StackLayoutModel = require('builder/components/stack-layout/stack-layout-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var ErroredDataLayerView = require('builder/editor/layers/layer-views/errored-data-layer-view');
var StyleDefinitionModel = require('builder/editor/style/style-definition-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/errored-data-layer-view', function () {
  beforeEach(function () {
    spyOn(QueryGeometryModel.prototype, 'fetch');
    spyOn(QuerySchemaModel.prototype, 'fetch');
    spyOn(QueryRowsCollection.prototype, 'fetch');

    this.layerDefinitionsCollection = new Backbone.Collection([]);
    this.layerDefinitionsCollection.save = jasmine.createSpy('save');

    this.modals = FactoryModals.createModalService();

    spyOn(this.modals, 'create');

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
    spyOn(this.model, 'getAnalysisDefinitionNodeModel').and.returnValue(null);
    spyOn(this.model, 'findAnalysisDefinitionNodeModel').and.returnValue(null);

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

    var widgetDefinitionsCollection = new Backbone.Collection();
    widgetDefinitionsCollection.widgetsOwnedByLayer = function () { return 0; };

    var visDefinitionModel = new Backbone.Model();

    this.view = new ErroredDataLayerView({
      modals: this.modals,
      model: this.model,
      userActions: this.userActions,
      stackLayoutModel: this.stackLayoutModel,
      newAnalysesView: this.newAnalysesViewSpy,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: {},
      stateDefinitionModel: {},
      visDefinitionModel: visDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      analysisDefinitionNodesCollection: {}
    });

    spyOn(this.view, '_renameLayer').and.callThrough();

    this.view.$el.appendTo(document.body);
    this.view.render();
  });

  afterEach(function () {
    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    this.view.clean();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title of layer', function () {
    expect(this.view.$el.text()).toContain('table_name');
  });

  it('should not add sortable class', function () {
    expect(this.view.$el.hasClass('js-sortable-item')).toBeFalsy();
  });

  it('should be displayed always', function () {
    expect(this.view.$('.js-thumbnail').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-title').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-analyses-widgets-info').hasClass('is-hidden')).toBe(false);

    this.model.set('visible', false);

    expect(this.view.$('.js-thumbnail').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-title').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(false);
    expect(this.view.$('.js-analyses-widgets-info').hasClass('is-hidden')).toBe(false);
  });

  it('should contain is-errored class', function () {
    expect(this.view.$el.hasClass('is-errored')).toBeTruthy();
  });

  it('should render the broken node', function () {
    expect(this.view.$('.js-analyses > li').size()).toBe(1);
    expect(this.view.$('.Editor-ListAnalysis-itemInfo .CDB-Text').text()).toContain('a0');
    expect(this.view.$('.Editor-ListAnalysis-title').text()).toContain('editor.layers.errors.broken-node');
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
      it('should be posible to delete the layer', function () {
        this.view.$('.js-toggle-menu').click();
        expect($('body').find(".CDB-Box-modal button[title='editor.layers.options.delete-and-reload']").length).toEqual(1);
      });

      it('should reload the map when layer is removed', function () {
        this.view.$('.js-toggle-menu').click();
        spyOn(this.view, '_reloadApplication');
        $('body').find(".CDB-Box-modal button[title='editor.layers.options.delete-and-reload']").click();
        this.model.trigger('destroy', this.model);
        expect(this.view._reloadApplication).toHaveBeenCalled();
      });
    });
  });
});
