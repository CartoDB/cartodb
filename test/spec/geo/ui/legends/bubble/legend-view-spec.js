var Backbone = require('backbone');
var LegendViewBubble = require('../../../../../../src/geo/ui/legends/bubble/legend-view.js');
var BubbleLegendModel = require('../../../../../../src/geo/map/legends/bubble-legend-model.js');

describe('geo/ui/legends/bubbles/legend-view.js', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();

    this.model = new BubbleLegendModel({
      title: 'Bubble',
      type: 'bubble',
      avg: 30,
      fillColor: '#fabada',
      postHTMLSnippet: '',
      preHTMLSnippet: '',
      prefix: '',
      suffix: '',
      sizes: [2, 4, 8],
      values: [5, 10, 20, 40],
      visible: true
    }, {
      visModel: this.visModel
    });

    spyOn(this.model, 'isAvailable').and.returnValue(true);

    this.legendView = new LegendViewBubble({
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

    it('should render bubbles', function () {
      expect(this.legendView.$('.js-bubbleItem').length).toBe(3);
      expect(this.legendView._calculateBubbleSizes()).toEqual([100, 50, 25]);
    });

    it('should place avg properly', function () {
      // values: [5, 10, 20, 40];
      // range: [0, 25, 50, 100];

      this.model.set('avg', 5); // at the beginning of range [0, 25]
      expect(this.legendView._calculateAverageSize()).toBe(0);

      this.model.set('avg', 7.5); // in the middle of range [0, 25]
      expect(this.legendView._calculateAverageSize()).toBe(12.5);

      this.model.set('avg', 10); // at the end of range [0, 25]
      expect(this.legendView._calculateAverageSize()).toBe(25);

      this.model.set('avg', 15); // in the middle of range [25, 50]
      expect(this.legendView._calculateAverageSize()).toBe(37.5);

      this.model.set('avg', 19); // almost at the top of [25, 50]
      expect(this.legendView._calculateAverageSize()).toBe(25 + (50 - 25) * (9 / 10));

      this.model.set('avg', 25); // in a quarter of range [50, 100]
      expect(this.legendView._calculateAverageSize()).toBe(62.5);

      this.model.set('avg', 30); // in the middle of range [50, 100]
      expect(this.legendView._calculateAverageSize()).toBe(75); // (50 + (100 - 50) * 0.5)

      this.model.set('avg', 35); // in the three quarter of range [50, 100]
      expect(this.legendView._calculateAverageSize()).toBe(87.5); // (50 + (100 - 50) * (15 / 20)

      this.model.set('avg', 40);
      expect(this.legendView._calculateAverageSize()).toBe(100);
    });

    it('should render custom labels properly', function () {
      this.model.set('topLabel', 'foo');
      expect(this.legendView.$('.Bubble-numbersItem').length).toBe(2);
      expect(this.legendView.$('.Bubble-numbersItem').eq(0).text()).toBe('');
      expect(this.legendView.$('.Bubble-numbersItem').eq(1).text()).toBe('foo');
      expect(this.legendView.$('.Bubble-average').text()).toMatch(/^\s+$/);
    });
  });
});
