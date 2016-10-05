var specHelper = require('../../spec-helper');
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
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.dataview.layer.set('initialStyle', '#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1;  polygon-fill: #e49115;  polygon-fill-opacity: 0.9; }');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  polygon-line-width: 0.5;  polygon-line-color: #fcfafa;  polygon-line-opacity: 1; polygon-fill: ramp([something], (#A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99), (\'soccer\', \'basketball\', \'baseball\', \'handball\', \'hockey\'));  polygon-fill-opacity: 0.9; }');
    });

    it('should generate the right styles when layer has points', function () {
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077; marker-fill: ramp([something], (#A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99), (\'soccer\', \'basketball\', \'baseball\', \'handball\', \'hockey\'));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });

    it('should generate the right styles when layer has lines', function () {
      this.dataview.layer.set('initialStyle', '#layer {  line-width: 0.5;  line-color: #fcfafa;  line-opacity: 1; }');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  line-width: 0.5; line-color: ramp([something], (#A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99), (\'soccer\', \'basketball\', \'baseball\', \'handball\', \'hockey\'));  line-opacity: 1; }');
    });

    it('should escape single quotes correctly', function () {
      var data = this.dataview.get('data');
      data.push({ name: "Oh'Yeah" }); // eslint-disable-line 
      this.dataview.set('data', data);
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077; marker-fill: ramp([something], (#A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99), (\'soccer\', \'basketball\', \'baseball\', \'handball\', \'hockey\', \'Oh\\\'Yeah\'));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });

    it('should generate proper CartoCSS when Others is included', function () {
      var data = this.dataview.get('data');
      data.push({ name: "Others", agg: true });
      this.dataview.set('data', data);
      this.layer.set('initialStyle', '#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077;  marker-fill: #e49115;  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
      expect(this.categoryAutoStyler.getStyle()).toBe('#layer {  marker-line-width: 0.5;  marker-line-color: #fcfafa;  marker-line-opacity: 1;  marker-width: 6.076923076923077; marker-fill: ramp([something], (#A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99, #A5AA99), (\'soccer\', \'basketball\', \'baseball\', \'handball\', \'hockey\'));  marker-fill-opacity: 0.9;  marker-allow-overlap: true;}');
    });
  });
});
