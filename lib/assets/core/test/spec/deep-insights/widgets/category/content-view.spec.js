var specHelper = require('../../spec-helper');
var _ = require('underscore');
var CategoryWidgetModel = require('../../../../../javascripts/deep-insights/widgets/category/category-widget-model');
var CategoryContentView = require('../../../../../javascripts/deep-insights/widgets/category/content-view');

describe('widgets/category/content-view', function () {
  var view, model, layerModel, dataviewModel;

  var createViewFn = function (options) {
    var vis = specHelper.createDefaultVis();
    var source = vis.analysis.findNodeById('a0');

    dataviewModel = vis.dataviews.createCategoryModel({
      column: 'col',
      source: source
    });

    layerModel = vis.map.layers.first();
    layerModel.set('layer_name', '< & ><h1>Hello</h1>');

    model = new CategoryWidgetModel({
      title: 'Categories of something',
      hasInitialState: true
    }, {
      dataviewModel: dataviewModel,
      layerModel: layerModel
    });

    view = new CategoryContentView({
      model: model
    });

    return view;
  };

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(this.renderResult).toBe(this.view);
      expect(view.$('.js-header').length).toBe(1);
      expect(view.$('.js-content').length).toBe(1);
      expect(view.$('.js-footer').length).toBe(1);
      expect(_.size(view._subviews)).toBe(7);
    });
  });

  afterEach(function () {
    view.clean();
  });
});
