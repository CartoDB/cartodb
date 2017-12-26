var Backbone = require('backbone');
var AutoStyler = require('../../../../../javascripts/deep-insights/widgets/auto-style/auto-styler');
var specHelper = require('../../spec-helper');

describe('src/widgets/auto-style/auto-styler', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    this.dataview = new Backbone.Model({
      column: 'something'
    });

    this.styles = {
      definition: {
        color: {
          range: ['#fadaba', '#fff'],
          opacity: 0.5
        }
      }
    };

    this.dataview.getDistributionType = jasmine.createSpy('disttype').and.returnValue('F');
    this.dataview.getUnfilteredDataModel = jasmine.createSpy('disttype').and.returnValue(this.dataview);
    this.AutoStyler = new AutoStyler(this.dataview, layer, {
      auto_style: this.styles
    });
  });

  describe('._getColor', function () {
    it('should return the auto_style color object', function () {
      expect(this.AutoStyler._getColor()).toEqual(this.styles.definition.color);
    });
  });

  describe('._getOpacity', function () {
    it('should return the opactity', function () {
      expect(this.AutoStyler._getOpacity()).toEqual(this.styles.definition.color.opacity);
    });
  });
});
