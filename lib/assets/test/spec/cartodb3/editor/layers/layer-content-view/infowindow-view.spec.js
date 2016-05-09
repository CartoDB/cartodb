var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var InfowindowContentItemsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-items-view');
var _ = require('underscore');
require('jquery-ui/sortable');

describe('editor/layers/layer-content-view/infowindow-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: configModel
    });
    this.querySchemaModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'test', type: 'string' }
    ]);

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
      configModel: configModel
    });

    this.view = new InfowindowView({
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: {
        querySchemaModel: this.querySchemaModel
      }
    });
    this.view.render();
  });

  it('should render two infowindow types, click and hover', function () {
    expect(this.view._layerTabPaneView).toBeDefined();
    expect(_.size(this.view._layerTabPaneView._subviews)).toBe(3); // 2 tabs, 1 pane
    expect(this.view.$('.CDB-NavSubmenu .CDB-NavSubmenu-item').length).toBe(2);
  });

  describe('infowindow tab', function () {
    var view;

    beforeEach(function () {
      this._layerInfowindowModel = this.layerDefinitionModel.infowindowModel;

      view = new InfowindowContentView({
        layerDefinitionModel: this.layerDefinitionModel,
        querySchemaModel: {
          querySchemaModel: this.querySchemaModel
        },
        layerInfowindowModel: this._layerInfowindowModel
      });
    });

    it('should render/add style + fields', function () {
      view.render();
      expect(_.size(view._subviews)).toBe(2); // style carousel, and infowindow fields
    });

    // Infowindow style

    // Infowindow fields
    describe('infowindow fields', function () {
      var view;

      beforeEach(function () {
        view = new InfowindowContentItemsView({
          querySchemaModel: {
            querySchemaModel: this.querySchemaModel
          },
          layerInfowindowModel: this._layerInfowindowModel
        });
      });

      it('should render fields', function () {
        view.render();
        expect(view.$el.find('li').length).toEqual(3);
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
