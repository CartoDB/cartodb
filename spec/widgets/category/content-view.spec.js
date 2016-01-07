var cdb = require('cartodb.js');
var CategoryFilter = require('../../../src/windshaft/filters/category');
var CategoryDataviewModel = require('../../../src/dataviews/category-dataview-model');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryContentView = require('../../../src/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  beforeEach(function () {
    this.filter = new CategoryFilter();
    this.dataviewModel = new CategoryDataviewModel({
      id: 'widget_3'
    }, {
      filter: this.filter,
      layer: new cdb.core.Model()
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

  it('should render ifine', function () {
    expect(this.renderResult).toBe(this.view);
  });

  afterEach(function () {
    this.view.clean();
  });
});
