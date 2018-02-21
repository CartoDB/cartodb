var LayerDefinitionModel = require('builder/data/layer-definition-model');
var BasemapHeaderView = require('builder/editor/layers/basemap-content-views/basemap-header-view');

describe('editor/layers/basemap-content-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename'
    }, {
      configModel: {},
      stateDefinitionModel: {}
    });

    this.view = new BasemapHeaderView({
      model: this.model,
      category: 'thecategory'
    });

    this.view.render();
  });

  it('should render title and default category of layer', function () {
    expect(this.view.$el.text()).toContain('thename editor.layers.basemap.by thecategory');
  });

  it('should update title and category', function () {
    expect(this.view.$el.text()).toContain('thename editor.layers.basemap.by thecategory');

    this.view.model.set('name', 'thename1');
    this.view.category = 'thecategory1';
    this.view.render();

    expect(this.view.$el.text()).toContain('thename1 editor.layers.basemap.by thecategory1');
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
