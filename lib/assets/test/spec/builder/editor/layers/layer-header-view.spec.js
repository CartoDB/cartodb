var Backbone = require('backbone');
var _ = require('underscore');
var LayerHeaderView = require('builder/editor/layers/layer-header-view');
var SyncModel = require('builder/data/synchronization-model');
var FactoryModals = require('../../factories/modals');
var getLayerDefinitionModelFixture = require('fixtures/builder/layer-definition-model.fixture.js');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');
var getQueryGeometryModelFixture = require('fixtures/builder/query-geometry-model.fixture.js');
var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
var getQueryRowsCollectionModelFixture = require('fixtures/builder/query-rows-collection.fixture.js');
var fakePromise = require('fixtures/builder/fake-promise.fixture.js');

describe('editor/layers/layer-header-view', function () {
  var isEmptyPromise;
  var hasGeomPromise;

  function createView (options) {
    var tableName = 'foo';
    var editing = options.hasOwnProperty('editing') ? options.editing : false;

    this.configModel = getConfigModelFixture();

    var editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return editing;
    };

    var userModel = new Backbone.Model();

    this.layerDefinitionModel = getLayerDefinitionModelFixture({
      id: 'l-1',
      name: tableName,
      configModel: this.configModel,
      parse: true
    });
    if (options.fakeIsEmptyPromise) {
      isEmptyPromise = fakePromise(this.layerDefinitionModel, 'isEmptyAsync');
    }

    this.stateDefinitionModel = {
      key: 'value'
    };

    this.tableNodeModel = null;

    this.queryGeometryModel = getQueryGeometryModelFixture();
    this.querySchemaModel = getQuerySchemaModelFixture({
      query: options.query
    });
    this.queryRowsCollection = getQueryRowsCollectionModelFixture({
      querySchemaModel: this.querySchemaModel
    });

    var sourceNode = new Backbone.Model({
      type: 'source',
      table_name: tableName
    });
    sourceNode.queryGeometryModel = this.queryGeometryModel;
    sourceNode.querySchemaModel = this.querySchemaModel;
    sourceNode.queryRowsCollection = this.queryRowsCollection;

    this.nodeModelSpy = spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel');
    this.nodeModelSpy.and.returnValue(sourceNode);
    if (options.fakeHasGeomPromise) {
      hasGeomPromise = fakePromise(this.queryGeometryModel, 'hasValueAsync');
    }

    this.visDefinitionModel = new Backbone.Model();
    this.widgetDefinitionsCollection = new Backbone.Collection();

    this.view = new LayerHeaderView({
      userActions: {},
      modals: FactoryModals.createModalService(),
      layerDefinitionModel: this.layerDefinitionModel,
      layerDefinitionsCollection: {},
      configModel: this.configModel,
      stateDefinitionModel: this.stateDefinitionModel,
      tableNodeModel: this.tableNodeModel,
      editorModel: editorModel,
      visDefinitionModel: this.visDefinitionModel,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      userModel: userModel
    });
  }

  var FakeNodeModel = function (tableModel, synced, syncModel) {
    this.tableModel = tableModel;
    if (tableModel) {
      this.tableModel.isSync = function () {
        return synced || false;
      };
      this.tableModel._syncModel = syncModel;
      this.tableModel.getSyncModel = function () {
        return syncModel;
      };
      this.tableModel.isOwner = function () { return true; };
    }
  };

  afterEach(function () {
    this.layerDefinitionModel.getAnalysisDefinitionNodeModel.calls.reset();
  });

  describe('.initialize', function () {
    it('initial values used in UI have the proper value', function () {
      createView.call(this, {
        fakeHasGeomPromise: true,
        fakeIsEmptyPromise: true
      });

      expect(this.view._isLayerEmpty).toBe(false);
      expect(this.view._hasGeom).toBe(true);
      expect(this.view._uiModel.get('zoomVisible')).toEqual(this.view._hasGeom);
      expect(hasGeomPromise.hasBeenCalled()).toBe(true);
      expect(isEmptyPromise.hasBeenCalled()).toBe(true);
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      createView.call(this, {});
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(3); // [inlineEditor, centerTooltip, toggleMenuTooltip]
    });

    it('should have class for onboarding', function () {
      createView.call(this, {});

      this.view.render();

      expect(this.view.$el.hasClass('js-editorPanelHeader')).toBe(true);
    });

    it('should show zoom icon when there is geometry', function (done) {
      var self = this;
      createView.call(this, {
        fakeHasGeomPromise: true
      });

      this.view.render();
      hasGeomPromise.resolve(true);

      setTimeout(function () {
        expect(self.view.$('.js-zoom')[0].style['display']).not.toBe('none');
        done();
      }, 0);
    });

    it('should hide zoom icon when there is no geometry', function (done) {
      var self = this;
      createView.call(this, {
        fakeHasGeomPromise: true
      });

      this.view.render();
      hasGeomPromise.resolve(false);

      setTimeout(function () {
        expect(self.view.$('.js-zoom')[0].style['display']).toBe('none');
        done();
      }, 0);
    });

    it('should show warning icon when the layer is empty', function (done) {
      var self = this;
      createView.call(this, {
        fakeIsEmptyPromise: true
      });

      this.view.render();
      isEmptyPromise.resolve(true);

      setTimeout(function () {
        expect(self.view.$el.find('.js-emptylayer').length).toBe(1);
        done();
      }, 0);
    });

    it('should not show warning icon when the layer is not empty', function (done) {
      var self = this;
      createView.call(this, {
        fakeIsEmptyPromise: true
      });

      this.view.render();
      isEmptyPromise.resolve(false);

      setTimeout(function () {
        expect(self.view.$el.find('.js-emptylayer').length).toBe(0);
        done();
      }, 0);
    });
  });

  describe('._initViews', function () {
    it('should call _addSyncInfo', function () {
      createView.call(this, {});
      spyOn(this.view, '_addSyncInfo');

      this.view._initViews();

      expect(this.view._addSyncInfo).toHaveBeenCalled();
    });
  });

  describe('._addSyncInfo', function () {
    beforeEach(function () {
      createView.call(this, {});
    });

    it('should call _createSyncInfo with the proper argument if the node has a synced tableModel', function () {
      this.nodeModelSpy.and.returnValue(new FakeNodeModel({ id: 765 }, true));
      spyOn(this.view, '_createSyncInfo');

      this.view._addSyncInfo();

      expect(this.view._createSyncInfo.calls.mostRecent().args[0].id).toEqual(765);
    });

    it('should not call _createSyncInfo if the node has not a synced tableModel', function () {
      this.nodeModelSpy.and.returnValue(new FakeNodeModel({}));
      spyOn(this.view, '_createSyncInfo');

      this.view._addSyncInfo();

      expect(this.view._createSyncInfo).not.toHaveBeenCalled();
    });

    it('should not call _createSyncInfo if the node does not have a tableModel', function () {
      this.nodeModelSpy.and.returnValue(new FakeNodeModel());
      spyOn(this.view, '_createSyncInfo');

      this.view._addSyncInfo();

      expect(this.view._createSyncInfo).not.toHaveBeenCalled();
    });
  });

  describe('._createSyncInfo', function () {
    it('should create SyncInfoView object with proper table and sync models', function () {
      createView.call(this, {});
      var syncModel = new SyncModel(null, { configModel: this.configModel });
      var nodeModel = new FakeNodeModel({ id: 765 }, true, syncModel);

      this.view._createSyncInfo(nodeModel.tableModel);

      expect(this.view._syncInfoView).not.toBeUndefined();
      expect(this.view._syncInfoView._syncModel.cid).toEqual(syncModel.cid);
      expect(this.view._syncInfoView._tableModel.id).toEqual(765);
    });
  });

  describe('._bindEvents', function () {
    it('should call _onSourceChanged when layer definition model changes source', function () {
      createView.call(this, {});
      spyOn(this.view, '_onSourceChanged');
      this.view._bindEvents();

      this.layerDefinitionModel.set('source', {});

      expect(this.view._onSourceChanged).toHaveBeenCalled();
    });
  });

  describe('._changeStyle', function () {
    it('should have proper classes if editing in expert mode', function () {
      createView.call(this, { editing: true });
      this.view.render();

      this.view._changeStyle();

      expect(this.view._getTitle().hasClass('u-whiteTextColor')).toBe(true);
      expect(this.view._getText().hasClass('u-altTextColor')).toBe(true);
      expect(this.view._getInlineEditor().hasClass('u-mainTextColor')).toBe(true);
      expect(this.view._getLink().hasClass('u-whiteTextColor')).toBe(true);
      expect(this.view._getBack().hasClass('u-whiteTextColor')).toBe(true);
      expect(this.view._getToggleMenu().hasClass('is-white')).toBe(true);
      expect(this.view._getZoom().hasClass('is-white')).toBe(true);
    });

    it('should have proper classes if not in expert mode', function () {
      createView.call(this, {});
      this.view.render();

      this.view._changeStyle();

      expect(this.view._getTitle().hasClass('u-whiteTextColor')).toBe(false);
      expect(this.view._getText().hasClass('u-altTextColor')).toBe(false);
      expect(this.view._getInlineEditor().hasClass('u-mainTextColor')).toBe(false);
      expect(this.view._getLink().hasClass('u-altTextColor')).toBe(false);
      expect(this.view._getBack().hasClass('u-whiteTextColor')).toBe(false);
      expect(this.view._getToggleMenu().hasClass('is-white')).toBe(false);
      expect(this.view._getZoom().hasClass('is-white')).toBe(false);
    });
  });

  describe('._onZoomClicked', function () {
    it('should call to zoomToData with the right query', function () {
      createView.call(this, {
        query: ''
      });
      var theView = this.view;

      // The only way we have to know if zoomToData has been called is to provoke an
      // error. This way we know that the query has been extracted from our querySchemaModel
      // and that zoomToData has been called.
      expect(function () {
        theView._onZoomClicked();
      }).toThrowError('query is required');
    });
  });

  describe('._getNodeModel', function () {
    it('should return node model', function () {
      createView.call(this, {});

      this.view._getNodeModel();

      expect(this.nodeModelSpy).toHaveBeenCalled();
    });
  });

  describe('layer name edition', function () {
    it('should update name properly', function () {
      createView.call(this, {});
      this.view.render();
      this.view._onSaveSuccess('wadus');

      expect(this.view.$('.js-title-editor').attr('title')).toBe('wadus');
      expect(this.view.$('.js-title').text()).toBe('wadus');
    });
  });

  describe('_showOrHideZoomVisibility', function () {
    it('should toggle zoom depending on this._hasGeom', function () {
      createView.call(this, {});
      this.view._hasGeom = true;
      this.view.render();
      var zoom = this.view._getZoom();

      expect(zoom[0].style.display).toBeDefined();
      expect(zoom[0].style.display).not.toEqual('none');

      this.view._hasGeom = false;
      this.view.render();
      zoom = this.view._getZoom();

      expect(zoom[0].style.display).toEqual('none');
    });
  });

  describe('when zoomVisible changes', function () {
    it('should call _showOrHideZoomVisibility', function () {
      createView.call(this, {});
      spyOn(this.view, '_showOrHideZoomVisibility');
      this.view._bindEvents();

      this.view._uiModel.set('zoomVisible', !this.view._uiModel.get('zoomVisible'));

      expect(this.view._showOrHideZoomVisibility).toHaveBeenCalled();
    });
  });

  describe('_onSourceChanged', function () {
    it('should call to _renderZoomIfHasGeomChanges first and should bind changes on geometry to _renderZoomIfHasGeomChanges', function () {
      createView.call(this, {});
      spyOn(this.view, '_renderZoomIfHasGeomChanges');

      this.view._onSourceChanged();
      var topQueryGeometryModel = this.view._topQueryGeometryModel;

      topQueryGeometryModel.set('simple_geom', topQueryGeometryModel.get('simple_geom') + 'wadus');

      expect(this.view._renderZoomIfHasGeomChanges.calls.count()).toBe(2);
    });
  });
});
