var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetView = require('../../../../../javascripts/cartodb3/editor/widgets/widget-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widget-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG districts homes',
      column: 'areas',
      operation: 'avg',
      layer_id: 'l-1'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      type: 'tile'
    }, {
      parse: true,
      configModel: configModel
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['nextStep']);
    this.view = new EditorWidgetView({
      modals: {},
      model: this.model,
      layer: this.layer,
      stackLayoutModel: this.stackLayoutModel,
      layerTableModel: {}
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('AVG districts home');
  });

  describe('when clicking on remove', function () {
    beforeEach(function () {
      spyOn(this.model, 'destroy');
      this.view.$('.js-remove').click();
    });

    it('should destroy view', function () {
      expect(this.model.destroy).toHaveBeenCalled();
    });

    describe('when destroyed', function () {
      beforeEach(function () {
        spyOn(this.view, 'clean');
        this.model.trigger('destroy');
      });

      it('should clean the view', function () {
        expect(this.view.clean).toHaveBeenCalled();
      });
    });
  });

  it('should go to next stack layout step if element is clicked', function () {
    this.view.$el.click();
    expect(this.stackLayoutModel.nextStep).toHaveBeenCalledWith(this.model, 'widgets');
  });

  afterEach(function () {
    this.view.clean();
  });
});
