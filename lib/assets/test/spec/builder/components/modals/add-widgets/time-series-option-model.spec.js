var _ = require('underscore');
var Backbone = require('backbone');
var TimeSeriesOptionModel = require('builder/components/modals/add-widgets/time-series/time-series-option-model');

describe('components/modals/add-widgets/time-series/time-series-option-model', function () {
  var model;
  var defaultOptions;
  var widgetDefinitionsCollection;
  var layerDefinitionModel;
  var analysisDefinitionNodeModel;
  var defaultTuples;
  var columnModel;

  var createModelFn = function (options, optionsTuples) {
    widgetDefinitionsCollection = new Backbone.Collection({});

    widgetDefinitionsCollection.addWidget = function () {
      return true;
    };

    layerDefinitionModel = new Backbone.Model({
      id: 'layerDefinitionModel1',
      style: new Backbone.Model()
    });

    columnModel = new Backbone.Model({
      name: 'line'
    });

    analysisDefinitionNodeModel = new Backbone.Model({
      id: 'analysesDefinitionNodeModel1'
    });

    defaultTuples = [{
      columnModel: columnModel,
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodeModel: analysisDefinitionNodeModel
    }];

    defaultOptions = {
      layer_index: '0',
      title: 'default-title',
      tuples: _.extend(defaultTuples, optionsTuples)
    };

    return new TimeSeriesOptionModel(_.extend(defaultOptions, options));
  };

  beforeEach(function () {
    model = createModelFn();
  });

  it('should have a "time-series" type by default', function () {
    expect(model.get('type')).toEqual('time-series');
  });

  it('should return the result of the "addWidget" function from the given widgetDefinitionsCollection', function () {
    var addWidgetSpy = spyOn(widgetDefinitionsCollection, 'addWidget').and.returnValue(true);

    model.save(widgetDefinitionsCollection);

    expect(addWidgetSpy).toHaveBeenCalled();
  });
});
