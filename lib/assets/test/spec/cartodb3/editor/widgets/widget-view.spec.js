var EditorWidgetView = require('../../../../../javascripts/cartodb3/editor/widgets/widget-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');
var cdb = require('cartodb-deep-insights.js');

describe('editor/widgets/widget-view', function () {
  beforeEach(function () {
    this.model = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG districts homes',
      options: {
        column: 'areas',
        operation: 'avg'
      }
    }, {
      baseUrl: '/u/pepe',
      layerDefinitionModel: new cdb.core.Model(),
      dashboardWidgetsService: new cdb.core.Model()
    });

    this.view = new EditorWidgetView({
      model: this.model,
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
