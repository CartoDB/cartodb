var specHelper = require('../../spec-helper');
var HistogramWidgetModel = require('../../../../../javascripts/deep-insights/widgets/histogram/histogram-widget-model');

describe('widgets/histogram/histogram-widget-model', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var source = vis.analysis.findNodeById('a0');
    this.layerModel = vis.map.layers.first();
    this.dataviewModel = vis.dataviews.createHistogramModel({
      column: 'col',
      source: source
    });
    this.widgetModel = new HistogramWidgetModel({}, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel
    }, {autoStyleEnabled: true});
  });

  describe('when model is set to collapsed', function () {
    beforeEach(function () {
      this.widgetModel.set('collapsed', true);
    });

    it('should disable dataview', function () {
      expect(this.widgetModel.dataviewModel.get('enabled')).toBe(false);
    });

    describe('when model is expanded', function () {
      beforeEach(function () {
        this.widgetModel.set('collapsed', false);
      });

      it('should enable dataview', function () {
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });
  });
});
