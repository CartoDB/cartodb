var HistogramAutoStyler = require('../../../src/widgets/auto-style/histogram.js');
var Backbone = require('backbone');
var specHelper = require('../../spec-helper');

describe('src/widgets/auto-style/histogram', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    this.dataview = new Backbone.Model({
      column: 'something'
    });

    this.dataview.getDistributionType = jasmine.createSpy('disttype').and.returnValue('F');
    this.dataview.getUnfilteredDataModel = jasmine.createSpy('disttype').and.returnValue(this.dataview);
    this.layer = this.dataview.layer = layer;
    this.histogramAutoStyler = new HistogramAutoStyler(this.dataview);
  });

  describe('.getDef', function () {
    it('should generate ramps correctly', function () {
      var styles = {
        custom: false
      };
      this.histogramAutoStyler.styles = styles;
      var definition = this.histogramAutoStyler.getDef('#layer {  marker-width: 6;  marker-fill: #e49115;}');
      expect(definition.point).toBeDefined();
      expect(definition.point.color.range.length).toBe(7);
    });

    it('should take into account custom ramps', function () {
      var styles = {
        custom: true,
        definition: {
          color: {
            range: ['#fadaba', '#fff']
          }
        }
      };
      this.histogramAutoStyler.styles = styles;
      var definition = this.histogramAutoStyler.getDef('#layer {  marker-width: 6;  marker-fill: #e49115;}');
      expect(definition.point).toBeDefined();
      expect(definition.point.color.range.length).toBe(2);
    });
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.dataview.layer.set('initialStyle', '#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: #e49115;  polygon-fill-opacity: 0.9; }');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });

    it('should generate the right styles when layer has points', function () {
      this.dataview.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });

    it('should generate the right styles when layer has lines', function () {
      this.dataview.layer.set('initialStyle', '#layer {  line-width: 0.5;  line-color: #fcfafa;  line-opacity: 1; }');
      expect(this.histogramAutoStyler.getStyle().replace(/\s/g, '').indexOf('{{')).toBeLessThan(0);
    });
  });

  describe('.updateSyle', function () {
    it('should set auto_style to styles given', function () {
      var styles = {
        auto_style: {
          opacity: 0.2
        }
      };
      this.histogramAutoStyler.updateStyle(styles);
      expect(this.histogramAutoStyler.styles).toEqual({ opacity: 0.2 });
    });
  });
});
