var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var _ = require('underscore');

describe('editor/layers/layer-content-view/infowindow-view', function () {
  var view, model;

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
    this.querySchemaModel.columnsCollection.reset([
      { name: 'name1', type: 'string', position: 0 },
      { name: 'name2', type: 'number', position: 1 },
      { name: 'name3', type: 'number', position: 2 }
    ]);

    model = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      },
      infowindow: {
        'fields': [
          {
            'name': 'description',
            'title': true,
            'position': 0
          },
          {
            'name': 'name',
            'title': true,
            'position': 1
          }
        ],
        'template_name': 'infowindow_light',
        'template': '',
        'alternative_names': {},
        'width': 226,
        'maxHeight': 180
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    view = new InfowindowView({
      configModel: this.configModel,
      layerDefinitionModel: model,
      querySchemaModel: {
        querySchemaModel: this.querySchemaModel
      }
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
      model = new InfowindowDefinitionModel({
        fields: [{ name: 'name1', position: 0 }],
        template: '<div>test</div>'
      }, {
        configModel: this.configModel
      });

      view = new InfowindowContentView({
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: {
          querySchemaModel: this.querySchemaModel
        },
        layerInfowindowModel: model
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
