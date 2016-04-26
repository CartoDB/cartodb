var CategoryAutoStyler = require('../../../src/widgets/auto-style/category.js');
var Backbone = require('backbone');

describe('src/widgets/auto-style/category', function () {
  beforeEach(function () {
    this.dataview = new Backbone.Model({
      allCategoryNames: ['a', 'b', 'c'],
      column: 'something' 
    })

    this.layer = this.dataview.layer = jasmine.createSpyObj('layer', ['getGeometryType']);
    this.categoryAutoStyler = new CategoryAutoStyler(this.dataview);
  });

  describe('.getStyle', function () {
    it('should generate the right styles when layer has polygons', function () {
      this.layer.getGeometryType.and.returnValue('polygon');
      expect(this.categoryAutoStyler.getStyle().replace(/\s/g, "")).toEqual('#layer{polygon-fill:#CCC;polygon-opacity:0.6;line-color:#FFF;line-width:0.3;line-opacity:0.3;[something=\'a\']{polygon-fill:#CCC;}[something=\'b\']{polygon-fill:#CCC;}[something=\'c\']{polygon-fill:#CCC;}}');
    })

    it('should generate the right styles when layer has points', function () {
      this.layer.getGeometryType.and.returnValue('marker');
      expect(this.categoryAutoStyler.getStyle().replace(/\s/g, "")).toEqual('#layer{marker-width:10;marker-fill-opacity:0.8;marker-fill:#CCC;marker-line-color:#fff;marker-allow-overlap:true;marker-line-width:0.3;marker-line-opacity:0.8;[something=\'a\']{marker-fill:#CCC;}[something=\'b\']{marker-fill:#CCC;}[something=\'c\']{marker-fill:#CCC;}}');
    })

    it('should generate the right styles when layer has lines', function () {
      this.layer.getGeometryType.and.returnValue('line');
      expect(this.categoryAutoStyler.getStyle().replace(/\s/g, "")).toEqual('#layer{line-color:#CCC;line-width:0.3;line-opacity:0.3;[something=\'a\']{line-color:#CCC;}[something=\'b\']{line-color:#CCC;}[something=\'c\']{line-color:#CCC;}}');
    })
  });
});