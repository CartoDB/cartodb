var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var UserActions = require('builder/data/user-actions');
var UserModel = require('builder/data/user-model');
var StackLayoutModel = require('builder/components/stack-layout/stack-layout-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var DataLayerView = require('builder/editor/layers/layer-views/data-layer-view');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var StyleDefinitionModel = require('builder/editor/style/style-definition-model');
var FactoryModals = require('../../../factories/modals');
var Router = require('builder/routes/router');
var getLayerDefinitionModelFixture = require('fixtures/builder/layer-definition-model.fixture.js');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var fakePromise = require('fixtures/builder/fake-promise.fixture.js');
var ajaxFixtures = require('fixtures/builder/ajax-fixtures.js');

describe('editor/layers/data-layer-view', function () {
  var geometryModelFakePromise = null;
  var canBeGeoreferencedPromise = null;
  var isLayerEmptyPromise = null;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(ajaxFixtures.querySchemaModel.url.http)
      .andReturn(ajaxFixtures.querySchemaModel.response.ok);
    jasmine.Ajax.stubRequest(ajaxFixtures.queryGeometryModel.url.http)
      .andReturn(ajaxFixtures.queryGeometryModel.response.ok);
    jasmine.Ajax.stubRequest(ajaxFixtures.queryRowsCollection.url.http)
      .andReturn(ajaxFixtures.queryRowsCollection.response.ok);

    this.modals = FactoryModals.createModalService();

    spyOn(this.modals, 'create');

    var configModel = getConfigModelFixture();

    var userModel = new UserModel({
      username: 'pepe',
      quota: {}
    }, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'buffer',
      params: {}
    }, {
      configModel: configModel
    });
    this.analysisDefinitionNodesCollection.add(this.a0);

    this.model = getLayerDefinitionModelFixture({
      configModel: configModel
    });
    this.model.findAnalysisDefinitionNodeModel = function () {};

    canBeGeoreferencedPromise = fakePromise(this.model, 'canBeGeoreferenced');
    isLayerEmptyPromise = fakePromise(this.model, 'isEmptyAsync');

    this.layerDefinitionsCollection = this.model.collection;
    this.layerDefinitionsCollection.findAnalysisDefinitionNodeModel = function () {};

    this.model.styleModel = new StyleDefinitionModel({}, {
      configModel: configModel
    });
    spyOn(this.model, 'canBeDeletedByUser');
    spyOn(this.model, 'getNumberOfAnalyses').and.returnValue(3);
    spyOn(this.model, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.a0.queryGeometryModel.set('simple_geom', 'polygon');
    this.queryGeometryModel = this.a0.queryGeometryModel;
    geometryModelFakePromise = fakePromise(this.queryGeometryModel, 'hasValueAsync');

    this.c2 = new AnalysisDefinitionNodeModel({
      id: 'c2',
      type: 'buffer',
      params: {}
    }, {
      configModel: configModel
    });
    this.analysisDefinitionNodesCollection.add(this.c2);
    spyOn(this.model, 'findAnalysisDefinitionNodeModel').and.returnValue(this.c2);

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

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.widgetDefinitionsCollection.widgetsOwnedByLayer = function () { return 0; };

    this.visDefinitionModel = new Backbone.Model();

    this.view = new DataLayerView({
      modals: this.modals,
      model: this.model,
      userActions: this.userActions,
      stackLayoutModel: this.stackLayoutModel,
      newAnalysesView: this.newAnalysesViewSpy,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: configModel,
      stateDefinitionModel: {},
      visDefinitionModel: this.visDefinitionModel,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
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
    jasmine.Ajax.uninstall();
  });

  describe('_initialize', function () {
    it('initial values used in .render have the proper value', function () {
      expect(this.view._viewState.get('needsGeocoding')).toBe(false);
      expect(this.view._viewState.get('isLayerEmpty')).toBe(false);
      expect(this.view._viewState.get('queryGeometryHasGeom')).toBe(true);
    });

    it('should call _setViewState', function () {
      expect(geometryModelFakePromise.hasBeenCalled()).toBe(true);
      expect(canBeGeoreferencedPromise.hasBeenCalled()).toBe(true);
      expect(isLayerEmptyPromise.hasBeenCalled()).toBe(true);
    });

    it('should subscribe to fetch all query objects and then call to fetchQueryRowsIfRequired', function (done) {
      spyOn(this.view.model, 'fetchQueryRowsIfRequired');
      // spyOn(this.view, '_setViewState');
      var nodeDefModel = this.view.model.getAnalysisDefinitionNodeModel();
      var querySchemaModel = nodeDefModel.querySchemaModel;
      var queryRowsCollection = nodeDefModel.queryRowsCollection;
      var queryGeometryModel = this.view._queryGeometryModel;

      querySchemaModel.set({ ready: true, query: 'SELECT * FROM wadus' }, { silent: true });
      queryGeometryModel.set({ ready: true, query: 'SELECT * FROM wadus' }, { silent: true });

      queryGeometryModel.fetch();
      querySchemaModel.fetch();

      setTimeout(function () {
        queryRowsCollection.trigger('inFinalStatus');
      }, 0);

      setTimeout(function () {
        expect(this.view.model.fetchQueryRowsIfRequired).toHaveBeenCalled();
        done();
      }.bind(this), 0);
    });
  });

  describe('_bindEvents', function () {
    it('should hook up proper event handlers', function () {
      spyOn(this.view, 'render');
      spyOn(this.view, '_setViewState');
      spyOn(this.view, '_onQueryRowsStatusChanged');

      this.view._bindEvents();

      this.view.model.trigger('change');
      expect(this.view.render).toHaveBeenCalled();

      this.view._queryGeometryModel.trigger('change:simple_geom');
      expect(this.view._setViewState).toHaveBeenCalled();

      this.view._queryRowsStatus.trigger('change:status');
      expect(this.view._onQueryRowsStatusChanged).toHaveBeenCalled();

      this.view.render.calls.reset();
      this.view._viewState.trigger('change');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should hook up model destroy event with _onDestroy only once', function () {
      spyOn(this.view, '_onDestroy');

      this.view._bindEvents();

      this.view.model.trigger('destroy');
      this.view.model.trigger('destroy');
      expect(this.view._onDestroy.calls.count()).toBe(1);
    });
  });

  describe('.render', function () {
    it('should render properly depending on default values', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(3); // [inlineEditor, toggleTooltip, toggleMenuTooltip]
    });

    describe('depending on _needsGeocoding value', function () {
      beforeEach(function () {
        this.view._queryGeometryHasGeom = false; // To avoid rendering `js-analyses`. We want to depend only on _needsGeocoding
      });

      it('should render proper markup if no geocoding needed', function () {
        this.view._needsGeocoding = false;
        this.view.render();

        // We're checking against some markup that renders if needsGeocoding is false
        expect(this.view.$('ul.js-analyses').length).toBe(1);
        expect(this.view.$el.hasClass('is-empty')).toBe(false);
        expect(this.view.$('.js-geocode').length).toBe(0);
      });

      it('should render proper markup if geocoding needed', function () {
        this.view._viewState.set('needsGeocoding', true);
        this.view._viewState.set('queryGeometryHasGeom', true);
        this.view._viewState.set('brokenLayer', true);
        this.view.render();

        // We're checking against some markup that renders if needsGeocoding is true
        // expect(this.view.$('ul.js-analyses').length).toBe(0);
        expect(this.view.$el.hasClass('is-empty')).toBe(true);
        expect(this.view.$('.js-geocode').length).toBe(1);
        expect(this.view.$('.js-geocode').data('tipsy')).not.toBeUndefined();
      });
    });

    describe('depending on _isLayerEmpty value', function () {
      it('should render proper markup if the layer is empty', function () {
        this.view._viewState.set('isLayerEmpty', true);
        this.view.render();

        expect(this.view.$('.js-emptylayer').length).toBe(1);
        expect(this.view.$('.js-emptylayer').length).toBeGreaterThan(0); // Render warning icon
      });

      it('should render proper markup if the layer is not empty', function () {
        this.view._viewState.set('isLayerEmpty', false);
        this.view.render();

        expect(this.view.$('.js-emptylayer').length).toBe(0);
      });
    });

    describe('depending on _queryGeometryHasGeom value', function () {
      beforeEach(function () {
        this.view._viewState.set('needsGeocoding', true); // To avoid rendering `js-analyses`. We want to depend only on _queryGeometryHasGeom
      });

      it('should render proper markup if the layer has geometry', function () {
        this.view._viewState.set('queryGeometryHasGeom', true);
        this.view.render();

        expect(this.view.$('ul.js-analyses').length).toBe(1);
        expect(this.view.$('button.js-toggle').length).toBe(1);
      });

      it('should render proper markup if the layer has no geometry', function () {
        this.view._viewState.set('queryGeometryHasGeom', false);
        this.view.render();

        expect(this.view.$('ul.js-analyses').length).toBe(0);
        expect(this.view.$('button.js-toggle').length).toBe(0);
      });
    });

    describe('depending on _isFetchingRows value', function () {
      it('should render proper markup (a placeholder) if query rows is fetching', function () {
        this.view._viewState.set('isFetchingRows', true);
        this.view.render();

        expect(this.view.$('.Editor-ListLayer-itemHeader > .Editor-ListLayer-media--placeholder').length).toBe(1);
        expect(this.view.$('.js-thumbnail').length).toBe(0);
        expect(this.view.$el.hasClass('Editor-ListLayer-item--fetching')).toBe(true);
      });

      it('should not render a placeholder if query rows is not fetching', function () {
        this.view._viewState.set('isFetchingRows', false);
        this.view.render();

        expect(this.view.$('.Editor-ListLayer-itemHeader > .Editor-ListLayer-media--placeholder').length).toBe(0);
        expect(this.view.$('.js-thumbnail').length).toBe(1);
        expect(this.view.$el.hasClass('Editor-ListLayer-item--fetching')).toBe(false);
      });
    });
  });

  describe('when layer is source', function () {
    var view;

    beforeEach(function () {
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
      spyOn(this.model, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);
      spyOn(this.model, 'findAnalysisDefinitionNodeModel').and.returnValue(this.c2);

      view = new DataLayerView({
        modals: this.modals,
        model: this.model,
        userActions: this.userActions,
        stackLayoutModel: this.stackLayoutModel,
        newAnalysesView: this.newAnalysesViewSpy,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        configModel: {},
        stateDefinitionModel: {},
        visDefinitionModel: this.visDefinitionModel,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection,
        analysisDefinitionNodesCollection: {}
      });
      view._queryGeometryHasGeom = function () {
        return true;
      };
      view.$el.appendTo(document.body);
      view.render();
    });

    afterEach(function () {
      var parent = view.el.parentNode;
      parent && parent.removeChild(view.el);
      view.clean();
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(_.size(view._subviews)).toBe(4); // [inlineEditor, analysesViewTooltip, toggleTooltip, toggleMenuTooltip]
      });
    });

    describe('when layer has an analysis', function () {
      it('should render analysis views', function () {
        expect(view.$el.text()).toContain('ANALYSES');

        // Assert args being what's expected too
        expect(this.newAnalysesViewSpy).toHaveBeenCalled();
        expect(this.newAnalysesViewSpy.calls.argsFor(0)[0]).toEqual(view.$('.js-analyses'));
        expect(this.newAnalysesViewSpy.calls.argsFor(0)[1]).toEqual(this.model);
      });
    });
  });

  describe('when layer is Torque', function () {
    describe('.render', function () {
      it('should render properly', function () {
        this.view._isTorque = function () {
          return true;
        };

        this.view.render();

        expect(_.size(this.view._subviews)).toBe(4); // [inlineEditor, torqueTooltip, toggleTooltip, toggleMenuTooltip]
      });
    });
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
    expect(this.view.$('.js-analyses-widgets-info').hasClass('is-hidden')).toBe(false);

    this.model.set('visible', false);

    expect(this.view.$('.js-thumbnail').hasClass('is-hidden')).toBe(true);
    expect(this.view.$('.js-title').hasClass('is-hidden')).toBe(true);
    expect(this.view.$('.js-analyses').hasClass('is-hidden')).toBe(true);
    expect(this.view.$('.js-analyses-widgets-info').hasClass('is-hidden')).toBe(true);
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
    var originalSetTimeout = null;

    beforeEach(function () {
      spyOn(Router, 'goToStyleTab');
      originalSetTimeout = setTimeout;
      jasmine.clock().install();
      this.view.$('.js-title').click();
      jasmine.clock().tick(300);
    });

    it('should edit layer', function (done) {
      var self = this;
      canBeGeoreferencedPromise.resolve(false);

      originalSetTimeout(function () {
        expect(Router.goToStyleTab).toHaveBeenCalledWith(self.model.get('id'));
        done();
      }, 0);
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
    var originalSetTimeout = null;

    beforeEach(function () {
      spyOn(Router, 'goToStyleTab');
      originalSetTimeout = setTimeout;
      jasmine.clock().install();
      this.view.$('.js-thumbnail').click();
      jasmine.clock().tick(300);
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should edit layer', function (done) {
      var self = this;
      canBeGeoreferencedPromise.resolve(false);

      originalSetTimeout(function () {
        expect(Router.goToStyleTab).toHaveBeenCalledWith(self.model.get('id'));
        done();
      }, 0);
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
        shouldPreserveAutoStyle: true
      });
      expect(this.model.get('autoStyle')).toEqual('foo');

      this.userActions.saveLayer.calls.reset();
      this.view.$('.js-toggle').click();
      expect(this.model.get('visible')).toEqual(true);
      expect(this.userActions.saveLayer).toHaveBeenCalled();
      expect(this.userActions.saveLayer.calls.argsFor(0)[0]).toEqual(this.view.model);
      expect(this.userActions.saveLayer.calls.argsFor(0)[1]).toEqual({
        shouldPreserveAutoStyle: true
      });
      expect(this.model.get('autoStyle')).toEqual('foo');
    });
  });

  describe('expanded/collapsed states', function () {
    it('should expand and collapse the layer', function () {
      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(false);

      // Show the context menu and collapse the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title="editor.layers.options.collapse"]').click();

      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(true);

      // Show the context menu and expand the layer
      this.view.$('.js-toggle-menu').click();
      $('body').find('.CDB-Box-modal button[title="editor.layers.options.expand"]').click();

      // Show the context menu and expand the layer again
      expect(this.view.$('.js-analyses').hasClass('is-collapsed')).toBe(false);
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
      this.view._viewState.set('needsGeocoding', false);
      this.view.render();
      spyOn(this.view, '_centerMap');

      this.view._showContextMenu();

      expect(this.view._menuView.$('button[title^="editor.layers.options.center-map"]').length).toBe(1);

      this.view._menuView.$('button[title^="editor.layers.options.center-map"]').click();
      expect(this.view._centerMap).toHaveBeenCalled();
    });

    it('should not show center map option if no geom', function () {
      this.view._viewState.set('needsGeocoding', true);
      this.view.render();

      this.view._showContextMenu();

      expect(this.view._menuView.$('button[title^="editor.layers.options.center-map"]').length).toBe(0);
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

  describe('._isTorque', function () {
    it('should return if model is Torque Layer', function () {
      spyOn(this.view.model, 'isTorqueLayer');

      this.view._isTorque();

      expect(this.view.model.isTorqueLayer).toHaveBeenCalled();
    });
  });

  describe('._setViewState', function () {
    var initialHasGeomValue;
    var initialGeocodingValue;
    var initialLayerEmptyValue;

    beforeEach(function () {
      initialGeocodingValue = this.view._viewState.get('needsGeocoding');
      initialHasGeomValue = this.view._viewState.get('queryGeometryHasGeom');
      initialLayerEmptyValue = this.view._viewState.get('isLayerEmpty');
    });

    function resolvePromises (hasGeomValue, geocodingValue, layerEmptyValue) {
      geometryModelFakePromise.resolve(hasGeomValue);
      canBeGeoreferencedPromise.resolve(geocodingValue);
      isLayerEmptyPromise.resolve(layerEmptyValue);
    }

    it('shoud update needsGeocoding', function (done) {
      resolvePromises(initialHasGeomValue, !initialGeocodingValue, initialLayerEmptyValue);

      setTimeout(function () {
        expect(this.view._viewState.get('needsGeocoding')).toEqual(!initialGeocodingValue);
        done();
      }.bind(this), 0);
    });

    it('shoud update isLayerEmpty', function (done) {
      resolvePromises(initialHasGeomValue, initialGeocodingValue, !initialLayerEmptyValue);

      setTimeout(function () {
        expect(this.view._viewState.get('isLayerEmpty')).toEqual(!initialLayerEmptyValue);
        done();
      }.bind(this), 0);
    });

    it('should update queryGeometryHasGeom', function (done) {
      resolvePromises(!initialHasGeomValue, !initialGeocodingValue, initialLayerEmptyValue);

      setTimeout(function () {
        expect(this.view._viewState.get('queryGeometryHasGeom')).toEqual(!initialHasGeomValue);
        done();
      }.bind(this), 0);
    });

    it('should update isFetchingRows', function (done) {
      this.view._viewState.set('isFetchingRows', false, { silent: true });
      spyOn(this.view, '_isFetchingRows').and.returnValue(true);

      resolvePromises(initialHasGeomValue, initialGeocodingValue, initialLayerEmptyValue);

      setTimeout(function () {
        expect(this.view._viewState.get('isFetchingRows')).toBe(true);
        done();
      }.bind(this), 0);
    });
  });

  describe('_isFetchingRows', function () {
    it('should return query rows status of the current analysisDefinitionModel', function () {
      var node = this.view.model.getAnalysisDefinitionNodeModel();
      var rowsStatus = node.queryRowsCollection.statusModel;

      rowsStatus.set('status', 'fetching');
      var isFetching = this.view._isFetchingRows();
      expect(isFetching).toBe(true);

      rowsStatus.set('status', 'fetched');
      isFetching = this.view._isFetchingRows();
      expect(isFetching).toBe(false);
    });
  });

  describe('_onQueryRowsStatusChanged', function () {
    it('shoudl set viewState to isFetchingRows and call setViewState', function () {
      this.view._viewState.set('isFetchingRows', false, { silent: true });
      spyOn(this.view, '_isFetchingRows').and.returnValue(true);
      spyOn(this.view, '_setViewState');

      this.view._onQueryRowsStatusChanged();

      expect(this.view._viewState.get('isFetchingRows')).toBe(true);
      expect(this.view._setViewState).toHaveBeenCalled();
    });
  });
});
