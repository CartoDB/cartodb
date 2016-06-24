var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindows-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-click-view');
var TooltipView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-hover-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var _ = require('underscore');
var EditorModel = require('../../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layer-content-view/infowindows-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      },
      infowindow: {},
      tooltip: {}
    }, {
      parse: true,
      configModel: this.configModel
    });
    spyOn(this.layerDefinitionModel, 'save');

    this.view = new InfowindowsView({
      configModel: this.configModel,
      editorModel: new EditorModel(),
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
    expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_light');
    expect(this.view.$('.CDB-NavSubmenu-item:eq(1)').text()).toContain('editor.layers.infowindow-menu-tab-pane-labels.hover');
    expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toContain('editor.layers.tooltip.style.none');
  });

  it('should change tab if infowindow (and tooltip) changes', function () {
    expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_light');
    expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');
    this.view._layerInfowindowModel.set('template_name', 'infowindow_dark');
    expect(this.view.$('.CDB-NavSubmenu-item:eq(0) .CDB-NavSubmenu-status').text()).toBe('editor.layers.infowindow.style.infowindow_dark');
    expect(this.view.$('.CDB-NavSubmenu-item:eq(1) .CDB-NavSubmenu-status').text()).toBe('editor.layers.tooltip.style.none');
    this.view._layerTooltipModel.set('template_name', 'tooltip_dark');
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
        model: model,
        editorModel: new EditorModel()
      });

      view.render();
      expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
