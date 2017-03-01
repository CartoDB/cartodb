var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var LegendDefinitionModel = require('../../../../../javascripts/cartodb3/data/legends/legend-custom-definition-model');

describe('data/legends/legend-custom-defintion-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    });

    this.model = new LegendDefinitionModel({
      items: [
        {
          title: '',
          color: '#fabada'
        },
        {
          title: 'Foo',
          color: '#f4b4d4',
          icon: 'http://image.io/building.png'
        },
        {
          title: 'Bar',
          color: '#f4b4d4',
          image: 'http://image.io/logo.svg'
        }
      ]
    }, {
      configModel: configModel,
      layerDefinitionModel: layerDef1,
      vizId: 'v-123'
    });
  });

  it('should toJSON properly', function () {
    var attrs = this.model.toJSON();
    expect(attrs.definition).toBeDefined();
    expect(_.isArray(attrs.definition.categories)).toBe(true);
    expect(attrs.definition.categories.length).toBe(3);
    expect(attrs.definition.categories[0].title).toContain('editor.legend.legend-form.untitled');
    expect(attrs.definition.categories[1].title).toContain('Foo');
    expect(attrs.definition.categories[1].icon).toContain('http://image.io/building.png');
    expect(attrs.definition.categories[2].icon).toContain('http://image.io/logo.svg');
  });

  describe('inheritStyleCategories', function () {
    it('should return proper output when fixed provided', function () {
      var color = {
        fixed: '#fabada',
        image: 'icon.svg'
      };

      var items = this.model.inheritStyleCategories(color);

      expect(items.length).toBe(1);
      expect(items[0].color).toEqual(color.fixed);
      expect(items[0].icon).toEqual(color.image);
      expect(items[0].title).toEqual('');
    });

    it('should return proper output when range provided', function () {
      var color = {
        range: ['#fabada', '#c0ffee', '#0ff1ce'],
        domain: ['Asturias', 'Starbucks', ''],
        images: ['', 'starbucks.png', '']
      };

      var items = this.model.inheritStyleCategories(color);

      expect(items.length).toBe(3);
      expect(items[0].color).toEqual('#fabada');
      expect(items[0].title).toEqual('Asturias');
      expect(items[0].icon).toEqual('');
      expect(items[1].color).toEqual('#c0ffee');
      expect(items[1].title).toEqual('Starbucks');
      expect(items[1].icon).toEqual('starbucks.png');
      expect(items[2].color).toEqual('#0ff1ce');
      expect(items[2].title).toEqual('');
      expect(items[2].icon).toEqual('');
    });
  });
});
