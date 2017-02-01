var Backbone = require('backbone');
var CustomLegendViewChoropleth = require('../../../../../../src/geo/ui/legends/custom-choropleth/legend-view.js');
var ChoroplethLegendModel = require('../../../../../../src/geo/map/legends/choropleth-legend-model.js');

describe('geo/ui/legends/custom-choropleth/legend-view.js', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();

    this.model = new ChoroplethLegendModel({
      title: 'Foo',
      type: ' choropleth',
      postHTMLSnippet: '',
      preHTMLSnippet: '',
      prefix: '',
      suffix: '',
      leftLabel: 'low',
      rightLabel: 'high',
      colors: [
        {
          label: '1',
          value: '#ffc6c4'
        }, {
          label: '',
          value: '#ee919b'
        }, {
          label: '',
          value: '#cc607d'
        }, {
          label: '',
          value: '#9e3963'
        }, {
          label: '127',
          value: '#672044'
        }
      ],
      visible: true
    }, {
      visModel: this.visModel
    });

    spyOn(this.model, 'isAvailable').and.returnValue(true);

    this.legendView = new CustomLegendViewChoropleth({
      model: this.model,
      placeholderTemplate: function () {
        return '<p>Placeholder</p>';
      }
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.model.set('state', 'success');
      this.legendView.render();
    });

    it('should render choropleth', function () {
      expect(this.legendView.$('.Legend-choropleth').length).toBe(1);
      expect(this.legendView.$('h3').text()).toContain('Foo');
      expect(this.legendView.$('h3 ~ div p').length).toBe(2);
      expect(this.legendView.$('h3 ~ div p').length).toBe(2);
      expect(this.legendView.$('h3 ~ div p').eq(0).text()).toContain('low');
      expect(this.legendView.$('h3 ~ div p').eq(1).text()).toContain('high');
    });
  });
});
