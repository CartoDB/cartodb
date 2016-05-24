var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindows-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowClickView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-click-view');
var InfowindowHoverView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-hover-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindows-view', function () {
  var view;

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
      infowindow: {}
    }, {
      parse: true,
      configModel: this.configModel
    });

    view = new InfowindowsView({
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel
    });
    view.render();
  });

  it('should render two tabs', function () {
    expect(view._layerTabPaneView).toBeDefined();
    expect(_.size(view._layerTabPaneView._subviews)).toBe(3); // 2 tabs, 1 pane
    expect(view.$('.CDB-NavSubmenu .CDB-NavSubmenu-item').length).toBe(2);
  });

  describe('infowindows tabs', function () {
    var model;

    beforeEach(function () {
      model = new InfowindowDefinitionModel({}, {
        configModel: this.configModel
      });
    });

    it('infowindow should renderproperly', function () {
      var view = new InfowindowClickView({
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: this.querySchemaModel,
        layerInfowindowModel: model,
        toggleLabels: {
          off: 'VALUES',
          on: 'HTML'
        }
      });

      view.render();
      expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
    });

    it('tooltip should renderproperly', function () {
      var view = new InfowindowHoverView({
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: this.querySchemaModel,
        layerInfowindowModel: model,
        toggleLabels: {
          off: 'VALUES',
          on: 'HTML'
        }
      });

      view.render();
      expect(_.size(view._subviews)).toBe(1); // fields / codemirror view
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
