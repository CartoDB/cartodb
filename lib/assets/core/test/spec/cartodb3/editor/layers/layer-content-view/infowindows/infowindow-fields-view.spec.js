var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var InfowindowFieldsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-fields-view');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
require('jquery-ui');

describe('editor/layers/layer-content-view/infowindows/infowindow-fields-view', function () {
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

    model = new InfowindowDefinitionModel({}, {
      configModel: this.configModel
    });

    view = new InfowindowFieldsView({
      querySchemaModel: this.querySchemaModel,
      model: model,
      layerDefinitionModel: this.layerDefinitionModel
    });
  });

  it('should render fields', function () {
    view._querySchemaModel.columnsCollection.reset([
      { name: 'name1', type: 'string', position: 0 },
      { name: 'name2', type: 'number', position: 1 },
      { name: 'name3', type: 'number', position: 2 }
    ]);

    view.render();
    expect(view.$el.find('li').length).toEqual(3);
  });

  it('should render description', function () {
    view.render();
    expect(view.$el.find('.js-textInfo').length).toEqual(1);
  });

  describe('sortable', function () {
    beforeEach(function () {
      view._querySchemaModel.columnsCollection.reset([
        { name: 'name1', type: 'string', position: 0 },
        { name: 'name2', type: 'number', position: 1 }
      ]);

      view.model.addField('name1', 0);
      view.model.addField('name2', 1);
    });

    it('should unselect/select all', function () {
      view.render();
      expect(view.model.attributes.fields.length).toEqual(2);
      view._fieldsDescriptionView.trigger('toggle');
      expect(view.model.attributes.fields.length).toEqual(0);
      view._fieldsDescriptionView.trigger('toggle');
      expect(view.model.attributes.fields.length).toEqual(2);
    });

    it('should be initialized when view is rendered', function () {
      spyOn(view, '_initSortable').and.callThrough();
      view.render();
      expect(view._initSortable).toHaveBeenCalled();
      expect(view.$('.js-fields').data('ui-sortable')).not.toBeUndefined();
    });

    it('should update the order of the models when sort has finished', function () {
      view.render();
      // Impossible to fake sortable behaviour so...
      view.$('.js-field:eq(1)').insertBefore(view.$('.js-field:eq(0)'));
      view._onSortableFinish();
      // End of fake sortable
      expect(view.model.getFieldPos('name2')).toBe(0);
      expect(view.model.getFieldPos('name1')).toBe(1);
    });
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
