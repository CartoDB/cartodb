var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LegendCustomDefinitionModel = require('builder/data/legends/legend-custom-definition-model');
var LegendCustomFormDefinitionModel = require('builder/editor/layers/layer-content-views/legend/form/legend-custom-definition-form-model');
var FactoryModals = require('../../../../../factories/modals');

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
        modals: FactoryModals.createModalService()
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
