var specHelper = require('../../spec-helper');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryContentView = require('../../../src/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {});
    this.model = new CategoryWidgetModel({
      title: 'Categories of something'
    }, {
      dataviewModel: this.dataviewModel
    });

    this.view = new CategoryContentView({
      model: this.model
    });
    this.renderResult = this.view.render();
  });

  it('should render ifine', function () {
    expect(this.renderResult).toBe(this.view);
  });

  afterEach(function () {
    this.view.clean();
  });
});
