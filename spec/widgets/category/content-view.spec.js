var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryContentView = require('../../../src/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
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
