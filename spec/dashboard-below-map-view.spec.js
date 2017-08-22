var _ = require('underscore');
var Backbone = require('backbone');
var DashboardBelowMapView = require('../src/dashboard-below-map-view');
var TimeSeriesContentView = require('../src/widgets/time-series/content-view');
var TorqueTimeSeriesContentView = require('../src/widgets/time-series/torque-content-view');

var createFakeTimeSeriesWidgetModel = function (attrs) {
  attrs = _.extend({}, attrs, {
    type: 'time-series'
  });

  return new Backbone.Model(attrs);
};

var createFakeDataviewModel = function (attrs) {
  attrs = _.extend({}, {
    source: {
      id: 'a0'
    }
  }, attrs);

  var dataview = new Backbone.Model(attrs);

  dataview.getUnfilteredDataModel = function () {
    return new Backbone.Model();
  };
  dataview.getUnfilteredData = function () {
    return {};
  };
  dataview.getSourceType = function () {
    return '';
  };
  dataview.getLayerName = function () {
    return '';
  };

  return dataview;
};

var createFakeDataviewLayer = function (attrs) {
  return new Backbone.Model(attrs);
};

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
      var timeSeriesWidgetModelFake = createFakeTimeSeriesWidgetModel();
      timeSeriesWidgetModelFake.dataviewModel = createFakeDataviewModel();
      timeSeriesWidgetModelFake.dataviewModel.layer = createFakeDataviewLayer();
      this.widgetsCollection.add(timeSeriesWidgetModelFake);
    });

    it('should render view', function () {
      expect(this.view.$el.attr('style')).not.toContain('none');
    });
  });

  describe('widgetFactory', function () {
    var getDefinitions = function (view, model) {
      return _.find(view._widgetViewFactory.defs, function (def) {
        return def.match(model);
      });
    };

    beforeEach(function () {
      spyOn(TimeSeriesContentView.prototype, 'initialize');
      spyOn(TorqueTimeSeriesContentView.prototype, 'initialize');
    });

    it('should create time series widget if not has animated styles', function () {
      this.model = createFakeTimeSeriesWidgetModel({
        animated: false
      });
      this.model.dataviewModel = createFakeDataviewModel();
      this.model.dataviewModel.layer = createFakeDataviewLayer({
        type: 'torque'
      });

      var def = getDefinitions(this.view, this.model);
      def.createContentView(this.model);

      expect(TimeSeriesContentView.prototype.initialize).toHaveBeenCalled();
      expect(TorqueTimeSeriesContentView.prototype.initialize).not.toHaveBeenCalled();
    });

    it('should create torque time series widget if has animated styles', function () {
      this.model = createFakeTimeSeriesWidgetModel({
        animated: true
      });
      this.model.dataviewModel = createFakeDataviewModel();
      this.model.dataviewModel.layer = createFakeDataviewLayer({
        type: 'torque'
      });

      var def = getDefinitions(this.view, this.model);
      def.createContentView(this.model);

      expect(TimeSeriesContentView.prototype.initialize).not.toHaveBeenCalled();
      expect(TorqueTimeSeriesContentView.prototype.initialize).toHaveBeenCalled();
    });
  });
});
