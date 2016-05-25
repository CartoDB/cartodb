var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerContentView = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-view');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layer-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);
    this.view = new LayerContentView({
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection(),
      modals: {},
      analysis: {},
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      editorModel: new EditorModel()
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(_.size(this.view._subviews)).toBe(2);
    expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toBe('foo');
    expect(this.view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
  });

  it('should render correctly when editing', function () {
    this.view._editorModel.set({edition: true});
    expect(this.view.$el.hasClass('is-dark')).toBe(true);
    this.view.$('.js-back').click();
    expect(this.view.$el.hasClass('is-dark')).toBe(false);
  });

  it('should go to prev stack layout step if arrow is clicked', function () {
    this.view.$('.js-back').click();
    expect(this.stackLayoutModel.prevStep).toHaveBeenCalledWith('layers');
  });

  afterEach(function () {
    this.view.clean();
  });
});
