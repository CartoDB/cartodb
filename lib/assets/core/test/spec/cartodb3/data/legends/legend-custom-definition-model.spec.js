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
          color: '#f4b4d4'
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
    expect(attrs.definition.categories[2].icon).toContain('http://image.io/logo.svg');
  });
});
