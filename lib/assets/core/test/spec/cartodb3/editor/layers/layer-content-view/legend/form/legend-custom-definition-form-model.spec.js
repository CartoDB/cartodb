var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../javascripts/cartodb3/data/user-model');
var LegendCustomDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/legends/legend-custom-definition-model');
var LegendCustomFormDefinitionModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/form/legend-custom-definition-form-model');

describe('editor/layers/layer-content-views/legends/form/legend-custom-definition-model', function () {
  var legendDefinitionModel;
  var legendFormModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    legendDefinitionModel = new LegendCustomDefinitionModel({
      title: 'Foo',
      items: [{
        title: 'foo',
        color: '#fabada',
        icon: 'http://image.io/foo.svg'
      }, {
        title: 'bar',
        color: '#abadaf',
        icon: 'http://image.io/bar.svg'
      }, {
        title: 'baz',
        color: '#ababab',
        icon: 'http://image.io/baz.svg'
      }]
    }, {
      layerDefinitionModel: new Backbone.Model(),
      configModel: configModel,
      vizId: 1
    });

    legendFormModel = new LegendCustomFormDefinitionModel(
      _.pick(legendDefinitionModel.attributes, 'title', 'items'), {
        legendDefinitionModel: legendDefinitionModel,
        userModel: userModel,
        configModel: configModel,
        modals: {}
      }
    );
  });

  it('should initialize items correctly', function () {
    var items = legendFormModel.get('items');
    expect(items.length).toBe(3);
    expect(items[0].fill.color.fixed).toBe('#fabada');
    expect(items[0].fill.color.image).toBe('http://image.io/foo.svg');
    expect(items[1].fill.color.fixed).toBe('#abadaf');
    expect(items[1].fill.color.image).toBe('http://image.io/bar.svg');
    expect(items[2].fill.color.fixed).toBe('#ababab');
    expect(items[2].fill.color.image).toBe('http://image.io/baz.svg');
  });

  it('should parse items correctly', function () {
    var items = legendFormModel.toJSON().items;
    expect(items.length).toBe(3);
    expect(items[0].color).toBe('#fabada');
    expect(items[0].image).toBe('http://image.io/foo.svg');
    expect(items[1].color).toBe('#abadaf');
    expect(items[1].image).toBe('http://image.io/bar.svg');
    expect(items[2].color).toBe('#ababab');
    expect(items[2].image).toBe('http://image.io/baz.svg');
  });
});
