var _ = require('underscore');
var Backbone = require('backbone');

var LayerHeaderView = require('builder/editor/layers/layer-header-view');
var SyncModel = require('builder/data/synchronization-model');
var FactoryModals = require('../../factories/modals');

var getLayerDefinitionModelFixture = require('fixtures/builder/layer-definition-model.fixture.js');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var getQueryGeometryModelFixture = require('fixtures/builder/query-geometry-model.fixture.js');
var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
var getQueryRowsCollectionModelFixture = require('fixtures/builder/query-rows-collection.fixture.js');
var getNodeModelFixture = require('fixtures/builder/node-model.fixture.js');

describe('editor/layers/layer-header-view', function () {
  var view;
  var configModel;
  var layerDefinitionModel;
  var stateDefinitionModel;
  var tableNodeModel;
  var queryGeometryModel;
  var querySchemaModel;
  var queryRowsCollection;
  var visDefinitionModel;
  var widgetDefinitionsCollection;
  var userModel;
  var editorModel;
  var sourceNodeModel;
  var tableName = 'foo';
  var NodeModel = getNodeModelFixture;

  var createViewFn = function (options) {
    options = options || {};

    var hasValueAsync = options.hasOwnProperty('hasValueAsync') ? options.hasValueAsync : false;
    var isEmptyAsync = options.hasOwnProperty('isEmptyAsync') ? options.isEmptyAsync : true;
    var canBeGeoreferenced = options.hasOwnProperty('canBeGeoreferenced') ? options.canBeGeoreferenced : false;

    configModel = getConfigModelFixture();

    editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return options && options.hasOwnProperty('editing') ? options.editing : false;
    };

    userModel = new Backbone.Model();

    layerDefinitionModel = getLayerDefinitionModelFixture({
      id: 'l-1',
      name: tableName,
      configModel: configModel,
      parse: true
    });

    stateDefinitionModel = {
      key: 'value'
    };

    tableNodeModel = null;

    queryGeometryModel = getQueryGeometryModelFixture();

    querySchemaModel = getQuerySchemaModelFixture({
      query: options.query
    });

    queryRowsCollection = getQueryRowsCollectionModelFixture({
      querySchemaModel: querySchemaModel
    });

    sourceNodeModel = new Backbone.Model({
      type: 'source',
      table_name: tableName
    });

    sourceNodeModel.queryGeometryModel = queryGeometryModel;
    sourceNodeModel.querySchemaModel = querySchemaModel;
    sourceNodeModel.queryRowsCollection = queryRowsCollection;
    sourceNodeModel.isCustomQueryApplied = function () { return true; };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {};

    spyOn(sourceNodeModel.queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(hasValueAsync));
    spyOn(layerDefinitionModel, 'isEmptyAsync').and.returnValue(Promise.resolve(isEmptyAsync));
    spyOn(layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(canBeGeoreferenced));
    spyOn(layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(sourceNodeModel);

    visDefinitionModel = new Backbone.Model();
    widgetDefinitionsCollection = new Backbone.Collection();

    return new LayerHeaderView({
      configModel: configModel,
      editorModel: editorModel,
      layerDefinitionModel: layerDefinitionModel,
      layerDefinitionsCollection: {},
      modals: FactoryModals.createModalService(),
      stateDefinitionModel: stateDefinitionModel,
      tableNodeModel: tableNodeModel,
      userActions: {},
      userModel: userModel,
      visDefinitionModel: visDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection
    });
  };

  describe('.initialize', function () {
    describe('._initVisTableModel', function () {
      it('should initialize a VisTableModel if _sourceNodeModel is defined', function () {
        view = createViewFn();
        expect(view._visTableModel).toBeDefined();
      });
    });

    describe('._initViewState', function () {
      it('should set default state values', function () {
        spyOn(LayerHeaderView.prototype, '_setViewStateValues');

        view = createViewFn();

        expect(view._viewState.get('isLayerEmpty')).toEqual(false);
        expect(view._viewState.get('hasGeom')).toEqual(true);
        expect(view._viewState.get('canBeGeoreferenced')).toEqual(false);
        expect(LayerHeaderView.prototype._setViewStateValues).toHaveBeenCalled();
      });
    });
  });

  describe('._setViewStateValues', function () {
    it('should be able to update _viewState properties', function (done) {
      view = createViewFn({
        hasValueAsync: true,
        isEmptyAsync: true,
        canBeGeoreferenced: true
      });

      view._viewState.set({
        isLayerEmpty: false,
        hasGeom: false,
        canBeGeoreferenced: false
      });

      view._setViewStateValues();

      setTimeout(function () {
        expect(view._viewState.get('isLayerEmpty')).toEqual(true);
        expect(view._viewState.get('hasGeom')).toEqual(true);
        expect(view._viewState.get('canBeGeoreferenced')).toEqual(true);
        done();
      }, 0);
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();
      expect(_.size(view._subviews)).toBe(3); // [inlineEditor, centerTooltip, toggleMenuTooltip]
    });

    it('should have class for onboarding', function () {
      view = createViewFn();
      view.render();

      expect(view.$el.hasClass('js-editorPanelHeader')).toBe(true);
    });

    it('should show zoom icon when there is geometry', function (done) {
      view = createViewFn({
        hasValueAsync: true,
        isEmptyAsync: true,
        canBeGeoreferenced: true
      });

      view.render();

      setTimeout(function () {
        expect(view.$('.js-zoom')[0].style.display).not.toBe('none');
        done();
      }, 0);
    });

    it('should hide zoom icon when there is no geometry', function (done) {
      view = createViewFn({
        hasValueAsync: false,
        isEmptyAsync: true,
        canBeGeoreferenced: true
      });

      view.render();

      setTimeout(function () {
        expect(view.$('.js-zoom')[0].style.display).toBe('none');
        done();
      }, 0);
    });

    it('should show warning icon when the layer is empty', function (done) {
      view = createViewFn({
        hasValueAsync: true,
        isEmptyAsync: true,
        canBeGeoreferenced: false
      });

      view.render();

      setTimeout(function () {
        expect(view.$el.find('.js-warningIcon').length).toBe(1);
        done();
      }, 0);
    });

    it('should show warning icon when the layer can be georeferenced', function (done) {
      view = createViewFn({
        hasValueAsync: true,
        isEmptyAsync: false,
        canBeGeoreferenced: true
      });

      view.render();

      setTimeout(function () {
        expect(view.$el.find('.js-warningIcon').length).toBe(1);
        done();
      }, 0);
    });

    it('should not show warning icon when the layer is not empty and can not be georeferenced', function (done) {
      view = createViewFn({
        hasValueAsync: true,
        isEmptyAsync: false,
        canBeGeoreferenced: false
      });

      view.render();

      setTimeout(function () {
        expect(view.$el.find('.js-warningIcon').length).toBe(0);
        done();
      }, 0);
    });
  });

  describe('._initViews', function () {
    it('should call _addSyncInfo', function () {
      view = createViewFn();
      spyOn(view, '_addSyncInfo');

      view._initViews();

      expect(view._addSyncInfo).toHaveBeenCalled();
    });
  });

  describe('._addSyncInfo', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call _createSyncInfo with the proper argument if the node has a synced tableModel', function () {
      layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(new NodeModel({ id: 765 }, true));
      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo.calls.mostRecent().args[0].id).toEqual(765);
    });

    it('should not call _createSyncInfo if the node has not a synced tableModel', function () {
      layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(new NodeModel({}));
      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo).not.toHaveBeenCalled();
    });

    it('should not call _createSyncInfo if the node does not have a tableModel', function () {
      layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(new NodeModel());
      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo).not.toHaveBeenCalled();
    });
  });

  describe('._createSyncInfo', function () {
    it('should create SyncInfoView object with proper table and sync models', function () {
      view = createViewFn();
      var syncModel = new SyncModel(null, { configModel: configModel });
      var nodeModel = new NodeModel({ id: 765 }, true, syncModel);

      view._createSyncInfo(nodeModel.tableModel);

      expect(view._syncInfoView).not.toBeUndefined();
      expect(view._syncInfoView._syncModel.cid).toEqual(syncModel.cid);
      expect(view._syncInfoView._tableModel.id).toEqual(765);
    });
  });

  describe('._bindEvents', function () {
    it('should call _onSourceChanged when layer definition model changes source', function () {
      view = createViewFn();
      spyOn(view, '_onSourceChanged');
      view._bindEvents();

      layerDefinitionModel.set('source', {});

      expect(view._onSourceChanged).toHaveBeenCalled();
    });
  });

  describe('._changeStyle', function () {
    it('should have proper classes if editing in expert mode', function () {
      view = createViewFn({ editing: true });
      view.render();
      view._changeStyle();

      expect(view._getTitle().hasClass('u-whiteTextColor')).toBe(true);
      expect(view._getText().hasClass('u-altTextColor')).toBe(true);
      expect(view._getInlineEditor().hasClass('u-mainTextColor')).toBe(true);
      expect(view._getLink().hasClass('u-whiteTextColor')).toBe(true);
      expect(view._getBack().hasClass('u-whiteTextColor')).toBe(true);
      expect(view._getToggleMenu().hasClass('is-white')).toBe(true);
      expect(view._getZoom().hasClass('is-white')).toBe(true);
    });

    it('should have proper classes if not in expert mode', function () {
      view = createViewFn();
      view.render();
      view._changeStyle();

      expect(view._getTitle().hasClass('u-whiteTextColor')).toBe(false);
      expect(view._getText().hasClass('u-altTextColor')).toBe(false);
      expect(view._getInlineEditor().hasClass('u-mainTextColor')).toBe(false);
      expect(view._getLink().hasClass('u-altTextColor')).toBe(false);
      expect(view._getBack().hasClass('u-whiteTextColor')).toBe(false);
      expect(view._getToggleMenu().hasClass('is-white')).toBe(false);
      expect(view._getZoom().hasClass('is-white')).toBe(false);
    });
  });

  describe('._onZoomClicked', function () {
    it('should call to zoomToData with the right query', function () {
      view = createViewFn({query: ''});

      // The only way we have to know if zoomToData has been called is to provoke an
      // error. This way we know that the query has been extracted from our querySchemaModel
      // and that zoomToData has been called.
      expect(function () {
        view._onZoomClicked();
      }).toThrowError('query is required');
    });
  });

  describe('._getNodeModel', function () {
    it('should return node model', function () {
      view = createViewFn();
      view._getNodeModel();

      expect(layerDefinitionModel.getAnalysisDefinitionNodeModel).toHaveBeenCalled();
    });
  });

  describe('layer name edition', function () {
    it('should update name properly', function () {
      view = createViewFn();
      view.render();
      view._onSaveSuccess('wadus');

      expect(view.$('.js-title-editor').attr('title')).toBe('wadus');
      expect(view.$('.js-title').text()).toBe('wadus');
    });
  });

  describe('_showOrHideZoomVisibility', function () {
    it('should show zoom if layer has geometries', function () {
      view = createViewFn({
        hasValueAsync: true
      });

      view._viewState.set('hasGeom', true);
      view.render();

      var zoom = view._getZoom();
      expect(zoom[0].style.display).toBeDefined();
      expect(zoom[0].style.display).not.toEqual('none');
    });

    it('should not show zoom if layer has not geometries', function () {
      view = createViewFn({
        hasValueAsync: false
      });

      view._viewState.set('hasGeom', false);
      view.render();

      var zoom = view._getZoom();
      expect(zoom[0].style.display).toEqual('none');
    });
  });
});
