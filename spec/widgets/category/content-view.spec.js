var specHelper = require('../../spec-helper');
var _ = require('underscore');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryContentView = require('../../../src/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
      column: 'col'
    });
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

  it('should render fine', function () {
    expect(this.renderResult).toBe(this.view);
  });

  it('should render category stats if show_stats is enabled', function () {
    expect(_.size(this.view._subviews)).toBe(6);
    this.model.set('show_stats', true);
    this.view.render();
    expect(_.size(this.view._subviews)).toBe(7);
    expect(this.view.$('.CDB-Widget-info').length).toBe(1);
  });

  afterEach(function () {
    this.view.clean();
  });
});
