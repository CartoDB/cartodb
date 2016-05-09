var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var InfowindowView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-content-view');
var InfowindowContentItemsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-items-view');
var InfowindowDefinitionModel = require('../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var $ = require('jquery');
var _ = require('underscore');
require('jquery-ui/sortable');

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

    // Infowindow style

    // Infowindow fields
    describe('infowindow fields', function () {
      var view, model;

      beforeEach(function () {
        model = new InfowindowDefinitionModel({}, {
          configModel: this.configModel
        });

        view = new InfowindowContentItemsView({
          querySchemaModel: {
            querySchemaModel: this.querySchemaModel
          },
          layerInfowindowModel: model
        });
      });

      it('should render fields', function () {
        view.render();
        expect(view.$el.find('li').length).toEqual(3);
      });

      it('should toggle checks', function () {
        view.render();
        model.addField('name1').addField('name2');
        expect(!!$(view.$el.find('.js-checkbox')[0]).attr('checked')).toEqual(true);
        expect(!!$(view.$el.find('.js-checkbox')[1]).attr('checked')).toEqual(true);
        model.removeField('name1');
        expect(!!$(view.$el.find('.js-checkbox')[0]).attr('checked')).toEqual(false);
        expect(!!$(view.$el.find('.js-checkbox')[1]).attr('checked')).toEqual(true);
      });

      it('should assign fields positions when there are no fields selected', function () {
        view.render();
        var i = 0;
        _.each(view.infowindowFieldsView._subviews, function (v) {
          expect(v.position).toEqual(i);
          ++i;
        });
      });

      it('should remember the position of the fields after reordering', function () {
        model.set('fields', [
          { name: 'name2', position: 0 },
          { name: 'name1', position: 1 }
        ]);

        view.render();
        expect(model.fieldCount()).toEqual(2);

        // Drag and drop one field
        var firstField = view.$el.find('.js-field')[0];
        view.$el.append(firstField);
        view.infowindowFieldsView._onSortableFinish();

        expect(model.fieldCount()).toEqual(3);

        // Fields are in the right position
        expect(model.getFieldPos('name1')).toEqual(0);
        expect(model.getFieldPos('name3')).toEqual(1);
        expect(model.getFieldPos('name2')).toEqual(2);
      });

      it('should toggle fields on click', function () {
        view.render();
        model.addField('name1').addField('name2');
        $(view.$el.find('.js-checkbox')[0]).trigger('click');
        expect(model.containsField('name1')).toEqual(false);
        expect(model.containsField('name2')).toEqual(true);
      });

      it("should show no content panel when there isn't any column in the schema", function () {
        view.render();
        view.infowindowFieldsView._columnsCollection.reset();
        expect(view.$('li').length).toBe(0);
      });
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
