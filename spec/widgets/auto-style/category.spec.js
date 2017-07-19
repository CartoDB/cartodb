var specHelper = require('../../spec-helper');
var _ = require('underscore');
var CategoryAutoStyler = require('../../../src/widgets/auto-style/category.js');
var Backbone = require('backbone');

describe('src/widgets/auto-style/category', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    this.dataview = new Backbone.Model({
      data: [
        { name: 'soccer' },
        { name: 'basketball' },
        { name: 'baseball' },
        { name: 'handball' },
        { name: 'hockey' }
      ],
      column: 'something'
    });

    this.layer = this.dataview.layer = layer;
    this.categoryAutoStyler = new CategoryAutoStyler(this.dataview);

    // Trick to set colors properly in this test
    this.updateColorsByData = function () {
      this.categoryAutoStyler.colors.updateData(_.pluck(this.dataview.get('data'), 'name'));
    }.bind(this);

    this.updateColorsByData();
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.dataview.layer.set('initialStyle', '#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: #e49115;  polygon-fill-opacity: 0.9; }');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74"), ("soccer", "basketball", "baseball", "handball", "hockey"));  polygon-fill-opacity: 0.9; }');
    });

    it('should generate the right styles when layer has points', function () {
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74"), ("soccer", "basketball", "baseball", "handball", "hockey"));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });

    it('should generate the right styles when layer has lines', function () {
      this.dataview.layer.set('initialStyle', '#layer {  line-width: 0.5;  line-color: #fcfafa;  line-opacity: 1; }');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  line-width: 0.5;  line-color: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74"), ("soccer", "basketball", "baseball", "handball", "hockey"));  line-opacity: 1; }');
    });

    it('should generate unique attr style when layer has multiple attrs', function () {
      this.dataview.layer.set('initialStyle', '#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: #e49115;  polygon-fill-opacity: 0.9; [random > 0.5] { polygon-fill: #adadad; } }');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74"), ("soccer", "basketball", "baseball", "handball", "hockey"));  polygon-fill-opacity: 0.9; [random > 0.5] { } }');
    });

    it('should escape double quotes correctly', function () {
      var data = this.dataview.get('data');
      data.push({ name: 'Oh"Yeah' });
      this.dataview.set('data', data);
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      this.updateColorsByData();
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74", "#A5AA99"), ("soccer", "basketball", "baseball", "handball", "hockey", "Oh\\"Yeah"));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });

    it('should not escape single quotes', function () {
      var data = this.dataview.get('data');
      data.push({ name: "Oh'Yeah" });
      this.dataview.set('data', data);
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      this.updateColorsByData();
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74", "#A5AA99"), ("soccer", "basketball", "baseball", "handball", "hockey", "Oh\'Yeah"));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });

    it('should generate proper CartoCSS when Others is included', function () {
      var data = this.dataview.get('data');
      data.push({ name: 'Others', agg: true });
      this.dataview.set('data', data);
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      this.updateColorsByData();
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: ramp([something], ("#7F3C8D", "#11A579", "#3969AC", "#F2B701", "#E73F74", "#A5AA99"), ("soccer", "basketball", "baseball", "handball", "hockey"));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });
  });
});
