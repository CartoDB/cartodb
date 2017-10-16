var Backbone = require('backbone');
var LegendViewCustom = require('../../../../../../src/geo/ui/legends/custom/legend-view.js');
var CustomLegendModel = require('../../../../../../src/geo/map/legends/custom-legend-model.js');

describe('geo/ui/legends/custom/legend-view.js', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();

    this.model = new CustomLegendModel({
      title: 'Foo',
      type: 'custom',
      html: '',
      postHTMLSnippet: '',
      preHTMLSnippet: '',
      items: [
        {
          title: 'foo',
          color: '#ffc6c4'
        }, {
          title: 'bar',
          color: '#ff6600'
        }, {
          title: 'bar',
          color: '#ff6600',
          icon: 'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/circle-stroked-18.svg'
        }
      ],
      visible: true
    }, {
      visModel: this.visModel
    });

    spyOn(this.model, 'isAvailable').and.returnValue(true);

    this.legendView = new LegendViewCustom({
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

    it('should render custom', function () {
      expect(this.legendView.$('li').length).toBe(3);
      expect(this.legendView.$('.Legend-categoryCircle').length).toBe(2);
      expect(this.legendView.$('.Legend-categoryIcon').length).toBe(1);
    });

    it('should render custom html', function () {
      this.model.set('html', '<ul><li>Foo</li></ul>');
      this.legendView.render();

      expect(this.legendView.$('li').length).toBe(1);
      expect(this.legendView.$('.Legend-categoryCircle').length).toBe(0);
      expect(this.legendView.$('li').eq(0).text()).toContain('Foo');
    });
  });
});
