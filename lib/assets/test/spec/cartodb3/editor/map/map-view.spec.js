var cdb = require('cartodb.js');
var EditorMapView = require('../../../../../javascripts/cartodb3/editor/map/map-view');

describe('editor/map/map-view', function () {
  beforeEach(function () {
    this.view = new EditorMapView({
      visDefinitionModel: new cdb.core.Model({
        name: 'My super fun vis'
      }),
      layerDefinitionsCollection: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('My super fun vis');
    expect(this.view.$el.text()).toContain('layers');
    expect(this.view.$el.text()).toContain('elements');
    expect(this.view.$el.text()).toContain('widgets');
  });
});
