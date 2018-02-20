var LayerDefinitionModel = require('builder/data/layer-definition-model');
var PlainColorLayerView = require('builder/editor/layers/layer-views/plain-color-layer-view');

describe('editor/layers/layer-views/plain-color-layer-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      name: 'thename',
      color: '#FFFFFF'
    }, {
      configModel: {}
    });

    this.view = new PlainColorLayerView({
      model: this.model,
      stackLayoutModel: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title and description of layer', function () {
    expect(this.view.$el.text()).toContain('#FFFFFF');
    expect(this.view.$el.text()).toContain('editor.layers.color.title-label');
  });

  it('should render thumbnail image', function () {
    expect(this.view.$('.js-thumbnail').css('background-color')).toEqual('rgb(255, 255, 255)');
  });
});
