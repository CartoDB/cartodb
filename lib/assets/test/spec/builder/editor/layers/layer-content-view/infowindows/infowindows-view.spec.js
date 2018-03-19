var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var InfowindowsView = require('builder/editor/layers/layer-content-views/infowindow/infowindows-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var InfowindowView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-click-view');
var TooltipView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-hover-view');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');
var EditorModel = require('builder/data/editor-model');
var UserActions = require('builder/data/user-actions');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('builder/data/analysis-definitions-collection');
var QueryRowsCollection = require('builder/data/query-rows-collection');

describe('editor/layers/layer-content-view/infowindow/infowindows-view', function () {
  var view, configModel, layerDefinitionModel, querySchemaModel, layerContentModel;

  var createViewFn = function (options) {
    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });
    spyOn(userModel, 'featureEnabled').and.returnValue(true);

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    var a0 = analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    });
    spyOn(a0, 'isCustomQueryApplied').and.returnValue(false);

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm123',
      stateDefinitionModel: {}
    });

    layerContentModel = new Backbone.Model({
      state: 'initial'
    });

    var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'viz-123',
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      layerDefinitionsCollection: layerDefinitionsCollection
    });

    querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: configModel
    });
    querySchemaModel.columnsCollection.reset([
      {
        type: 'number',
        name: 'cartodb_id'
      }, {
        type: 'number',
        name: 'a_number'
      }
    ]);
    spyOn(querySchemaModel, 'fetch');

    var queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: configModel
    });
    spyOn(queryGeometryModel, 'fetch');

    var queryRowsCollection = new QueryRowsCollection([], {
      configModel: configModel,
      querySchemaModel: querySchemaModel
    });

    spyOn(queryRowsCollection, 'fetch');

    layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      },
      infowindow: {
        template_name: '',
        template: ''
      },
      tooltip: {
        template_name: '',
        template: ''
      }
    }, {
      parse: true,
      configModel: configModel
    });
    spyOn(layerDefinitionModel, 'save');
    spyOn(layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(a0);

    var defaultOptions = {
      configModel: configModel,
      editorModel: new EditorModel(),
      userActions: new UserActions({
        userModel: userModel,
        analysisDefinitionsCollection: analysisDefinitionsCollection,
        analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
        layerDefinitionsCollection: layerDefinitionsCollection,
        widgetDefinitionsCollection: {}
      }),
      layerDefinitionModel: layerDefinitionModel,
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection,
      layerContentModel: layerContentModel
    };

    view = new InfowindowsView(_.extend(defaultOptions, options));

    return view;
  };

  describe('when data is filtered', function () {
    describe('.render', function () {
      it('should call _renderFilteredData', function () {
        view = createViewFn();
        spyOn(view, '_renderFilteredData');
        view._viewState.set('isDataFiltered', true, { silent: true });
        view.render();

        expect(view._renderFilteredData).toHaveBeenCalled();
      });
    });
  });

  describe('when layer has infowindowModel', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should render two tabs', function () {
      expect(view._layerTabPaneView).toBeDefined();
      expect(_.size(view._layerTabPaneView._subviews)).toBe(3); // 2 tabs, 1 pane
      expect(view.$('.CDB-NavSubmenu .CDB-NavSubmenu-item').length).toBe(2);
      expect(view.$('.CDB-NavSubmenu-item:eq(0)').text()).toContain('editor.layers.infowindow-menu-tab-pane-labels.click');
      expect(view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.none');
      expect(view.$('.CDB-NavSubmenu-item:eq(1)').text()).toContain('editor.layers.infowindow-menu-tab-pane-labels.hover');
      expect(view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toContain('editor.layers.tooltip.style.none');
    });

    it('should change tab if infowindow (and tooltip) changes', function () {
      expect(view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.none');
      expect(view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');
      view._layerInfowindowModel.set('template_name', 'infowindow_dark');

      view.render();

      expect(view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_dark');
      expect(view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');

      // change tab and change template_name, '.js-menu .CDB-NavSubmenu-item.is-selected .js-NavSubmenu-status' is needed
      view._layerTabPaneView.collection.at(1).set('selected', true);
      view._layerTooltipModel.set('template_name', 'tooltip_dark');

      view.render();

      expect(view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_dark');
      expect(view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.tooltip_dark');
    });

    describe('infowindows tabs', function () {
      var model;

      beforeEach(function () {
        model = new InfowindowDefinitionModel({}, {
          configModel: configModel
        });
      });

      it('infowindow should render properly', function () {
        view = new InfowindowView({
          layerDefinitionModel: layerDefinitionModel,
          querySchemaModel: querySchemaModel,
          userActions: {},
          model: model,
          editorModel: new EditorModel()
        });

        view.render();

        expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
      });

      it('tooltip should render properly', function () {
        view = new TooltipView({
          layerDefinitionModel: layerDefinitionModel,
          querySchemaModel: querySchemaModel,
          userActions: {},
          model: model,
          editorModel: new EditorModel()
        });

        view.render();

        expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
      });
    });

    it('should render placeholder if style model type is aggregated', function () {
      expect(view.$('.CDB-Size-huge').length).toBe(0);

      spyOn(layerDefinitionModel.styleModel, 'isAggregatedType').and.returnValue(true);

      view.render();

      expect(view.$('.CDB-Size-huge').length).toBe(1);
      expect(view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    it('should render placeholder if style model has animated enabled', function () {
      expect(view.$('.CDB-Size-huge').length).toBe(0);

      spyOn(layerDefinitionModel.styleModel, 'isAnimation').and.returnValue(true);

      view.render();

      expect(view.$('.CDB-Size-huge').length).toBe(1);
      expect(view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    it('should render placeholder when has no columns', function () {
      expect(view.$('.CDB-Size-huge').length).toBe(0);

      querySchemaModel.columnsCollection.reset([
        {
          type: 'number',
          name: 'cartodb_id'
        }
      ]);

      view.render();

      expect(view.$('.CDB-Size-huge').length).toBe(1);
      expect(view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-columns-text');
    });

    it('should not have any leaks', function () {
      expect(view).toHaveNoLeaks();
    });
  });

  describe('when layer doesn\'t have infowindowModel (basemap, torque, ...)', function () {
    beforeEach(function () {
      view = createViewFn();
      view._layerInfowindowModel = undefined;
      view.render();
    });

    it('should render placeholder', function () {
      expect(view._layerTabPaneView).not.toBeDefined();
      expect(view.$('.CDB-Size-huge').length).toBe(1);
      expect(view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    it('should not have any leaks', function () {
      expect(view).toHaveNoLeaks();
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      spyOn(InfowindowsView.prototype, '_changeStyle');
      spyOn(InfowindowsView.prototype, '_updateSelectedChild');
      spyOn(InfowindowsView.prototype, '_setViewValues');
      spyOn(InfowindowsView.prototype, 'render').and.callThrough();

      view = createViewFn();
      view.render();
    });

    it('should call _changeStyle if _editorModel:edition changes', function () {
      view._initBinds();
      view._editorModel.trigger('change:edition');
      expect(view._changeStyle).toHaveBeenCalled();
    });

    it('should call _updateSelectedChild if _layerInfowindowModel:template changes', function () {
      view._initBinds();
      view._layerInfowindowModel.trigger('change:template');
      expect(view._updateSelectedChild).toHaveBeenCalled();
    });

    it('should call _updateSelectedChild if _layerTooltipModel:template changes', function () {
      view._initBinds();
      view._layerTooltipModel.trigger('change:template');
      expect(view._updateSelectedChild).toHaveBeenCalled();
    });

    it('should call _setViewValues if layerContentModel:state changes', function () {
      view._initBinds();
      view._layerContentModel.trigger('change:state');
      expect(view._setViewValues).toHaveBeenCalled();
    });

    it('should render if _querySchemaModel:status changes', function () {
      view._initBinds();
      view._querySchemaModel.trigger('change:status');
      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('._renderFilteredData', function () {
    it('should render the correct template', function () {
      view._renderFilteredData();

      expect(view.$el.html()).toContain('editor.layers.warnings.no-data.message');
      expect(view.$el.html()).toContain('editor.layers.warnings.no-data.action-message');
    });
  });

  describe('._setViewValues', function () {
    it('should update _viewState', function (done) {
      spyOn(view._layerDefinitionModel, 'isDataFiltered').and.returnValue(Promise.resolve(true));
      view._viewState.set('isDataFiltered', false, { silent: true });

      view._setViewValues();

      setTimeout(function () {
        expect(view._viewState.get('isDataFiltered')).toEqual(true);
        done();
      }, 0);
    });
  });
});
