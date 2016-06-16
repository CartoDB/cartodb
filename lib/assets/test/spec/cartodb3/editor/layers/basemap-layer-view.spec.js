var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var TiledLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/tiled-layer-view');

describe('editor/layers/layer-views/tiled-layer-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename',
      source: 'c0'
    }, {
      configModel: {}
    });

    this.view = new TiledLayerView({
      model: this.model,
      stackLayoutModel: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title of basemap', function () {
    expect(this.view.$el.text()).toContain('thename');
  });

  describe('draggable', function () {
    it('should not be initialized when view is rendered', function () {
      this.view.render();
      expect(this.view.$el.data('ui-draggable')).not.toBeDefined();
    });
  });

  describe('droppable', function () {
    it('should not be initialized when view is rendered', function () {
      this.view.render();
      expect(this.view.$el.data('ui-droppable')).not.toBeDefined();
    });
  });
});
