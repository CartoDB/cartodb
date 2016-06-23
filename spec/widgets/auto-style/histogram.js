var HistogramAutoStyler = require('../../../src/widgets/auto-style/histogram.js');
var Backbone = require('backbone');

describe('src/widgets/auto-style/histogram', function () {
  beforeEach(function () {
    this.dataview = new Backbone.Model({
      column: 'something'
    });

    this.dataview.getDistributionType = jasmine.createSpy('disttype').and.returnValue('F');
    this.layer = this.dataview.layer = jasmine.createSpyObj('layer', ['getGeometryType', 'get']);
    this.histogramAutoStyler = new HistogramAutoStyler(this.dataview);
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.layer.getGeometryType.and.returnValue('polygon');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });

    it('should generate the right styles when layer has points', function () {
      this.layer.getGeometryType.and.returnValue('marker');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });

    it('should preserve the previous marker widths if they were formed with turbocarto', function () {
      this.layer.getGeometryType.and.returnValue('marker');
      this.layer.get.and.returnValue('#layer {  marker-line-width: 0.5;  marker-line-color: #1e1e1e;  marker-line-opacity: 1;  marker-width: 3;  marker-fill: #b7f2de;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.histogramAutoStyler.getStyle().indexOf('ramp([something], cartocolor(')).not.toBeLessThan(0);
    });

    it('should generate the right styles when layer has lines', function () {
      this.layer.getGeometryType.and.returnValue('line');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });
  });
});
