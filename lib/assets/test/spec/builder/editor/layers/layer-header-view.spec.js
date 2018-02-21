var _ = require('underscore');

var Backbone = require('backbone');
var LayerHeaderView = require('builder/editor/layers/layer-header-view');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var ConfigModel = require('builder/data/config-model');
var SyncModel = require('builder/data/synchronization-model');
var FactoryModals = require('../../factories/modals');

describe('editor/layers/layer-header-view', function () {
  var view;
  var configModel;
  var editorModel;
  var userModel;
  var layerDefinitionModel;
  var stateDefinitionModel;
  var tableNodeModel;
  var queryGeometryModel;
  var querySchemaModel;
  var visDefinitionModel;
  var widgetDefinitionsCollection;
  var nodeModelSpy;
  var sourceNode;
  var isDataEmpty;

  var createViewFn = function (options) {
    options = options || {};

    var tableName = 'foo';
    var simple_geom = options.hasOwnProperty('simple_geom') ? options.simple_geom : 'polygon';
    var isLayerEmpty = options.hasOwnProperty('isLayerEmpty') ? options.isLayerEmpty : false;
    var editing = options.hasOwnProperty('editing') ? options.editing : false;

    configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return editing;
    };

    userModel = new Backbone.Model();

    layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: tableName
      }
    }, {
      parse: true,
      configModel: configModel
    });

    layerDefinitionModel.isEmpty = function () {
      return isLayerEmpty;
    };

    layerDefinitionModel.isDone = function () {
      return true;
    };

    stateDefinitionModel = {
      key: 'value'
    };

    tableNodeModel = null;

    queryGeometryModel = new Backbone.Model({
      simple_geom: simple_geom
    });

    queryGeometryModel.hasValue = function () {
      return !!this.get('simple_geom');
    };

    queryGeometryModel.isDone = function () {
      return false;
    };

    querySchemaModel = new Backbone.Model({
      query: ''
    });

    sourceNode = new Backbone.Model({
      type: 'source',
      table_name: tableName
    });

    sourceNode.queryGeometryModel = queryGeometryModel;
    sourceNode.querySchemaModel = querySchemaModel;

    sourceNode.isCustomQueryApplied = function () {
      return false;
    };

    sourceNode.isDone = function () {
      return false;
    };

    sourceNode.letter = function () {
      return false;
    };

    visDefinitionModel = new Backbone.Model();
    widgetDefinitionsCollection = new Backbone.Collection();

    nodeModelSpy = spyOn(LayerDefinitionModel.prototype, 'getAnalysisDefinitionNodeModel');
    nodeModelSpy.and.returnValue(sourceNode);

    isDataEmpty = false;

    var defaultOptions = {
      userActions: {},
      modals: FactoryModals.createModalService(),
      layerDefinitionModel: layerDefinitionModel,
      layerDefinitionsCollection: {},
      configModel: configModel,
      stateDefinitionModel: stateDefinitionModel,
      tableNodeModel: tableNodeModel,
      editorModel: editorModel,
      visDefinitionModel: visDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      userModel: userModel,
      isDataEmpty: isDataEmpty
    };

    view = new LayerHeaderView(_.extend(defaultOptions, options));

    return view;
  };

  var FakeNodeModel = function (tableModel, synced, syncModel) {
    if (tableModel) {
      tableModel.isSync = function () {
        return synced || false;
      };
      tableModel._syncModel = syncModel;
      tableModel.getSyncModel = function () {
        return syncModel;
      };
      tableModel.isOwner = function () {
        return true;
      };
      this.tableModel = tableModel;
    }
  };

  afterEach(function () {
    layerDefinitionModel.getAnalysisDefinitionNodeModel.calls.reset();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn({});

      view.render();
      expect(_.size(view._subviews)).toBe(3); // [inlineEditor, centerTooltip, toggleMenuTooltip]
    });

    it('should have class for onboarding', function () {
      view = createViewFn.call(this, {});

      view.render();

      expect(view.$el.hasClass('js-editorPanelHeader')).toBe(true);
    });

    it('should show zoom icon when there is geometry', function () {
      view = createViewFn.call(this, {});

      view.render();
      expect(view.$('.js-zoom')[0].style['display']).not.toBe('none');
    });

    it('should hide zoom icon when there is no geometry', function () {
      view = createViewFn.call(this, {
        simple_geom: ''
      });

      view.render();
      expect(view.$('.js-zoom')[0].style['display']).toBe('none');
    });

    it('should show warning icon when there is no geometry', function () {
      view = createViewFn.call(this, {
        isLayerEmpty: true
      });

      spyOn(view, '_isLayerEmpty').and.returnValue(true);

      view.render();
      expect(view.$el.find('.js-emptylayer').length).toBe(1);
    });

    it('should not show warning icon when there is geometry but there is no data', function () {
      view = createViewFn.call(this, {
        isDataEmpty: true
      });

      spyOn(view, '_isLayerEmpty').and.returnValue(false);

      view.render();
      expect(view.$el.find('.js-emptylayer').length).toBe(0);
    });
  });

  describe('._initViews', function () {
    it('should call _addSyncInfo', function () {
      view = createViewFn.call(this, {});
      spyOn(view, '_addSyncInfo');

      view._initViews();

      expect(view._addSyncInfo).toHaveBeenCalled();
    });
  });

  describe('._addSyncInfo', function () {
    beforeEach(function () {
      view = createViewFn.call(this, {});
    });

    it('should call _createSyncInfo with the proper argument if the node has a synced tableModel', function () {
      var syncModel = new SyncModel(null, {
        configModel: configModel
      });

      var tableModel = {
        id: 765
      };

      nodeModelSpy.and.returnValue(new FakeNodeModel(tableModel, true, syncModel));

      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo.calls.mostRecent().args[0].id).toEqual(765);
    });

    it('should not call _createSyncInfo if the node has not a synced tableModel', function () {
      nodeModelSpy.and.returnValue(new FakeNodeModel({}));
      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo).not.toHaveBeenCalled();
    });

    it('should not call _createSyncInfo if the node does not have a tableModel', function () {
      nodeModelSpy.and.returnValue(new FakeNodeModel());
      spyOn(view, '_createSyncInfo');

      view._addSyncInfo();

      expect(view._createSyncInfo).not.toHaveBeenCalled();
    });
  });

  describe('._createSyncInfo', function () {
    it('should create SyncInfoView object with proper table and sync models', function () {
      view = createViewFn.call(this, {});

      var tableModel = {
        id: 765
      };

      var syncModel = new SyncModel(null, {
        configModel: configModel
      });

      nodeModelSpy.and.returnValue(new FakeNodeModel(tableModel, true, syncModel));

      view._createSyncInfo(tableModel);

      expect(view._syncInfoView).not.toBeUndefined();
      expect(view._syncInfoView._syncModel.cid).toEqual(syncModel.cid);
      expect(view._syncInfoView._tableModel.id).toEqual(765);
    });
  });

  describe('._bindEvents', function () {
    it('should call _onSourceChanged when layer definition model changes source', function () {
      view = createViewFn.call(this, {});
      spyOn(view, '_onSourceChanged');

      view._bindEvents();

      layerDefinitionModel.set('source', {});

      expect(view._onSourceChanged).toHaveBeenCalled();
    });

    it('should call _showOrHideZoomVisibility when zoom visibility changes', function () {
      view = createViewFn.call(this, {
        simple_geom: ''
      });

      spyOn(view, '_showOrHideZoomVisibility');
      view._bindEvents();

      queryGeometryModel.set('simple_geom', 'line');
      view._checkIfGeometryVisible();

      expect(view._showOrHideZoomVisibility).toHaveBeenCalled();
    });
  });

  describe('._onSourceChanged', function () {
    it('should bind to geometry changes', function () {
      view = createViewFn.call(this, {});

      view._onSourceChanged();

      expect(view._topQueryGeometryModel._events['change:simple_geom'][0].callback).toBeTruthy();
    });

    it('should call _checkIfGeometryVisible', function () {
      view = createViewFn.call(this, {});
      spyOn(view, '_checkIfGeometryVisible');

      view._onSourceChanged();

      expect(view._checkIfGeometryVisible).toHaveBeenCalled();
    });
  });

  describe('._isQueryGeometryVisible', function () {
    it('should return false is there is no simple geom', function () {
      view = createViewFn.call(this, {});

      var result = view._isQueryGeometryVisible();

      expect(result).toBe(true);
    });

    it('should return true is there is simple geom', function () {
      view = createViewFn.call(this, {
        simple_geom: ''
      });

      var result = view._isQueryGeometryVisible();

      expect(result).toBe(false);
    });
  });

  describe('._checkIfGeometryVisible', function () {
    it('should set zoomVisible to false is there is no simple geom', function () {
      view = createViewFn.call(this, {});

      view._checkIfGeometryVisible();

      expect(view._uiModel.get('zoomVisible')).toBe(true);
    });

    it('should set zoomVisible to true is there is simple geom', function () {
      view = createViewFn.call(this, {
        simple_geom: ''
      });

      view._checkIfGeometryVisible();

      expect(view._uiModel.get('zoomVisible')).toBe(false);
    });
  });

  describe('._changeStyle', function () {
    it('should have proper classes if editing in expert mode', function () {
      view = createViewFn.call(this, {
        editing: true
      });

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
      view = createViewFn.call(this, {});
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
      view = createViewFn.call(this, {});
      var theView = view;

      // The only way we have to know if zoomToData has been called is to provoke an
      // error. This way we know that the query has been extracted from our querySchemaModel
      // and that zoomToData has been called.
      expect(function () {
        theView._onZoomClicked();
      }).toThrowError('query is required');
    });
  });

  describe('._showOrHideZoomVisibility', function () {
    it('should show zoom icon if there is geometry', function () {
      view = createViewFn.call(this, {});
      view.render();

      view._showOrHideZoomVisibility();

      expect(view.$('.js-zoom')[0].style['display']).not.toBe('none');
    });

    it('should hide zoom icon if there is not geometry', function () {
      view = createViewFn.call(this, {
        simple_geom: ''
      });
      view.render();

      view._showOrHideZoomVisibility();

      expect(view.$('.js-zoom')[0].style['display']).toBe('none');
    });
  });

  describe('._getNodeModel', function () {
    it('should return node model', function () {
      view = createViewFn.call(this, {});

      view._getNodeModel();

      expect(nodeModelSpy).toHaveBeenCalled();
    });
  });

  describe('layer name edition', function () {
    it('should update name properly', function () {
      view = createViewFn.call(this, {});
      view.render();
      view._onSaveSuccess('wadus');

      expect(view.$('.js-title-editor').attr('title')).toBe('wadus');
      expect(view.$('.js-title').text()).toBe('wadus');
    });
  });
});
