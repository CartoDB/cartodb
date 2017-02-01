var Backbone = require('backbone');
var LegendViewChoropleth = require('../../../../../../src/geo/ui/legends/choropleth/legend-view.js');
var ChoroplethLegendModel = require('../../../../../../src/geo/map/legends/choropleth-legend-model.js');

describe('geo/ui/legends/choropleth/legend-view.js', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();

    this.model = new ChoroplethLegendModel({
      title: 'Foo',
      type: ' choropleth',
      avg: 64,
      postHTMLSnippet: '',
      preHTMLSnippet: '',
      prefix: '',
      suffix: '',
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
      min: 1,
      max: 127,
      visible: true
    }, {
      visModel: this.visModel
    });

    spyOn(this.model, 'isAvailable').and.returnValue(true);

    this.legendView = new LegendViewChoropleth({
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
      expect(this.legendView.$('.Legend-choroplethAverage').length).toBe(1);
      expect(this.legendView.$('.Legend-choroplethAverage').text()).toContain('64');
      expect(this.legendView.$('h3').text()).toContain('Foo');
      expect(this.legendView.$('h3 ~ div p').length).toBe(2);
      expect(this.legendView.$('h3 ~ div p').length).toBe(2);
      expect(this.legendView.$('h3 ~ div p').eq(0).text()).toContain('1');
      expect(this.legendView.$('h3 ~ div p').eq(1).text()).toContain('127');
    });

    it('should hide AVG if custom labels', function () {
      this.model.set('leftLabel', 'Bar');

      expect(this.legendView.$('.Legend-choroplethAverage').length).toBe(0);
      expect(this.legendView.$('h3 ~ div p').eq(0).text()).toContain('Bar');
      expect(this.legendView.$('h3 ~ div p').eq(1).text()).toContain('127');
    });
  });
});
