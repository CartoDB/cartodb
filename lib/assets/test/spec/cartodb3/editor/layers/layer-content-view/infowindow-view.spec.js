var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindow-view', function () {
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

    view = new InfowindowView({
      configModel: this.configModel,
      editorModel: new cdb.core.Model(),
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      templateStyles: []
    });
    view.render();
  });

  it('should render two infowindow types, click and hover', function () {
    expect(view._layerTabPaneView).toBeDefined();
    expect(_.size(view._layerTabPaneView._subviews)).toBe(3); // 2 tabs, 1 pane
    expect(view.$('.CDB-NavSubmenu .CDB-NavSubmenu-item').length).toBe(2);
  });

  describe('infowindow tab', function () {
    var view, model;

    beforeEach(function () {
      model = new InfowindowDefinitionModel({}, {
        configModel: this.configModel
      });

      view = new InfowindowContentView({
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: this.querySchemaModel,
        layerInfowindowModel: model,
        templateStyles: []
      });
    });

    it('should render/add style + fields', function () {
      view.render();
      expect(_.size(view._subviews)).toBe(2); // style carousel, and infowindow fields
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
