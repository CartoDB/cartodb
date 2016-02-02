var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data-models/layer-definition-model');

describe('widget-defintion-model', function () {
  beforeEach(function () {
    this.el = document.createElement('div');
    this.el.id = 'wdmtmp';
    document.body.appendChild(this.el);
    var dashboard = cdb.deepInsights.createDashboard('#wdmtmp', {
      user: {},
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        id: 'l-1',
        type: 'CartoDB'
      }],
      widgets: []
    });
    this.layerModel = dashboard.vis.map.layers.get('l-1');
    this.layerDefModel = new LayerDefinitionModel({
      id: 'l-1'
    }, {
      layerModel: this.layerModel
    });
    this.layerDefModel.url = function () {
      return '/layers/' + this.id;
    };

    this.dashboardWidgetsService = dashboard.widgets;
    this.widgetDefModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title'
    }, {
      layerDefinitionModel: this.layerDefModel,
      dashboardWidgetsService: this.dashboardWidgetsService
    });
  });

  afterEach(function () {
    document.body.removeChild(this.el);
  });

  it('should have a url pointing under layers API endpoint', function () {
    expect(this.widgetDefModel.url()).toEqual('/layers/l-1/widgets/w-456');

    // when no id:
    this.widgetDefModel.set('id', null);
    expect(this.widgetDefModel.url()).toEqual('/layers/l-1/widgets');
  });

  describe('when it defines a formula widget', function () {
    beforeEach(function () {
      this.widgetDefModel.set({
        type: 'formula',
        options: {
          column: 'col',
          operation: 'avg'
        }
      });
    });

    describe('when is saved', function () {
      beforeEach(function () {
        spyOn(this.dashboardWidgetsService, 'createFormulaModel').and.callThrough();
        this.widgetDefModel.trigger('sync');
      });

      it('should create the widget model', function () {
        expect(this.dashboardWidgetsService.createFormulaModel).toHaveBeenCalled();
        var args = this.dashboardWidgetsService.createFormulaModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({ title: 'some title' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ column: 'col' }));
        expect(args[0]).toEqual(jasmine.objectContaining({ operation: 'avg' }));
        expect(args[1]).toBe(this.layerModel);
        expect(this.widgetDefModel._widgetModel).toBeDefined();
      });
    });
  });
});
