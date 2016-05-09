var specHelper = require('../../spec-helper');
var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var ItemView = require('../../../src/widgets/category/list/item/item-view');

describe('widgets/category/item-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new ItemView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel,
      model: new cdb.core.Model({
        name: 'USA'
      })
    });
  });

  it('should add selected class when selected', function () {
    this.dataviewModel.filter.accept('USA');
    this.view.render();
    expect(this.view.$('.CDB-Widget-progressState').hasClass('is-accepted')).toBeTruthy();
  });
});
