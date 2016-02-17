var cdb = require('cartodb.js');
var EditorMapView = require('../../../../../javascripts/cartodb3/editor/map/map-view');

describe('editor/map/map-view', function () {
  beforeEach(function () {
    this.view = new EditorMapView({
      visDefinitionModel: new cdb.core.View(),
      layerDefinitionsCollection: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('LAYERS');
    expect(this.view.$el.text()).toContain('ELEMENTS');
    expect(this.view.$el.text()).toContain('WIDGETS');
  });
});
