var Backbone = require('backbone');
var specHelper = require('./spec-helper');
var DashboardSidebarView = require('../../../javascripts/deep-insights/dashboard-sidebar-view');
var CategoryWidgetModel = require('../../../javascripts/deep-insights/widgets/category/category-widget-model');
var CategoryWidgetView = require('../../../javascripts/deep-insights/widgets/category/content-view');
var WidgetViewFactory = require('../../../javascripts/deep-insights/widgets/widget-view-factory');
var cdb = require('internal-carto.js');

describe('dashboard-sidebar-view', function () {
  beforeEach(function () {
    this.widgetsCollection = new Backbone.Collection();

    // Add Widget Mock
    var vis = specHelper.createDefaultVis();
    var layerModel = vis.map.layers.first();
    layerModel.restoreCartoCSS = jasmine.createSpy('restore');
    layerModel.getGeometryType = function () {
      return 'polygon';
    };

    var source = vis.analysis.findNodeById('a0');
    var dataviewModel = vis.dataviews.createCategoryModel({
      column: 'col',
      source: source
    });
    dataviewModel.set('data', [
      { name: 'foo' },
      { name: 'bar' }
    ]);

    spyOn(CategoryWidgetModel.prototype, '_updateAutoStyle').and.callThrough();

    this.widgetModel = new CategoryWidgetModel(
      {},
      {
        dataviewModel: dataviewModel,
        layerModel: layerModel
      },
      { autoStyleEnabled: true }
    );

    this.widgetsCollection.add(this.widgetModel);

    this.view = new DashboardSidebarView({
      widgets: this.widgetsCollection,
      model: new cdb.core.Model({
        renderMenu: true
      })
    });
  });

  describe('when render', function () {
    beforeEach(function () {
      var widgetView = new CategoryWidgetView({
        model: this.widgetModel
      });
      spyOn(widgetView, 'render').and.returnValue({ el: document.createElement('div') });

      this.containerMock = {
        append: jasmine.createSpy()
      };
      spyOn(this.view, '_$container').and.returnValue(this.containerMock);
      spyOn(this.view, '_cleanScroll');
      spyOn(this.view, '_bindScroll');
      spyOn(WidgetViewFactory.prototype, 'createWidgetView').and.returnValue(widgetView);

      this.view.render();
    });

    it('should create widgets subviews', function () {
      expect(this.view.el.querySelector('.Widget-canvas')).toBeDefined();
      expect(this.view.el.querySelector('.Dashboard-belowMap')).toBeDefined();
    });

    it('should render widgets stacked one below another', function () {
      expect(this.containerMock.append).toHaveBeenCalled();
    });

    it('should render added widget on top of the existing ones', function () {
      this.widgetsCollection.add(this.widgetModel);

      expect(this.containerMock.append).toHaveBeenCalled();
    });
  });
});
