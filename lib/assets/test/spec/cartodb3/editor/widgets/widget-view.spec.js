var cdb = require('cartodb-deep-insights.js');
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
      options: {
        column: 'areas',
        operation: 'avg'
      }
    }, {
      configModel: configModel,
      layerDefinitionModel: new cdb.core.Model(),
      dashboardWidgetsService: new cdb.core.Model()
    });

    this.view = new EditorWidgetView({
      model: this.model,
      stackLayoutModel: { nextStep: function () {} },
      tableModel: {}
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

  afterEach(function () {
    this.view.clean();
  });
});
