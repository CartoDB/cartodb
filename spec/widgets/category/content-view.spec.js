var specHelper = require('../../spec-helper');
var _ = require('underscore');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryContentView = require('../../../src/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
      column: 'col',
      source: {
        id: 'a0'
      }
    });
    this.dataviewModel.getLayerName = function () {
      return '< & ><h1>Hello</h1>';
    };
    this.model = new CategoryWidgetModel({
      title: 'Categories of something',
      hasInitialState: true
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
    expect(_.size(this.view._subviews)).toBe(7);
  });

  it('should show source when show_source is true', function () {
    expect(this.view.$('.CDB-Widget-info').length).toBe(1);
    this.model.set('show_source', true);
    this.view.render();
    expect(this.view.$('.CDB-Widget-info').length).toBe(2);
    expect(this.view.$('.u-altTextColor').html()).toBe('&lt; &amp; &gt;&lt;h1&gt;Hello&lt;/h1&gt;');
  });

  it('should render the widget when the layer name changes', function () {
    spyOn(this.view, 'render');
    this.view._initBinds();
    this.dataviewModel.layer.set('layer_name', 'Hello');
    expect(this.view.render).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.clean();
  });
});
