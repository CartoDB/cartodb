var cdb = require('cartodb.js');
var EditorMapView = require('../../../../../javascripts/cartodb3/editor/map/map-view');

describe('editor/map/map-view', function () {
  beforeEach(function () {
    this.view = new EditorMapView({
      visDefinitionModel: new cdb.core.Model({
        name: 'My super fun vis'
      }),
      modals: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('My super fun vis');
    expect(this.view.$el.text()).toContain('editor.layers.title');
    expect(this.view.$el.text()).toContain('editor.elements.title');
    expect(this.view.$el.text()).toContain('editor.widgets.title');
  });
});
