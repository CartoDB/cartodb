var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindows-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-click-view');
var TooltipView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-hover-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var EditorModel = require('../../../../../../javascripts/cartodb3/data/editor-model');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('editor/layers/layer-content-view/infowindows-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel
    });
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: this.configModel,
      vizId: 'viz-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: new Backbone.Collection()
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });
    this.querySchemaModel.columnsCollection.reset([
      {
        type: 'number',
        name: 'cartodb_id'
      }, {
        type: 'number',
        name: 'a_number'
      }
    ]);
  });

  describe('when layer has infowindowModel', function () {
    beforeEach(function () {
      this.layerDefinitionModel = new LayerDefinitionModel({
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
        configModel: this.configModel
      });
      spyOn(this.layerDefinitionModel, 'save');

      this.view = new InfowindowsView({
        configModel: this.configModel,
        editorModel: new EditorModel(),
        userActions: new UserActions({
          userModel: {},
          analysisDefinitionsCollection: this.analysisDefinitionsCollection,
          analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
          layerDefinitionsCollection: {},
          widgetDefinitionsCollection: {}
        }),
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: this.querySchemaModel
      });

      this.view.render();
    });

    it('should render two tabs', function () {
      expect(this.view._layerTabPaneView).toBeDefined();
      expect(_.size(this.view._layerTabPaneView._subviews)).toBe(3); // 2 tabs, 1 pane
      expect(this.view.$('.CDB-NavSubmenu .CDB-NavSubmenu-item').length).toBe(2);
      expect(this.view.$('.CDB-NavSubmenu-item:eq(0)').text()).toContain('editor.layers.infowindow-menu-tab-pane-labels.click');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.none');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(1)').text()).toContain('editor.layers.infowindow-menu-tab-pane-labels.hover');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toContain('editor.layers.tooltip.style.none');
    });

    it('should change tab if infowindow (and tooltip) changes', function () {
      expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.none');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');
      this.view._layerInfowindowModel.set('template_name', 'infowindow_dark');

      this.view.render();

      expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_dark');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');

      // change tab and change template_name, '.js-menu .CDB-NavSubmenu-item.is-selected .js-NavSubmenu-status' is needed
      this.view._layerTabPaneView.collection.at(1).set('selected', true);
      this.view._layerTooltipModel.set('template_name', 'tooltip_dark');

      this.view.render();

      expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_dark');
      expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.tooltip_dark');
    });

    describe('infowindows tabs', function () {
      var model;

      beforeEach(function () {
        model = new InfowindowDefinitionModel({}, {
          configModel: this.configModel
        });
      });

      it('infowindow should render properly', function () {
        var view = new InfowindowView({
          layerDefinitionModel: this.layerDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          userActions: {},
          model: model,
          editorModel: new EditorModel()
        });

        view.render();
        expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
      });

      it('tooltip should render properly', function () {
        var view = new TooltipView({
          layerDefinitionModel: this.layerDefinitionModel,
          querySchemaModel: this.querySchemaModel,
          userActions: {},
          model: model,
          editorModel: new EditorModel()
        });

        view.render();
        expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
      });
    });

    it('should render placeholder if style model type is aggregated', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      this.view._layerDefinitionModel.styleModel.set('type', 'heatmap', {silent: true});
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      this.view._layerDefinitionModel.styleModel.set('type', 'squares', {silent: true});
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    // FIXME
    xit('should render placeholder if style model has animated enabled', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      var animatedAttrs = _.clone(this.view._layerDefinitionModel.styleModel.get('animated'));
      animatedAttrs.enabled = true;
      this.view._layerDefinitionModel.styleModel.set('animated', animatedAttrs, {silent: true});
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    it('should render placeholder when querySchemaModel is unfetched', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      this.view._querySchemaModel.set('status', 'unfetched');
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-columns-text');
    });

    it('should render placeholder when has no columns', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      this.view._querySchemaModel.columnsCollection.reset([
        {
          type: 'number',
          name: 'cartodb_id'
        }
      ]);
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-columns-text');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when layer doesn\'t have infowindowModel (basemap, torque, ...)', function () {
    beforeEach(function () {
      this.layerDefinitionModel = new LayerDefinitionModel({
        id: 'l-1',
        fetched: true,
        options: {
          type: 'CartoDB',
          table_name: 'foo',
          cartocss: 'asd',
          source: 'a0'
        }
      }, {
        parse: true,
        configModel: this.configModel
      });
      spyOn(this.layerDefinitionModel, 'save');

      this.view = new InfowindowsView({
        configModel: this.configModel,
        editorModel: new EditorModel(),
        userActions: {},
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: this.querySchemaModel
      });

      this.view.render();
    });

    it('should render placeholder', function () {
      expect(this.view._layerTabPaneView).not.toBeDefined();
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toBe('editor.layers.infowindow.placeholder-interactivity-text');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });
});
