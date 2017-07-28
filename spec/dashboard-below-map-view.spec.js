var Backbone = require('backbone');
var DashboardBelowMapView = require('../src/dashboard-below-map-view');

describe('dashboard-below-map-view', function () {
  beforeEach(function () {
    this.widgetsCollection = new Backbone.Collection();
    this.view = new DashboardBelowMapView({
      widgets: this.widgetsCollection
    });
    this.view = this.view.render();
  });

  it('should be hidden since there are no widgets initially', function () {
    expect(this.view.$el.attr('style')).toContain('none');
  });

  describe('when a time-series widget is added', function () {
    beforeEach(function () {
      var timeSeriesWidgetModelFake = new Backbone.Model({
        type: 'time-series'
      });
      timeSeriesWidgetModelFake.dataviewModel = new Backbone.Model({
        source: {
          id: 'a0'
        }
      });
      timeSeriesWidgetModelFake.dataviewModel.getUnfilteredDataModel = function () {
        return new Backbone.Model();
      };
      timeSeriesWidgetModelFake.dataviewModel.getUnfilteredData = function () {
        return {};
      };
      timeSeriesWidgetModelFake.dataviewModel.getSourceType = function () {
        return '';
      };
      timeSeriesWidgetModelFake.dataviewModel.getLayerName = function () {
        return '';
      };
      timeSeriesWidgetModelFake.dataviewModel.layer = new Backbone.Model();
      this.widgetsCollection.add(timeSeriesWidgetModelFake);
    });

    it('should render view', function () {
      expect(this.view.$el.attr('style')).not.toContain('none');
    });
  });
});
