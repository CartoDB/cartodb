var Backbone = require('backbone');
var _ = require('underscore');
var LayerHeaderView = require('../../../../../javascripts/cartodb3/editor/layers/layer-header-view');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var SyncModel = require('../../../../../javascripts/cartodb3/data/synchronization-model');
var FactoryModals = require('../../factories/modals');

describe('editor/layers/layer-header-view', function () {
  function createView (options) {
    var tableName = 'foo';
    var simple_geom = options.hasOwnProperty('simple_geom') ? options.simple_geom : 'polygon';
    var isLayerEmpty = options.hasOwnProperty('isLayerEmpty') ? options.isLayerEmpty : false;
    var editing = options.hasOwnProperty('editing') ? options.editing : false;

    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    var editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return editing;
    };

    var userModel = new Backbone.Model();

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: tableName
      }
    }, {
      parse: true,
      configModel: this.configModel
    });
    this.layerDefinitionModel.isEmpty = function () {
      return isLayerEmpty;
    };

    this.stateDefinitionModel = {
      key: 'value'
    };

    this.tableNodeModel = null;

    this.queryGeometryModel = new Backbone.Model({
      simple_geom: simple_geom
    });
    this.queryGeometryModel.hasValue = function () {
      return !!this.get('simple_geom');
    };

    this.querySchemaModel = new Backbone.Model({
      query: ''
    });

    var sourceNode = new Backbone.Model({
      type: 'source',
      table_name: tableName
    });
    sourceNode.queryGeometryModel = this.queryGeometryModel;
    sourceNode.querySchemaModel = this.querySchemaModel;

    this.nodeModelSpy = spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel');
    this.nodeModelSpy.and.returnValue(sourceNode);

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

    it('should show zoom icon when there is geometry', function () {
      createView.call(this, {});

      this.view.render();
      expect(this.view.$('.js-zoom')[0].style['display']).not.toBe('none');
    });

    it('should hide zoom icon when there is no geometry', function () {
      createView.call(this, {
        simple_geom: ''
      });

      this.view.render();
      expect(this.view.$('.js-zoom')[0].style['display']).toBe('none');
    });

    it('should show warning icon when there is no geometry', function () {
      createView.call(this, {
        isLayerEmpty: true
      });

      this.view.render();
      expect(this.view.$el.find('.js-emptylayer').length).toBe(1);
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

    it('should call _showOrHideZoomVisibility when zoom visibility changes', function () {
      createView.call(this, {
        simple_geom: ''
      });
      spyOn(this.view, '_showOrHideZoomVisibility');
      this.view._bindEvents();

      this.queryGeometryModel.set('simple_geom', 'line');
      this.view._checkIfGeometryVisible();

      expect(this.view._showOrHideZoomVisibility).toHaveBeenCalled();
    });
  });

  describe('._onSourceChanged', function () {
    it('should bind to geometry changes', function () {
      createView.call(this, {});

      this.view._onSourceChanged();

      expect(this.view._topQueryGeometryModel._events['change:simple_geom'][0].callback).toBeTruthy();
    });

    it('should call _checkIfGeometryVisible', function () {
      createView.call(this, {});
      spyOn(this.view, '_checkIfGeometryVisible');

      this.view._onSourceChanged();

      expect(this.view._checkIfGeometryVisible).toHaveBeenCalled();
    });
  });

  describe('._isQueryGeometryVisible', function () {
    it('should return false is there is no simple geom', function () {
      createView.call(this, {});

      var result = this.view._isQueryGeometryVisible();

      expect(result).toBe(true);
    });

    it('should return true is there is simple geom', function () {
      createView.call(this, {
        simple_geom: ''
      });

      var result = this.view._isQueryGeometryVisible();

      expect(result).toBe(false);
    });
  });

  describe('._checkIfGeometryVisible', function () {
    it('should set zoomVisible to false is there is no simple geom', function () {
      createView.call(this, {});

      this.view._checkIfGeometryVisible();

      expect(this.view._uiModel.get('zoomVisible')).toBe(true);
    });

    it('should set zoomVisible to true is there is simple geom', function () {
      createView.call(this, {
        simple_geom: ''
      });

      this.view._checkIfGeometryVisible();

      expect(this.view._uiModel.get('zoomVisible')).toBe(false);
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
      createView.call(this, {});
      var theView = this.view;

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
      createView.call(this, {});
      this.view.render();

      this.view._showOrHideZoomVisibility();

      expect(this.view.$('.js-zoom')[0].style['display']).not.toBe('none');
    });

    it('should hide zoom icon if there is not geometry', function () {
      createView.call(this, {
        simple_geom: ''
      });
      this.view.render();

      this.view._showOrHideZoomVisibility();

      expect(this.view.$('.js-zoom')[0].style['display']).toBe('none');
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
});
